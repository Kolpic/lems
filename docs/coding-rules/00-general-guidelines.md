# General Guidelines

Cross-language principles and best practices that apply to all code in the Age of Empires Bridge monorepo.

## Table of Contents

- [Core Principles](#core-principles)
- [Security Guidelines](#security-guidelines)
- [Documentation Standards](#documentation-standards)
- [Error Handling](#error-handling)
- [Code Review Process](#code-review-process)
- [Performance Considerations](#performance-considerations)

---

## Core Principles

### 1. Clarity Over Cleverness

**Principle**: Write code that is easy to understand and maintain.

```typescript
// ✅ GOOD: Clear and explicit
function calculateTotalWithFee(amount: number, feePercentage: number): number {
  const fee = amount * (feePercentage / 100);
  return amount + fee;
}

// ❌ BAD: Clever but confusing
const calc = (a: number, f: number) => a * (1 + f / 100);
```

**Guidelines**:

- Use descriptive variable and function names
- Avoid abbreviations unless universally understood (e.g., `id`, `url`)
- Break complex operations into smaller, named steps
- Prefer explicit over implicit behavior

### 2. Consistency

**Principle**: Follow established patterns and conventions.

- Use language-specific idioms (Go interfaces, Rust traits, React hooks)
- Match existing code style in the file/module you're modifying
- Use the same naming patterns across similar concepts
- Follow the principle of least surprise

### 3. Don't Repeat Yourself (DRY)

**Principle**: Avoid code duplication, but don't over-abstract prematurely.

```typescript
// ✅ GOOD: Shared helper function
async function fetchAndMapTransactions(
  walletAddress: string,
  page: number,
  perPage: number,
  signal?: AbortSignal
): Promise<{ transactions: Transaction[]; totalPages: number }> {
  const response = await fetchHistory(walletAddress, page, perPage, signal);
  const transactions = response.data.map(mapTransaction).filter(Boolean);
  return { transactions, totalPages: response.pagination.totalPages };
}

// Now used in multiple places: initial load, polling, post-claim refresh
```

**When to abstract**:

- After you've written the same code 2-3 times
- When the abstraction makes the code clearer
- When the pattern is stable and unlikely to diverge

**When NOT to abstract**:

- Premature optimization before patterns emerge
- When abstraction adds more complexity than it removes
- When code paths are similar but semantically different

### 4. Fail Fast, Fail Loud

**Principle**: Detect and report errors as early as possible.

```go
// ✅ GOOD: Validate inputs immediately
func ProcessTransaction(ctx context.Context, txHash string) error {
    if txHash == "" {
        return fmt.Errorf("transaction hash cannot be empty")
    }
    if len(txHash) < 64 {
        return fmt.Errorf("invalid transaction hash length: %d", len(txHash))
    }
    // Continue with processing...
}

// ❌ BAD: Silent failures or late detection
func ProcessTransaction(ctx context.Context, txHash string) error {
    // No validation, will fail mysteriously later
    tx, _ := db.GetTransaction(txHash) // Ignoring error!
    // ...
}
```

---

## Security Guidelines

### Critical Rules

#### ❌ NEVER

1. **Commit secrets or sensitive data**

   ```bash
   # Bad examples:
   - Private keys or mnemonics
   - API keys or tokens
   - Database passwords
   - AWS credentials
   ```

   **Use**: Environment variables, AWS Secrets Manager, or similar

2. **Bypass security checks**

   ```typescript
   // ❌ BAD
   // @ts-ignore - Bypassing type check
   const unsafeData = apiResponse as any;
   ```

3. **Deploy untested changes to smart contracts**

   - Always run full test suite
   - Perform manual testing on testnet
   - Get peer review for contract changes

4. **Ignore compiler warnings**
   - Treat warnings as errors
   - Fix the root cause, don't suppress
   - Document why if suppression is absolutely necessary

#### ✅ ALWAYS

1. **Validate all external inputs**

   ```typescript
   // ✅ GOOD
   function bridgeTokens(amount: string, address: string) {
     // Validate amount
     if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
       throw new Error("Invalid amount");
     }

     // Validate address format
     if (!isValidEthereumAddress(address)) {
       throw new Error("Invalid Ethereum address");
     }

     // Proceed with bridging...
   }
   ```

2. **Handle errors explicitly**

   ```go
   // ✅ GOOD
   tx, err := db.GetTransaction(ctx, txHash)
   if err != nil {
       return fmt.Errorf("failed to get transaction: %w", err)
   }

   // ❌ BAD
   tx, _ := db.GetTransaction(ctx, txHash) // Ignoring errors!
   ```

3. **Use reentrancy guards in smart contracts**

   ```solidity
   // ✅ GOOD
   function claim(...) external nonReentrant whenNotPaused {
       // Safe from reentrancy attacks
   }
   ```

4. **Follow Checks-Effects-Interactions (CEI) pattern**

   ```solidity
   function withdraw(uint256 amount) external {
       // 1. CHECKS
       require(balances[msg.sender] >= amount, "Insufficient balance");

       // 2. EFFECTS
       balances[msg.sender] -= amount;

       // 3. INTERACTIONS
       (bool success, ) = msg.sender.call{value: amount}("");
       require(success, "Transfer failed");
   }
   ```

### Input Validation Checklist

For all user inputs and external data:

- [ ] **Type validation**: Is it the expected type?
- [ ] **Range validation**: Is it within acceptable bounds?
- [ ] **Format validation**: Does it match the expected format (address, hash, etc.)?
- [ ] **Business logic validation**: Is it valid in the current state/context?
- [ ] **Sanitization**: Remove or escape dangerous characters if necessary

### Secrets Management

**Environment Variables**:

```typescript
// ✅ GOOD: Use environment variables
const apiKey = process.env.VITE_API_KEY;
if (!apiKey) {
  throw new Error("VITE_API_KEY environment variable is required");
}

// ❌ BAD: Hardcoded secrets
const apiKey = "sk_live_abc123..."; // NEVER DO THIS!
```

**Git Protection**:

```gitignore
# Always in .gitignore:
.env
.env.local
*.key
*.pem
secrets/
credentials.json
```

---

## Documentation Standards

### Code Documentation

**Every public function/method/contract MUST have documentation.**

#### TypeScript/JavaScript (JSDoc)

```typescript
/**
 * Fetches transaction history for a wallet address
 *
 * @param address - The wallet address (Ethereum or Solana)
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of results per page (default: 10, max: 100)
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to transaction history with pagination
 * @throws {Error} If address is invalid or API request fails
 *
 * @example
 * const history = await fetchHistory('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 1, 10)
 */
export async function fetchHistory(
  address: string,
  page: number = 1,
  limit: number = 10,
  signal?: AbortSignal
): Promise<TransactionHistoryResponse> {
  // Implementation...
}
```

#### Solidity (NatSpec)

```solidity
/// @notice Burns tokens from the sender and initiates a cross-chain bridge
/// @dev Implements CEI pattern for reentrancy protection
/// @param token The ERC20 token address to bridge
/// @param amount The amount of tokens to burn (in token's smallest unit)
/// @param destinationAddress The destination address on the target chain
/// @custom:security Requires token to be in supportedTokens mapping
/// @custom:security Uses nonReentrant modifier to prevent reentrancy attacks
function bridge(
    address token,
    uint256 amount,
    string calldata destinationAddress
) external whenNotPaused nonReentrant {
    // Implementation...
}
```

#### Rust (rustdoc)

```rust
/// Claims tokens on Solana after bridging from Ethereum
///
/// # Arguments
///
/// * `ctx` - The program context containing all accounts
/// * `message` - The 104-byte bridge message from Ethereum
/// * `signature` - The validator's signature of the message
///
/// # Security
///
/// - Validates Ed25519 signature from trusted validator
/// - Checks message hash matches stored hash
/// - Prevents double-claiming via status check
/// - Implements CEI pattern for reentrancy safety
///
/// # Errors
///
/// Returns error if:
/// - Signature verification fails
/// - Transaction already claimed
/// - Token minting fails
pub fn claim(
    ctx: Context<Claim>,
    message: Vec<u8>,
    signature: Vec<u8>,
) -> Result<()> {
    // Implementation...
}
```

#### Go (godoc)

```go
// ProcessTransaction processes a bridge transaction from the queue.
// It verifies signatures, updates status, and submits to the blockchain.
//
// The function follows these steps:
// 1. Retrieves transaction from database
// 2. Validates transaction state
// 3. Submits to appropriate blockchain
// 4. Updates transaction status
//
// Returns an error if any step fails. The error is wrapped with context
// for debugging.
func (s *Service) ProcessTransaction(ctx context.Context, txHash string) error {
    // Implementation...
}
```

### Documentation Coverage Requirements

- **100%** of public APIs (functions, methods, contracts, structs)
- **Security-critical code** must document assumptions and invariants
- **Complex algorithms** should explain the approach
- **Workarounds/hacks** must explain WHY and link to issues

### README Files

Every major directory should have a README.md:

```
apps/frontend/README.md         - Setup, development, deployment
contracts/ethereum/README.md    - Contract architecture, deployment
contracts/solana/README.md      - Program structure, testing
services/monitor/README.md      - Service purpose, configuration
pkg/storage/README.md           - Package usage, examples
```

---

## Error Handling

### Principles

1. **Be specific**: Use typed errors, not generic strings
2. **Add context**: Wrap errors with additional information
3. **Handle at the right level**: Don't pass errors up unnecessarily
4. **Log appropriately**: Info for expected, Error for unexpected

### Error Handling Patterns

#### TypeScript/JavaScript

```typescript
// ✅ GOOD: Specific error with context
try {
  const tx = await fetchTransaction(txHash);
  if (!tx) {
    throw new Error(`Transaction not found: ${txHash}`);
  }
  return tx;
} catch (err) {
  if (err instanceof Error && err.name === "AbortError") {
    // Expected - request was cancelled
    console.log("Request aborted");
    return null;
  }
  // Unexpected error - log and rethrow with context
  console.error("[fetchTransaction] Failed:", err);
  throw new Error(`Failed to fetch transaction ${txHash}: ${err.message}`);
}

// ❌ BAD: Silent failures
try {
  const tx = await fetchTransaction(txHash);
  return tx;
} catch (err) {
  return null; // Hiding the error!
}
```

#### Go

```go
// ✅ GOOD: Wrap errors with context
func (s *Service) ProcessTransaction(ctx context.Context, txHash string) error {
    tx, err := s.storage.GetTransaction(ctx, txHash)
    if err != nil {
        return fmt.Errorf("failed to get transaction %s: %w", txHash, err)
    }

    if err := s.validator.Validate(tx); err != nil {
        return fmt.Errorf("transaction validation failed: %w", err)
    }

    return nil
}

// ❌ BAD: Losing error context
func (s *Service) ProcessTransaction(ctx context.Context, txHash string) error {
    tx, err := s.storage.GetTransaction(ctx, txHash)
    if err != nil {
        return err // No context about what failed!
    }
    return nil
}
```

#### Solidity

```solidity
// ✅ GOOD: Custom errors with parameters
error TokenNotSupported(address token);
error InsufficientAmount(uint256 provided, uint256 required);

function bridge(address token, uint256 amount, string calldata dest) external {
    if (!supportedTokens[token]) {
        revert TokenNotSupported(token);
    }
    if (amount < MIN_BRIDGE_AMOUNT) {
        revert InsufficientAmount(amount, MIN_BRIDGE_AMOUNT);
    }
    // ...
}

// ❌ BAD: Generic require strings
require(supportedTokens[token], "Token not supported");
require(amount >= MIN_BRIDGE_AMOUNT, "Amount too low");
```

---

## Code Review Process

### Before Requesting Review

**Self-review checklist**:

- [ ] Code follows language-specific style guide
- [ ] All functions have documentation
- [ ] Tests are included and passing
- [ ] No commented-out code (remove or explain)
- [ ] No debugging console.log/println statements
- [ ] No hardcoded values that should be configurable
- [ ] Error handling is explicit and meaningful
- [ ] Security considerations addressed

### As a Reviewer

**Focus areas**:

1. **Correctness**: Does it work as intended?
2. **Security**: Are there vulnerabilities or risks?
3. **Performance**: Are there obvious bottlenecks?
4. **Maintainability**: Is it clear and well-documented?
5. **Testing**: Are edge cases covered?

**Review tone**:

- Be respectful and constructive
- Ask questions rather than making demands
- Suggest improvements, don't just criticize
- Acknowledge good patterns and clever solutions

**Comment prefixes**:

- `nit:` - Minor style issue, not blocking
- `question:` - Seeking clarification
- `suggestion:` - Optional improvement
- `blocker:` - Must be fixed before merge

---

## Performance Considerations

### General Guidelines

1. **Premature optimization is the root of all evil**

   - Write clear code first
   - Profile before optimizing
   - Optimize based on data, not assumptions

2. **Know your data structures**

   - Use appropriate data structures for the use case
   - Understand Big-O complexity of operations
   - Consider memory vs. CPU tradeoffs

3. **Avoid unnecessary work**

   ```typescript
   // ✅ GOOD: Early return
   function processTransactions(txs: Transaction[]) {
     if (txs.length === 0) return []; // Skip processing
     return txs.map(process);
   }

   // ❌ BAD: Doing work even when not needed
   function processTransactions(txs: Transaction[]) {
     const result = txs.map(process);
     return result.length === 0 ? [] : result;
   }
   ```

4. **Cache expensive operations**

   ```typescript
   // ✅ GOOD: Memoize expensive calculations
   const tokenConfig = useMemo(() => {
     return computeTokenConfig(network, address);
   }, [network, address]);

   // ❌ BAD: Recalculating on every render
   const tokenConfig = computeTokenConfig(network, address);
   ```

### Language-Specific

- **TypeScript/React**: Avoid unnecessary re-renders, use virtualization for long lists
- **Solidity**: Gas optimization (events vs. storage, uint256 packing, custom errors)
- **Rust**: Zero-copy deserialization, avoid unnecessary clones
- **Go**: Connection pooling, context cancellation, goroutine management

---

## Summary

These general guidelines establish the foundation for all code in this monorepo:

1. **Write clear, maintainable code** - Future you will thank you
2. **Security is non-negotiable** - Validate inputs, handle errors, protect secrets
3. **Document your work** - Code is read more than it's written
4. **Handle errors explicitly** - Fail fast, fail loud, provide context
5. **Review constructively** - Help each other improve
6. **Optimize smartly** - Profile first, optimize second

For language-specific details, see the relevant guide:

- [TypeScript/React](./01-typescript-frontend.md)
- [Solidity](./02-solidity.md)
- [Rust/Anchor](./03-rust-anchor.md)
- [Go](./04-golang.md)
