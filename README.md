# LEMS — LimeChain Expense Management System

Automated, blockchain-based budget distribution and tracking system utilizing the Solana network. Features RBAC dashboard for accountants to manage project manager budgets, execute automated refills, and monitor real-time spending.

## Monorepo Structure

```
lems-monorepo/
├── fe/          # Frontend SPA (React + TypeScript + Vite)
├── be/          # Backend API (NestJS + Prisma + PostgreSQL)
├── anchor/      # Solana Smart Contracts (Rust + Anchor)
├── docker/      # Local infrastructure (PostgreSQL)
├── docs/        # Architecture & coding standards
└── blueprints/  # Implementation blueprints
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Query/Table, Recharts, Radix UI |
| Backend | Node.js, TypeScript, NestJS, Prisma ORM, PostgreSQL |
| Blockchain | Rust, Anchor Framework, @solana/web3.js |

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9
- **Docker** (for local PostgreSQL)
- **Rust** + **Anchor CLI** (for smart contract development)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your local values (defaults work with Docker)
```

### 3. Start the database

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 4. Initialize the database schema

```bash
cd be && npx prisma db push && cd ..
```

### 5. Start development servers

```bash
# Frontend (Vite dev server)
pnpm --filter fe dev

# Backend (NestJS with watch mode)
pnpm --filter be start:dev

# Or start both
pnpm run dev:all
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev:fe` | Start frontend dev server |
| `pnpm run dev:be` | Start backend dev server |
| `pnpm run dev:all` | Start both dev servers |
| `pnpm run build:all` | Build frontend and backend |
| `pnpm run lint:all` | Lint frontend and backend |
| `pnpm run db:up` | Start PostgreSQL container |
| `pnpm run db:down` | Stop PostgreSQL container |
| `pnpm run db:push` | Push Prisma schema to database |
| `pnpm run db:generate` | Generate Prisma client types |

## Documentation

See the `docs/` directory for detailed architecture and coding standards.
