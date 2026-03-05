# NestJS Backend Guidelines

Standards and best practices for the Node.js/TypeScript backend application (`be/`).

## Table of Contents

- [NestJS Backend Guidelines](#nestjs-backend-guidelines)
  - [Table of Contents](#table-of-contents)
  - [Core TypeScript Principles](#core-typescript-principles)
    - [Basic Rules](#basic-rules)
    - [Nomenclature \& Naming](#nomenclature--naming)
    - [Booleans and Methods](#booleans-and-methods)
    - [Type Safety](#type-safety)
  - [Classes \& Object-Oriented Design](#classes--object-oriented-design)
    - [SOLID \& Composition](#solid--composition)
  - [Functions \& Logic Design](#functions--logic-design)
    - [Structure \& Length](#structure--length)
    - [Logic Flow](#logic-flow)
    - [Arrow vs. Named Functions](#arrow-vs-named-functions)
    - [Parameters (RO-RO \& Defaults)](#parameters-ro-ro--defaults)
  - [Error Handling \& Exceptions](#error-handling--exceptions)
    - [Exception Usage](#exception-usage)
  - [NestJS Architecture](#nestjs-architecture)
    - [Modular Structure](#modular-structure)
    - [Controllers vs. Services](#controllers-vs-services)
  - [Database \& Prisma ORM](#database--prisma-orm)
    - [Idempotency \& Replay Protection](#idempotency--replay-protection)
  - [Security \& Access Control (RBAC)](#security--access-control-rbac)
    - [Guards \& Scoping](#guards--scoping)
    - [Master Treasury Key Management](#master-treasury-key-management)
    - [Auditing](#auditing)
  - [WebSockets \& Real-Time Events](#websockets--real-time-events)
    - [Interceptors \& Routing](#interceptors--routing)
  - [Testing Standards](#testing-standards)
    - [Guidelines](#guidelines)

---

## Core TypeScript Principles

### Basic Rules

- **Language**: Use English for all code and documentation.
- **Documentation**: Use JSDoc to document all public classes and methods.
- **Exports**: One export per file to maintain predictable imports.

### Nomenclature & Naming

- **Classes/Interfaces**: `PascalCase`.
- **Variables/Methods**: `camelCase`.
- **Files/Directories**: `kebab-case` (e.g., `wallet-monitor.service.ts`).
- **Environment Variables**: `UPPER_SNAKE_CASE`. Avoid magic numbers in logic; define constants instead.
- **Abbreviations**: Use complete words and correct spelling.
- _Exceptions for standards_: `API`, `URL`, etc.
- _Exceptions for well-known terms_: `i`, `j` for loops; `err` for errors; `ctx` for contexts; `req`, `res`, `next` for middleware parameters.

### Booleans and Methods

- **Booleans**: Prefix with verbs like `is`, `has`, `can` (e.g., `isLoading`, `hasError`, `canDelete`).
- **Methods**: Start each function with a verb.
- If it returns a boolean, use `isX`, `hasX`, `canX`.
- If it performs an action, use `executeX`, `saveX`, `calculateX`.

### Type Safety

- **No `any`**: Always declare the exact type for variables, parameters, and return values. Create necessary types or interfaces.
- **Immutability**: Prefer immutability for data. Use `readonly` for class properties that shouldn't change, and `as const` for stable literals.

---

## Classes & Object-Oriented Design

### SOLID & Composition

- **SOLID Principles**: Always follow SOLID principles to ensure maintainable architecture.
- **Composition**: Prefer composition over inheritance.
- **Contracts**: Declare interfaces to define contracts between different parts of the system.
- **Single Purpose**: Write small classes with a single purpose. Avoid "God classes" that do too many things.

```typescript
// ✅ GOOD: Interface-driven, single responsibility composition
export interface TransactionParser {
  parse(signature: string): Promise<ParsedTx>;
}

@Injectable()
export class BlockchainMonitorService {
  constructor(private readonly txParser: TransactionParser) {}
}
```

---

## Functions & Logic Design

### Structure & Length

- **Short & Single Purpose**: Write short functions with a single purpose (less than 20 instructions).
- **Single Level of Abstraction**: Do not mix high-level business logic with low-level data parsing in the same function.
- **No Blank Lines**: Do not leave blank lines within a function. Extract unrelated logic to utility functions to keep blocks cohesive.

### Logic Flow

- **Early Returns**: Avoid nesting blocks by using early checks and returns.
- **Higher-Order Functions**: Use `map`, `filter`, `reduce` to avoid `for` loop nesting.

```typescript
// ✅ GOOD: Higher-order functions and early returns
public getActiveWallets(users: User[]): string[] {
  if (!users.length) return [];
  return users.filter(user => user.isActive).map(user => user.walletAddress);
}

// ❌ BAD: Nested loops and lack of early returns
public getActiveWallets(users: User[]): string[] {
  const activeWallets = [];
  if (users.length > 0) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].isActive) {
        activeWallets.push(users[i].walletAddress);
      }
    }
  }
  return activeWallets;
}
```

### Arrow vs. Named Functions

- **Arrow Functions**: Use for simple logic (less than 3 instructions), such as inline callbacks.
- **Named Functions**: Use for non-simple functions to improve stack traces and readability.

### Parameters (RO-RO & Defaults)

- **Default Parameters**: Use default parameter values instead of checking for `null` or `undefined`.
- **RO-RO Pattern (Receive Object, Return Object)**: Reduce function parameters by using an object to pass multiple inputs and return results.

```typescript
// ✅ GOOD: Default parameters and RO-RO pattern
interface FetchHistoryArgs {
  wallet: string;
  limit?: number;
  type?: 'SPEND' | 'REFILL';
}

public async fetchTransactions({ wallet, limit = 20, type }: FetchHistoryArgs): Promise<TransactionList> {
  // Implementation
}

// ❌ BAD: Too many parameters, manual undefined checks
public async fetchTransactions(wallet: string, limit: number, type: string): Promise<any> {
  const finalLimit = limit !== undefined ? limit : 20;
  // Implementation
}
```

---

## Error Handling & Exceptions

### Exception Usage

- **Unexpected Errors**: Use exceptions to handle errors you do not expect.
- **Catching Rule**: If you catch an exception, it MUST be to:
  1. Fix an expected problem.
  2. Add context to the error.
  3. Otherwise, do not catch it—let the global exception handler manage it.

```typescript
// ✅ GOOD: Catching to add context
try {
  await this.prisma.user.create({ data });
} catch (err) {
  throw new InternalServerErrorException(
    `Failed to create user ${data.walletAddress}: ${err.message}`
  );
}

// ❌ BAD: Catching and doing nothing (or hiding it)
try {
  await this.prisma.user.create({ data });
} catch (err) {
  console.log(err); // Anti-pattern: lets the app continue in a broken state
}
```

---

## NestJS Architecture

### Modular Structure

- **Module per Domain**: Encapsulate features in their own modules (`AuthModule`, `RegistryModule`, `BlockchainModule`, `RefillModule`).
- **Core Module**: Create a core module for Nest artifacts (Global filters, middlewares, guards, interceptors).
- **Shared Module**: Create a shared module for services/utilities shared between different domains.

### Controllers vs. Services

- **Controllers**: Keep them lean. One controller per main route. Use DTOs validated with `class-validator` for inputs, and declare simple types for outputs.
- **Services**: Contain all business logic and persistence. One service per entity.

```typescript
// ✅ GOOD: Custom decorators and validated DTOs
@Post()
@Roles('ADMIN')
public async createPM(@Body() dto: CreatePMDto): Promise<UserResponse> {
  return this.registryService.createPM(dto);
}
```

---

## Database & Prisma ORM

LEMS utilizes Prisma mapped to PostgreSQL.

### Idempotency & Replay Protection

Because blockchain events are unpredictable, the database schema and ingestion logic must guarantee no transaction signature is processed twice.

- **Unique Constraints**: The `transactions` table must have a unique constraint on the `signature` column.
- **Prisma Exception Filters**: Implement a global `PrismaClientExceptionFilter`. If a `P2002` (Unique constraint violation) occurs during real-time monitoring, suppress it silently to enforce idempotency.

---

## Security & Access Control (RBAC)

Every endpoint must strictly verify the user's role via standard NestJS Guards.

### Guards & Scoping

- **`JwtAuthGuard`**: Ensures the request contains a valid JWT. Applied globally to protected routes.
- **`RolesGuard`**: Uses `@Roles('ADMIN')` decorator to restrict access. Throws a `403 Forbidden` if a `USER` attempts access.
- **Data Scoping**: For shared routes (`GET /api/v1/transactions`), inspect `req.user.role`. If `USER`, forcibly override the `pm_id` query parameter with `req.user.id` to restrict the query.

### Master Treasury Key Management

- **CRITICAL**: The Master Treasury private key is NEVER stored in the database.
- It exists securely in the `.env` file. The `ExecutionService` loads it temporarily into memory and immediately allows the garbage collector to clear it after signing.

### Auditing

- Use an `AuditLogInterceptor` to intercept successful `POST/PATCH` requests to Admin endpoints, extracting the Admin's `wallet_address` to write an immutable audit record.

---

## WebSockets & Real-Time Events

### Interceptors & Routing

- **Triggering Events**: Use a `WSEventEmitterInterceptor` tied to the `transactions` table insertion. When a transaction is saved, trigger the NestJS Gateway to emit `NEW_TRANSACTION`.
- **Room Routing**: Admins subscribe to the `global_feed` room. PMs subscribe to their specific `pm_feed_{uuid}` room, strictly enforced by JWT validation on socket connection.

---

## Testing Standards

Use the standard **Jest** framework for testing.

### Guidelines

- **Unit Tests**: Write unit tests for each public function in your controllers and services.
- **E2E Tests**: Write end-to-end tests for each API module.
- **AAA Pattern**: Follow the Arrange-Act-Assert convention for tests.
- **Test Doubles**: Use test doubles (mocks/stubs) to simulate dependencies (like Prisma or RPC calls), except for third-party dependencies that are not expensive to execute.
- **Variable Naming**: Name test variables clearly following conventions like `inputX`, `mockX`, `actualX`, `expectedX`.

```typescript
describe("RefillService", () => {
  it("should calculate target differences correctly", async () => {
    // Arrange
    const mockUser = { targetBalance: 500, currentBalance: 100 };
    const expectedDifference = 400;

    // Act
    const actualDifference = service.calculateRefillAmount(mockUser);

    // Assert
    expect(actualDifference).toBe(expectedDifference);
  });
});
```
