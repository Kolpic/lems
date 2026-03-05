# User Story: TICKET-000 Initialize LEMS Monorepo Structure and Tooling

**As a** LEMS developer,
**I want** a foundational monorepo structure initialized with the correct workspace tooling, base framework scaffolding, domain-specific SDKs (Solana, Prisma), and local database infrastructure,
**So that** the engineering team can immediately begin building the frontend, backend, and smart contracts in parallel without configuration conflicts.

---

# Implementation Blueprint

## 1. Workspace & Git Initialization

- **Action:** Initialize a new Git repository and set up the `pnpm` monorepo package manager.
- **Implementation Details:**
  - Run `git init`.
  - Create a `.gitignore` file at the root.
  - Initialize the workspace using `pnpm`. Create a `pnpm-workspace.yaml` file at the root to explicitly define the workspace packages:
    ```yaml
    packages:
      - "fe"
      - "be"
      - "anchor"
    ```
  - Create a root `package.json` to manage cross-project scripts (e.g., `dev:all`, `lint:all`).

## 2. Frontend (`/fe`) Scaffolding & Dependencies

- **Action:** Scaffold the React SPA and install required UI/Web3 libraries.
- **Implementation Details:**
  - Scaffold the SPA using Vite: `pnpm create vite fe --template react-ts`
  - Install styling dependencies: `pnpm add -D tailwindcss postcss autoprefixer` and initialize `tailwind.config.js`.
  - Install core ecosystem libraries:
    - Routing/State: `pnpm add react-router-dom @tanstack/react-query`
    - UI Components: `pnpm add @tanstack/react-table recharts @radix-ui/react-dialog @radix-ui/react-switch`
  - Install Solana Web3 dependencies:
    - `pnpm add @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/wallet-adapter-base`

## 3. Backend (`/be`) Scaffolding & Dependencies

- **Action:** Scaffold the NestJS API, install validation tools, and initialize the Prisma ORM.
- **Implementation Details:**
  - Scaffold using the CLI: `npx @nestjs/cli new be --package-manager pnpm`
  - Install validation libraries: `pnpm add class-validator class-transformer`
  - Install Solana dependencies: `pnpm add @solana/web3.js tweetnacl`
  - Initialize Prisma:
    - `pnpm add -D prisma`
    - `pnpm add @prisma/client`
    - Run `npx prisma init` inside the `/be` directory to generate the `prisma/schema.prisma` file and default `.env` integration.

## 4. Smart Contracts (`/anchor`) Scaffolding

- **Action:** Scaffold the Rust environment using the Anchor CLI.
- **Implementation Details:**
  - Command: `anchor init lems_contracts`. (Rename the resulting folder to `anchor` to match our structure).

## 5. Local Infrastructure (Docker)

- **Action:** Provide a seamless local PostgreSQL setup for developers.
- **Implementation Details:**
  - Create a `/docker` folder at the monorepo root.
  - Create a `docker-compose.yml` file defining a PostgreSQL service.
  - Ensure it exposes port `5432` and sets default credentials (e.g., `POSTGRES_USER=lems_admin`, `POSTGRES_DB=lems_local`).

## 6. Environment Variables

- **Action:** Establish secure environment configuration templates.
- **Implementation Details:**
  - Create a `.env.example` file at the root.
  - Define required keys: `DATABASE_URL` (pointing to the local docker instance), `SOLANA_RPC_URL` (fallback array placeholders), and `MASTER_TREASURY_PRIVATE_KEY` (Base58 string placeholder).

## 7. Required Documentation Updates

- **Action:** Create a root `README.md`.
- **Implementation Details:**
  - Add a "Getting Started" section outlining the exact commands to install dependencies (`pnpm install`), start the database (`docker-compose up -d`), push the Prisma schema (`npx prisma db push`), and run the dev servers.

---

# Test Cases

- **Test Case 1 (Dependencies):** Verify that running `pnpm install` at the root directory successfully resolves and installs all dependencies (including `@solana/web3.js` in both `fe` and `be`) without conflicts.
- **Test Case 2 (Infrastructure):** Verify that running `docker-compose up -d` from the `/docker` directory successfully starts a PostgreSQL instance accessible on `localhost:5432`.
- **Test Case 3 (ORM Initialization):** Verify that the `be/prisma/schema.prisma` file exists and the `DATABASE_URL` matches the local Docker container credentials.
- **Test Case 4 (Frontend Start):** Verify that running `pnpm --filter fe dev` successfully compiles the React application and hosts it on a local port.
- **Test Case 5 (Backend Start):** Verify that running `pnpm --filter be start:dev` successfully starts the NestJS server without compilation errors.
