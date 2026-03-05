# Go Backend Services Guidelines

Standards and best practices for Go backend services (`services/`, `pkg/`).

## Table of Contents

- [Go Version](#go-version)
- [Project Structure](#project-structure)
- [Package Organization](#package-organization)
- [Error Handling](#error-handling)
- [Concurrency](#concurrency)
- [Context Usage](#context-usage)
- [Database Operations](#database-operations)
- [Testing](#testing)

---

## Go Version

**Minimum version**: Go 1.24.0

```go
// go.mod
module github.com/yourorg/ai-aoe-monorepo

go 1.24
```

---

## Project Structure

### Standard Layout

```
services/
├── monitor/
│   ├── cmd/
│   │   └── monitor/
│   │       └── main.go          # Entry point
│   ├── internal/
│   │   ├── service/
│   │   │   └── monitor.go       # Business logic
│   │   └── config/
│   │       └── config.go        # Configuration
│   └── go.mod
├── signer/
│   └── ...
└── submitter/
    └── ...

pkg/
├── storage/                     # Shared database package
├── ethereum/                    # Ethereum client package
├── solana/                      # Solana client package
└── config/                      # Shared configuration
```

### Naming Conventions

- **Packages**: lowercase, single word - `storage`, `ethereum`
- **Files**: lowercase with underscores - `monitor_service.go`, `eth_client.go`
- **Functions**: CamelCase - `ProcessTransaction`, `getBalance`
- **Interfaces**: end with `-er` - `Processor`, `Validator`, `Storage`
- **Constants**: CamelCase or UPPER_CASE - `MaxRetries` or `MAX_RETRIES`

---

## Package Organization

### Internal vs Pkg

**`internal/`**: Service-specific, not importable by other services

```go
// services/monitor/internal/service/monitor.go
package service

type MonitorService struct {
    // Service-specific implementation
}
```

**`pkg/`**: Shared across services, importable

```go
// pkg/storage/postgres.go
package storage

type PostgresStorage struct {
    // Shared storage implementation
}
```

### Interface-First Design

```go
// ✅ GOOD: Define interface in consumer package
package monitor

type Storage interface {
    GetTransaction(ctx context.Context, hash string) (*Transaction, error)
    SaveTransaction(ctx context.Context, tx *Transaction) error
}

// Implementation in separate package
package postgres

type PostgresStorage struct {
    pool *pgxpool.Pool
}

func (s *PostgresStorage) GetTransaction(ctx context.Context, hash string) (*Transaction, error) {
    // Implementation
}
```

---

## Error Handling

### Error Wrapping

**Always wrap errors with context**

```go
// ✅ GOOD: Wrap errors with fmt.Errorf and %w
func (s *Service) ProcessTransaction(ctx context.Context, txHash string) error {
    tx, err := s.storage.GetTransaction(ctx, txHash)
    if err != nil {
        return fmt.Errorf("failed to get transaction %s: %w", txHash, err)
    }

    if err := s.validator.Validate(tx); err != nil {
        return fmt.Errorf("transaction validation failed for %s: %w", txHash, err)
    }

    return nil
}

// ❌ BAD: Return naked errors
func (s *Service) ProcessTransaction(ctx context.Context, txHash string) error {
    tx, err := s.storage.GetTransaction(ctx, txHash)
    if err != nil {
        return err  // Lost context!
    }
    return nil
}
```

### Error Checking

```go
// ✅ GOOD: Check all errors
result, err := doSomething()
if err != nil {
    return fmt.Errorf("operation failed: %w", err)
}

// ❌ BAD: Ignoring errors
result, _ := doSomething()  // Never ignore errors!

// ✅ ACCEPTABLE: Intentionally ignoring with comment
_, _ = fmt.Fprintf(w, "message")  // Error logged elsewhere
```

### Custom Error Types

```go
// ✅ GOOD: Custom error types for specific handling
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}

// Usage
func Validate(tx *Transaction) error {
    if tx.Amount == 0 {
        return &ValidationError{
            Field:   "amount",
            Message: "amount cannot be zero",
        }
    }
    return nil
}

// Check for specific error type
if err := Validate(tx); err != nil {
    var valErr *ValidationError
    if errors.As(err, &valErr) {
        // Handle validation error specifically
        log.Printf("Validation failed: %s", valErr.Field)
    }
    return err
}
```

---

## Concurrency

### Goroutines

```go
// ✅ GOOD: Use WaitGroup for synchronization
func (s *Service) ProcessBatch(ctx context.Context, txHashes []string) error {
    var wg sync.WaitGroup
    errChan := make(chan error, len(txHashes))

    for _, hash := range txHashes {
        wg.Add(1)
        go func(h string) {
            defer wg.Done()
            if err := s.ProcessTransaction(ctx, h); err != nil {
                errChan <- err
            }
        }(hash)
    }

    wg.Wait()
    close(errChan)

    // Collect errors
    var errs []error
    for err := range errChan {
        errs = append(errs, err)
    }

    if len(errs) > 0 {
        return fmt.Errorf("batch processing failed: %v", errs)
    }
    return nil
}
```

### Channels

```go
// ✅ GOOD: Buffered channel with proper closure
func (s *Service) StartWorkers(ctx context.Context, numWorkers int) {
    jobs := make(chan string, 100)  // Buffered channel

    // Start workers
    for i := 0; i < numWorkers; i++ {
        go s.worker(ctx, jobs)
    }

    // Send jobs
    go func() {
        defer close(jobs)  // Close when done sending
        for {
            select {
            case <-ctx.Done():
                return
            case jobs <- nextJob():
                // Job sent
            }
        }
    }()
}

func (s *Service) worker(ctx context.Context, jobs <-chan string) {
    for {
        select {
        case <-ctx.Done():
            return
        case job, ok := <-jobs:
            if !ok {
                return  // Channel closed
            }
            s.ProcessTransaction(ctx, job)
        }
    }
}
```

---

## Context Usage

### Context Propagation

**Always propagate context through call chain**

```go
// ✅ GOOD: Context as first parameter
func (s *Service) ProcessTransaction(ctx context.Context, txHash string) error {
    // Pass context to all downstream calls
    tx, err := s.storage.GetTransaction(ctx, txHash)
    if err != nil {
        return err
    }

    if err := s.ethereum.SubmitTransaction(ctx, tx); err != nil {
        return err
    }

    return nil
}

// ❌ BAD: No context
func (s *Service) ProcessTransaction(txHash string) error {
    // Can't handle cancellation or timeouts
}
```

### Context Cancellation

```go
// ✅ GOOD: Handle context cancellation
func (s *Service) ProcessWithTimeout(txHash string) error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    return s.ProcessTransaction(ctx, txHash)
}

// In ProcessTransaction
func (s *Service) ProcessTransaction(ctx context.Context, txHash string) error {
    select {
    case <-ctx.Done():
        return ctx.Err()  // Return cancellation error
    default:
        // Continue processing
    }

    // ... processing logic
}
```

---

## Database Operations

### Connection Pool

```go
// ✅ GOOD: Use pgxpool for connection pooling
import (
    "github.com/jackc/pgx/v5/pgxpool"
)

func NewStorage(ctx context.Context, connString string) (*PostgresStorage, error) {
    config, err := pgxpool.ParseConfig(connString)
    if err != nil {
        return nil, fmt.Errorf("failed to parse connection string: %w", err)
    }

    // Configure pool
    config.MaxConns = 25
    config.MinConns = 5
    config.MaxConnLifetime = time.Hour
    config.MaxConnIdleTime = 30 * time.Minute

    pool, err := pgxpool.NewWithConfig(ctx, config)
    if err != nil {
        return nil, fmt.Errorf("failed to create connection pool: %w", err)
    }

    return &PostgresStorage{pool: pool}, nil
}
```

### Transactions

```go
// ✅ GOOD: Use transactions with proper rollback
func (s *PostgresStorage) UpdateTransaction(ctx context.Context, tx *Transaction) error {
    pgxTx, err := s.pool.Begin(ctx)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer pgxTx.Rollback(ctx)  // Rollback if commit not called

    // Update transaction
    _, err = pgxTx.Exec(ctx,
        "UPDATE transactions SET status = $1, updated_at = $2 WHERE hash = $3",
        tx.Status, time.Now(), tx.Hash,
    )
    if err != nil {
        return fmt.Errorf("failed to update transaction: %w", err)
    }

    // Insert event
    _, err = pgxTx.Exec(ctx,
        "INSERT INTO events (tx_hash, event_type, timestamp) VALUES ($1, $2, $3)",
        tx.Hash, "status_updated", time.Now(),
    )
    if err != nil {
        return fmt.Errorf("failed to insert event: %w", err)
    }

    if err := pgxTx.Commit(ctx); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }

    return nil
}
```

---

## Testing

### Table-Driven Tests

```go
func TestValidateTransaction(t *testing.T) {
    tests := []struct {
        name    string
        tx      *Transaction
        wantErr bool
    }{
        {
            name: "valid transaction",
            tx: &Transaction{
                Hash:   "0x123",
                Amount: 100,
                Status: "pending",
            },
            wantErr: false,
        },
        {
            name: "zero amount",
            tx: &Transaction{
                Hash:   "0x123",
                Amount: 0,
                Status: "pending",
            },
            wantErr: true,
        },
        {
            name: "empty hash",
            tx: &Transaction{
                Hash:   "",
                Amount: 100,
                Status: "pending",
            },
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateTransaction(tt.tx)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateTransaction() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Mocking

```go
// Define interface
type Storage interface {
    GetTransaction(ctx context.Context, hash string) (*Transaction, error)
}

// Mock implementation for tests
type MockStorage struct {
    GetTransactionFunc func(ctx context.Context, hash string) (*Transaction, error)
}

func (m *MockStorage) GetTransaction(ctx context.Context, hash string) (*Transaction, error) {
    if m.GetTransactionFunc != nil {
        return m.GetTransactionFunc(ctx, hash)
    }
    return nil, nil
}

// Use in test
func TestProcessTransaction(t *testing.T) {
    mock := &MockStorage{
        GetTransactionFunc: func(ctx context.Context, hash string) (*Transaction, error) {
            return &Transaction{Hash: hash, Amount: 100}, nil
        },
    }

    service := NewService(mock)
    err := service.ProcessTransaction(context.Background(), "0x123")
    if err != nil {
        t.Errorf("unexpected error: %v", err)
    }
}
```

---

## Summary

Key takeaways for Go development:

1. **Error Handling**: Always wrap errors with context using fmt.Errorf and %w
2. **Context**: Propagate context through all function calls
3. **Concurrency**: Use goroutines safely with WaitGroups and channels
4. **Database**: Use connection pools and transactions properly
5. **Interfaces**: Define interfaces in consumer packages
6. **Testing**: Use table-driven tests and mocking
7. **Project Structure**: Follow standard layout (cmd/, internal/, pkg/)

For more details, see:

- [General Guidelines](./00-general-guidelines.md)
- [Testing Standards](./06-testing.md)
- [Effective Go](https://go.dev/doc/effective_go)
