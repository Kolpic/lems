Implementation Blueprint: TICKET-000
Summary
Initialize a highly cohesive pnpm monorepo structure to house the LimeChain Expense Management System (LEMS). This workspace will contain three primary packages: a React SPA frontend (fe), a NestJS backend API (be), and an Anchor-based Rust smart contract environment (anchor). Additionally, it will establish the local developer environment using Docker for PostgreSQL and configure shared environment variables.

Implementation Details

1. Workspace & Git Initialization
   Initialize a new Git repository at the project root.

Create a .gitignore file configured for Node.js, NextJS/Vite, NestJS, Rust, and standard environmental files.

Initialize the workspace using pnpm.

Create a pnpm-workspace.yaml file at the root to explicitly define the workspace packages (fe, be, anchor).

Create a root package.json to manage cross-project scripts like dev:all, build:all, and database migration commands.

2. Frontend (/fe) Scaffolding & Dependencies
   Scaffold the Single Page Application using Vite with the React-TypeScript template: pnpm create vite fe --template react-ts.

Install core styling dependencies: tailwindcss, postcss, and autoprefixer, and initialize tailwind.config.js.

Install the routing and state management ecosystem: react-router-dom and @tanstack/react-query.

Install the specific UI components mandated by the FE architecture: @tanstack/react-table (for the Registry and Feeds), @tanstack/react-virtual (for DOM virtualization), recharts (for analytics), and Radix UI primitives (@radix-ui/react-dialog, @radix-ui/react-switch).

Install the Solana Web3 ecosystem for wallet-first authentication: @solana/web3.js, @solana/wallet-adapter-react, @solana/wallet-adapter-react-ui, @solana/wallet-adapter-wallets, and @solana/wallet-adapter-base.

3. Backend (/be) Scaffolding & Dependencies
   Scaffold the backend API using the NestJS CLI: npx @nestjs/cli new be --package-manager pnpm.

Install Data Transfer Object (DTO) validation libraries to strictly enforce request payloads: class-validator and class-transformer.

Install blockchain interaction and cryptographic libraries: @solana/web3.js and tweetnacl (for ed25519 signature verification).

Initialize the Prisma ORM.

Install Prisma dependencies: prisma (dev dependency) and @prisma/client.

Run npx prisma init inside the /be directory to generate the prisma/schema.prisma file and the default .env integration.

4. Smart Contracts (/anchor) Scaffolding
   Scaffold the Rust environment using the Anchor CLI via anchor init lems_contracts.

Rename the resulting folder from lems_contracts to anchor to ensure it matches the pnpm-workspace.yaml structure.

5. Local Infrastructure (Docker)
   Create a /docker folder at the monorepo root.

Create a docker-compose.yml file defining a persistent PostgreSQL service.

Configure the service to expose port 5432 and set default development credentials (e.g., POSTGRES_USER=lems_admin, POSTGRES_DB=lems_local).

6. Environment Variables & Documentation
   Create a .env.example file at the root to serve as a configuration template.

Define the required system keys: DATABASE_URL (pointing to the local Docker Postgres instance), SOLANA_RPC_URL (with fallback array placeholders), and MASTER_TREASURY_PRIVATE_KEY (placeholder for the Base58 string).

Create a root README.md containing a "Getting Started" section.

Outline the exact commands required for onboarding: pnpm install, docker-compose up -d, npx prisma db push, and the dev server start commands.

Acceptance Criteria (Test Cases)
Dependencies Validation: Running pnpm install at the root directory successfully resolves and installs all dependencies across all workspaces (including @solana/web3.js in both fe and be) without version conflicts.

Infrastructure Validation: Running docker-compose up -d from the /docker directory successfully spins up a PostgreSQL instance accessible on localhost:5432.

ORM Initialization Validation: The be/prisma/schema.prisma file exists, and its configured DATABASE_URL accurately matches the credentials set in the local Docker container.

Frontend Compilation: Running pnpm --filter fe dev successfully compiles the React/Vite application and hosts it on a local port without errors.

Backend Compilation: Running pnpm --filter be start:dev successfully starts the NestJS server without TypeScript compilation errors.
