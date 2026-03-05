# TypeScript/React Frontend Guidelines

Standards and best practices for the React/TypeScript frontend application (`apps/frontend`).

## Table of Contents

- [Project Structure](#project-structure)
- [TypeScript Standards](#typescript-standards)
- [React Patterns](#react-patterns)
- [Component Guidelines](#component-guidelines)
- [Custom Hooks](#custom-hooks)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Import Organization](#import-organization)
- [Testing](#testing)

---

## Project Structure

### Directory Organization

```
apps/frontend/src/
├── api/               # API client functions and types
│   └── bridgeClient.ts
├── components/        # Reusable UI components
│   ├── ClaimConfirmModal.tsx
│   ├── SuccessModal.tsx
│   └── ...
├── config/           # Configuration files
│   └── tokens.ts
├── hooks/            # Custom React hooks
│   ├── useWallet.ts
│   ├── useBridgeTransaction.ts
│   └── ...
├── pages/            # Page components
│   ├── Bridge.tsx
│   ├── History.tsx
│   └── ...
├── utils/            # Utility functions
│   └── url.ts
├── App.tsx           # Root application component
└── main.tsx          # Application entry point
```

### File Naming Conventions

- **Components**: PascalCase - `BridgeModal.tsx`, `TokenSelector.tsx`
- **Hooks**: camelCase with `use` prefix - `useWallet.ts`, `useBridgeTransaction.ts`
- **Utilities**: camelCase - `formatAddress.ts`, `validation.ts`
- **Types**: PascalCase - `Transaction.ts`, `TokenConfig.ts`
- **Constants**: UPPER_SNAKE_CASE - `TOKEN_CONFIG`, `API_BASE_URL`

---

## TypeScript Standards

### Type Safety

**✅ Always prefer explicit types over implicit**

```typescript
// ✅ GOOD: Explicit interface
interface TransactionHistory {
  data: HistoryTransaction[];
  pagination: Pagination;
}

async function fetchHistory(address: string): Promise<TransactionHistory> {
  // Implementation
}

// ❌ BAD: Implicit any
async function fetchHistory(address) {
  // TypeScript can't verify this
}
```

### Avoid `any`

```typescript
// ✅ GOOD: Use proper types or unknown
function processApiResponse(response: unknown): Transaction[] {
  if (!isValidResponse(response)) {
    throw new Error("Invalid response format");
  }
  return parseTransactions(response);
}

// ❌ BAD: Using any
function processApiResponse(response: any): Transaction[] {
  return response.data; // No type checking!
}

// ✅ ACCEPTABLE: Temporary any with explanation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleWalletEvent(event: any) {
  // TODO: Add proper types from @solana/wallet-adapter once updated
  // Issue: #123
  console.log("Wallet event:", event.type);
}
```

### Type Definitions

**Co-locate types with their usage**

```typescript
// ✅ GOOD: Types defined near usage
// In bridgeClient.ts
export interface HistoryTransaction {
  sourceTxHash: string;
  destinationTxHash: string;
  status: string;
  direction: string;
  tokenSymbol: string;
  amount: string;
  createdAt: string;
  sourceTokenAddress: string;
  sourceAddress: string;
  destinationAddress: string;
}

export interface Pagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export interface TransactionHistoryResponse {
  data: HistoryTransaction[];
  pagination: Pagination;
}
```

**Use type aliases for unions**

```typescript
// ✅ GOOD: Named type alias
type TransactionStatus = "completed" | "pending" | "failed";
type Network = "ethereum" | "solana";

interface Transaction {
  status: TransactionStatus;
  sourceNetwork: Network;
  destinationNetwork: Network;
}

// ❌ BAD: Inline unions (hard to reuse)
interface Transaction {
  status: "completed" | "pending" | "failed";
  sourceNetwork: "ethereum" | "solana";
}
```

### Enums vs Union Types

**Prefer union types over enums**

```typescript
// ✅ GOOD: Union type (better for JavaScript interop)
type ResourceType = "wood" | "coal" | "water" | "gas";

// ❌ AVOID: Enum (adds runtime code)
enum ResourceType {
  Wood = "wood",
  Coal = "coal",
  Water = "water",
  Gas = "gas",
}
```

**Exception**: Use enums when you need reverse mapping

### Utility Types

```typescript
// ✅ Use built-in utility types
type PartialTransaction = Partial<Transaction>;
type RequiredFields = Required<Pick<Transaction, "id" | "status">>;
type TransactionWithoutId = Omit<Transaction, "id">;
type TransactionKeys = keyof Transaction;
```

---

## React Patterns

### Functional Components

**Always use functional components with hooks**

```typescript
// ✅ GOOD: Functional component
interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const BridgeModal: React.FC<BridgeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return <div className="modal">{/* Modal content */}</div>;
};

export default BridgeModal;

// ❌ BAD: Class component (avoid unless absolutely necessary)
class BridgeModal extends React.Component {
  // ...
}
```

### Props Destructuring

```typescript
// ✅ GOOD: Destructure props in parameter
const TransactionRow: React.FC<{ transaction: Transaction }> = ({
  transaction,
}) => {
  return <tr>{transaction.id}</tr>;
};

// ❌ BAD: Using props object
const TransactionRow: React.FC<{ transaction: Transaction }> = (props) => {
  return <tr>{props.transaction.id}</tr>;
};
```

### Conditional Rendering

```typescript
// ✅ GOOD: Early return for empty states
const TransactionList: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  if (transactions.length === 0) {
    return <EmptyState message="No transactions found" />;
  }

  return (
    <div>
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} transaction={tx} />
      ))}
    </div>
  );
};

// ✅ GOOD: Ternary for simple conditionals
const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  return (
    <span
      className={status === "completed" ? "text-green-600" : "text-yellow-600"}
    >
      {status}
    </span>
  );
};

// ❌ BAD: Nested ternaries (hard to read)
return status === "completed" ? (
  <GreenBadge />
) : status === "pending" ? (
  <YellowBadge />
) : (
  <RedBadge />
);
```

### Event Handlers

```typescript
// ✅ GOOD: Named handler functions
const BridgeForm: React.FC = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle submission
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Validate and update
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleAmountChange} />
    </form>
  );
};

// ❌ BAD: Inline arrow functions (creates new function on every render)
return (
  <form
    onSubmit={(e) => {
      e.preventDefault(); /* handle */
    }}
  >
    <input
      onChange={(e) => {
        /* handle */
      }}
    />
  </form>
);
```

---

## Component Guidelines

### Component Size

- Keep components under 200 lines
- Extract complex logic into custom hooks
- Split large components into smaller sub-components

### Component Responsibilities

**Single Responsibility Principle**

```typescript
// ✅ GOOD: Separate concerns
const TransactionTable: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  return (
    <table>
      <TransactionTableHeader />
      <tbody>
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </tbody>
    </table>
  );
};

const TransactionRow: React.FC<{ transaction: Transaction }> = ({
  transaction,
}) => {
  const { canClaim } = useClaimValidation(transaction);

  return (
    <tr>
      <td>{transaction.date}</td>
      <td>
        <StatusBadge status={transaction.status} />
      </td>
      <td>{canClaim && <ClaimButton transaction={transaction} />}</td>
    </tr>
  );
};

// ❌ BAD: Too many responsibilities
const TransactionTable: React.FC = () => {
  // Fetching data
  // Filtering
  // Sorting
  // Rendering
  // Claim logic
  // All in one component (500+ lines)
};
```

### Props Interface

```typescript
// ✅ GOOD: Explicit interface, documented
interface BridgeModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when bridge is confirmed. Returns promise for loading state */
  onConfirm: () => Promise<void>;
  /** Selected resource to bridge */
  resource: ResourceType;
  /** Amount to bridge */
  amount: string;
}

// ✅ GOOD: Optional props marked clearly
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// ❌ BAD: No interface, unclear types
const BridgeModal = ({ isOpen, onClose, onConfirm, resource, amount }: any) => {
  // ...
};
```

---

## Custom Hooks

### Naming Convention

**Always prefix with `use`**

```typescript
// ✅ GOOD
function useWallet() {}
function useBridgeTransaction() {}
function usePolling() {}

// ❌ BAD
function getWallet() {}
function bridgeTransaction() {}
```

### Hook Structure

```typescript
// ✅ GOOD: Well-structured custom hook
/**
 * Manages wallet connection state for both Ethereum and Solana
 *
 * @returns Wallet addresses, connection status, and connection handlers
 */
function useWallet() {
  // State
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

  // External hooks
  const { address } = useAccount(); // wagmi
  const { publicKey } = useWallet(); // Solana wallet adapter

  // Effects
  useEffect(() => {
    setEthereumAddress(address || null);
  }, [address]);

  useEffect(() => {
    setSolanaAddress(publicKey?.toBase58() || null);
  }, [publicKey]);

  // Computed values
  const isEthereumConnected = ethereumAddress !== null;
  const isSolanaConnected = solanaAddress !== null;

  // Return stable object
  return {
    address: ethereumAddress,
    solanaAddress,
    isConnected: isEthereumConnected,
    isSolanaConnected,
  };
}
```

### Hook Best Practices

1. **Return object, not array** (unless order matters like useState)

   ```typescript
   // ✅ GOOD: Object return (named properties)
   const { data, error, isLoading } = useFetchData();

   // ❌ BAD: Array return (confusing order)
   const [data, error, isLoading] = useFetchData();
   ```

2. **Memoize complex computations**

   ```typescript
   function useTransactionFilter(
     transactions: Transaction[],
     filters: Filters
   ) {
     const filtered = useMemo(() => {
       return transactions.filter((tx) => matchesFilters(tx, filters));
     }, [transactions, filters]);

     return filtered;
   }
   ```

3. **Cleanup side effects**
   ```typescript
   function usePolling(callback: () => void, interval: number) {
     useEffect(() => {
       const id = setInterval(callback, interval);
       return () => clearInterval(id); // Cleanup
     }, [callback, interval]);
   }
   ```

---

## State Management

### Local State (useState)

**Use for UI state and simple component state**

```typescript
const [isOpen, setIsOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [selectedTab, setSelectedTab] = useState<"bridge" | "history">("bridge");
```

### React Query (@tanstack/react-query)

**Use for server state and async operations**

```typescript
// ✅ GOOD: React Query for API calls
const {
  data: transactions,
  isLoading,
  error,
} = useQuery({
  queryKey: ["transactions", walletAddress, currentPage],
  queryFn: () => fetchHistory(walletAddress, currentPage, 10),
  enabled: !!walletAddress,
  staleTime: 30000, // 30 seconds
});

// Benefits:
// - Automatic caching
// - Background refetching
// - Error handling
// - Loading states
```

### Wagmi (Ethereum) & Solana Wallet Adapter

**Use for blockchain state**

```typescript
// Ethereum
const { address, isConnected } = useAccount();
const { data: balance } = useBalance({ address, token: tokenAddress });
const { write: bridgeTokens } = useContractWrite({
  /* config */
});

// Solana
const { publicKey } = useWallet();
const { connection } = useConnection();
```

### Prop Drilling

**Avoid deeply nested prop passing**

```typescript
// ❌ BAD: Prop drilling
<App>
  <BridgePage wallet={wallet}>
    <BridgeForm wallet={wallet}>
      <TokenSelector wallet={wallet} />
    </BridgeForm>
  </BridgePage>
</App>;

// ✅ GOOD: Use custom hook
function useWallet() {
  // Centralized wallet state
}

// Each component uses the hook
const TokenSelector = () => {
  const { address } = useWallet();
  // ...
};
```

---

## API Integration

### API Client Functions

```typescript
// ✅ GOOD: Typed API functions with error handling
/**
 * Fetches transaction history for a wallet address
 */
export async function fetchHistory(
  address: string,
  page: number = 1,
  limit: number = 10,
  signal?: AbortSignal
): Promise<TransactionHistoryResponse> {
  // Validation
  if (!address || address.length < 26) {
    throw new Error("Invalid wallet address");
  }

  const params = new URLSearchParams({
    address,
    page: page.toString(),
    limit: limit.toString(),
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/history?${params}`, {
      signal,
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Failed to fetch history:", error);
    throw error;
  }
}
```

### AbortSignal Support

**Always accept AbortSignal for cancellable requests**

```typescript
// Component using abortable fetch
useEffect(() => {
  const abortController = new AbortController();

  fetchHistory(address, page, 10, abortController.signal)
    .then((data) => setData(data))
    .catch((err) => {
      if (err.name === "AbortError") {
        console.log("Request cancelled");
        return;
      }
      setError(err);
    });

  return () => abortController.abort();
}, [address, page]);
```

---

## Styling

### Tailwind CSS

**Use Tailwind utility classes**

```typescript
// ✅ GOOD: Tailwind utilities
<button className="px-4 py-2 bg-ruby-primary text-cream rounded-lg hover:brightness-90 transition-all">
  Bridge Tokens
</button>

// Use custom classes for repeated patterns
<div className="modal-overlay modal-overlay-positioned">
  <div className="bg-modal-primary border border-stone shadow-inset-modal rounded-[32px] p-6">
    {/* Content */}
  </div>
</div>
```

### Conditional Classes

```typescript
// ✅ GOOD: Use template literals or classnames library
const buttonClass = `
  px-4 py-2 rounded-lg transition-all
  ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:brightness-90"}
  ${
    variant === "primary"
      ? "bg-ruby-primary text-cream"
      : "bg-stone-input text-primary"
  }
`;

// Or use clsx/classnames library
import clsx from "clsx";

const buttonClass = clsx(
  "px-4 py-2 rounded-lg transition-all",
  isLoading && "opacity-50 cursor-not-allowed",
  !isLoading && "hover:brightness-90",
  variant === "primary" && "bg-ruby-primary text-cream",
  variant === "secondary" && "bg-stone-input text-primary"
);
```

---

## Import Organization

### Import Order

```typescript
// 1. External dependencies (React, libraries)
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

// 2. Internal absolute imports (if using path aliases)
import { Button } from "@/components/ui/button";

// 3. Relative imports from parent directories
import { fetchHistory } from "../api/bridgeClient";
import { TOKEN_CONFIG } from "../config/tokens";

// 4. Relative imports from same directory
import { formatAddress } from "./utils";
import { TransactionRow } from "./TransactionRow";

// 5. Type imports (grouped separately)
import type { Transaction } from "../types";
import type { ComponentProps } from "react";
```

### Barrel Exports

```typescript
// ✅ GOOD: components/index.ts
export { BridgeModal } from "./BridgeModal";
export { SuccessModal } from "./SuccessModal";
export { ClaimConfirmModal } from "./ClaimConfirmModal";

// Usage
import { BridgeModal, SuccessModal } from "./components";
```

---

## Testing

### Test Structure

```typescript
// History.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { History } from "./History";

describe("History", () => {
  it("renders empty state when no wallet connected", () => {
    render(<History ethereumWallet={null} solanaWallet={null} />);

    expect(screen.getByText("No Wallet Connected")).toBeInTheDocument();
  });

  it("fetches and displays transactions", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      data: [mockTransaction],
      pagination: { totalPages: 1, currentPage: 1 },
    });

    render(<History ethereumWallet={mockWallet} solanaWallet={null} />);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-row")).toBeInTheDocument();
    });
  });

  it("handles claim button click", async () => {
    const user = userEvent.setup();
    render(<History /* props */ />);

    const claimButton = screen.getByTestId("claim-button");
    await user.click(claimButton);

    expect(screen.getByText("Confirm Claim")).toBeInTheDocument();
  });
});
```

### Testing Best Practices

1. **Use data-testid for stable selectors**

   ```typescript
   <button data-testid="claim-button-123">Claim</button>
   ```

2. **Mock external dependencies**

   ```typescript
   vi.mock("./api/bridgeClient", () => ({
     fetchHistory: vi.fn(),
   }));
   ```

3. **Test user behavior, not implementation**

   ```typescript
   // ✅ GOOD: Test what user sees
   expect(screen.getByText("Transaction Completed")).toBeInTheDocument();

   // ❌ BAD: Test implementation details
   expect(component.state.status).toBe("completed");
   ```

---

## Summary

Key takeaways for TypeScript/React development:

1. **Type Safety**: Always use explicit types, avoid `any`
2. **Functional Components**: Use hooks, not classes
3. **Custom Hooks**: Extract reusable logic, follow naming conventions
4. **State Management**: Local state for UI, React Query for server state
5. **API Integration**: Type all responses, support cancellation with AbortSignal
6. **Styling**: Use Tailwind utilities consistently
7. **Imports**: Organize in a standard order
8. **Testing**: Test user behavior with stable selectors

For more details, see:

- [General Guidelines](./00-general-guidelines.md)
- [Testing Standards](./06-testing.md)
- [Git Workflow](./05-git-workflow.md)
