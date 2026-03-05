# AI Coding Assistant Guidelines

This document provides guidance for AI coding assistants working on the LimeChain Expense Management System (LEMS) monorepo.

## 📋 Project Overview

**LimeChain Expense Management System (LEMS)** is an automated, blockchain-based budget distribution and tracking system utilizing the Solana network and Solflare Crypto Cards. It features a strict Role-Based Access Control (RBAC) dashboard for accountants to manage project manager (PM) budgets, execute monthly automated refills, and monitor real-time transparent spending.

### Monorepo Structure

```text
lems-monorepo/
├── .github/                  # CI/CD workflows
├── docs/                     # Architecture & coding standards
│   └── coding-rules/         # Comprehensive coding standards
├── anchor/                   # Solana Smart Contracts (Rust/Anchor)
├── be/                       # Backend Services (NestJS + TypeScript)
├── fe/                       # Frontend SPA (React + TypeScript)
└── docker/                   # Local infrastructure (PostgreSQL)
```

### Tech Stack

- **Frontend (`/fe`)**: React, TypeScript, Vite, Tailwind CSS, TanStack Query, TanStack Table, Recharts, Radix UI.
- **Backend (`/be`)**: Node.js, TypeScript, NestJS, Prisma ORM, PostgreSQL.
- **Solana Programs (`/anchor`)**: Rust, Anchor Framework.
- **Blockchain Integration**: `@solana/web3.js`, `@solana/wallet-adapter-react`.

---

## 📚 Coding Standards (CRITICAL)

All code changes **MUST** follow the coding rules in `docs/coding-rules/`

### 1. General Guidelines

- **Security First**: The Master Treasury private key must NEVER be hardcoded or stored in the database. It exists strictly in the `.env` and is loaded into memory only during execution.
- **Strict RBAC**: Every endpoint and UI view must respect the `ADMIN` vs `USER` role separation.
- **Idempotency**: Blockchain events can be unpredictable. Rely on database unique constraints (e.g., the transaction signature) to ensure events are never processed twice.

### 2. Language-Specific Guides

**Frontend Development (`/fe`):**

- TypeScript/React Frontend: Wallet-First Auth, real-time Reactivity (WebSockets), and component primitives using Tailwind.
- Figma Design Implementation: AI-assisted design-to-code workflow with MCP, design tokens, accessibility.

**Backend Development (`/be`):**

- NestJS Backend Services: Modular architecture, SOLID principles, RO-RO pattern, early returns, strict typing (no `any`), and Prisma DB integration.

**Solana Programs (`/anchor`):**

- Rust/Anchor Contracts: Account validation using `#[account(...)]`, PDA patterns, and checked arithmetic.

### 3. Development Workflow & Git

**Git Workflow & Contribution**: All changes must adhere strictly to branch naming conventions (`feat/`, `fix/`, `chore/`) and use Conventional Commits (`type(scope): description`).

---

## 🛠️ Quick Reference - Commands

We use `pnpm` workspaces for this monorepo.

### Frontend (`/fe`)

```bash
pnpm --filter fe dev         # Start Vite dev server
pnpm --filter fe lint        # Run ESLint
pnpm --filter fe format      # Format with Prettier
pnpm --filter fe build       # TypeScript compilation + Vite build
```

### Backend (`/be`)

```bash
pnpm --filter be start:dev          # Start NestJS dev server with watch mode
pnpm --filter be prisma db push     # Sync schema to local database
pnpm --filter be prisma generate    # Generate Prisma Client types
pnpm --filter be lint               # Run ESLint
```

### Solana Programs (`/anchor`)

```bash
cargo fmt        # Format Rust code
cargo clippy     # Run linter
anchor test      # Run local validator and Anchor tests
anchor build     # Build BPF programs
```

---

## 🤖 AI Assistant Workflow

### Before Making Changes

1. **Understand the task**: Read the user's request and check the corresponding TICKET documentation.
2. **Identify the area**: Determine if the change belongs in the Frontend (`fe`), Backend (`be`), or Smart Contracts (`anchor`).
3. **Read the relevant guide**: Check the specific language guide in `docs/coding-rules/`.

### While Writing Code

**TypeScript/NestJS (Backend):**

- **SOLID & Single Purpose**: Keep classes under 10 public methods and functions under 20 instructions.
- **Flow Control**: Use early returns to avoid nesting. Use higher-order functions (`map`, `filter`) instead of loops.
- **Parameters**: Use the RO-RO (Receive Object, Return Object) pattern for functions with >2 parameters. Use default parameters over `undefined` checks.
- **Typing**: Never use `any`. Use JSDoc for all public methods.
- **Decorators & RBAC**: Use custom `@Roles('ADMIN')` decorators and Guards for route protection. Validate all DTOs with `class-validator`.
- **Database**: Catch Prisma database errors (like `P2002` UniqueConstraintViolation) using custom Exception Filters for idempotency.

**TypeScript/React (Frontend):**

- Extract complex data fetching and WebSocket logic into custom hooks (e.g., `useLiveTransactions`).
- Ensure all tables and lists are virtualized if they expect heavy data loads.
- Implement strict code-splitting using `React.lazy()` for Admin vs. User bundles.

**Rust/Anchor:**

- Document all instructions with `///`.
- Follow the CEI pattern (Checks-Effects-Interactions) in instruction handlers.

### Before Committing

- **Verify Formatting & Linting**: Run the appropriate linters (ESLint, Clippy) and formatters (Prettier, `cargo fmt`).
- **Branch Naming**: Ensure you are on a properly named branch (e.g., `feat/add-transaction-polling` or `fix/prisma-unique-constraint`).
- **Conventional Commits**: Format your commit messages strictly as `<type>(<scope>): <subject>` (e.g., `feat(be): add WSEventEmitterInterceptor for live transactions`).

---

## ⚠️ Critical Rules

### Security (NEVER Violate These)

- ❌ NEVER commit the `.env` file or hardcode the Master Treasury Key.
- ❌ NEVER bypass NestJS Guards or RBAC checks.
- ❌ NEVER use `dangerouslySetInnerHTML` when rendering merchant data.
- ❌ NEVER execute a batch refill transaction without running `simulateTransaction` via the RPC first.
- ❌ NEVER catch an exception in the backend just to ignore it (swallowing errors).

### Always Required

- ✅ Always validate Solana addresses to ensure they are exactly 44 characters and valid Base58 public keys.
- ✅ Always sanitize and validate DTOs for backend endpoints.
- ✅ Always implement dynamic priority fees (`ComputeBudgetProgram.setComputeUnitPrice`) for automated on-chain batch refills.
- ✅ Always fall back to polling if the WebSocket connection to the RPC node drops.

---

## 📊 Quality Standards

### Performance

- **Dashboard Load**: The frontend must reach Time to Interactive (TTI) within 1.5 seconds.
- **Feed Latency**: Real-time spending must hit the dashboard in under 10 seconds via WebSockets.
- **API Latency**: The `GET /api/v1/transactions` endpoint must respond in under 50ms (ensure proper compound indexing on `pm_id` and `block_time`).

### Code Review Comments

- `nit:` — Minor suggestion, not blocking
- `question:` — Clarification needed
- `suggestion:` — Recommended improvement
- `blocker:` — Must be fixed before merge
