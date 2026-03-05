# Testing Standards

Testing requirements and best practices across all languages in the monorepo.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Coverage Requirements](#test-coverage-requirements)
- [TypeScript/React Testing](#typescriptreact-testing)
- [Solidity Testing](#solidity-testing)
- [Rust/Anchor Testing](#rustanchor-testing)
- [Go Testing](#go-testing)
- [E2E Testing](#e2e-testing)

---

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**

   - Focus on what the code does, not how it does it
   - Tests should be resilient to refactoring

2. **Test Pyramid**

   - Many unit tests (fast, isolated)
   - Fewer integration tests (moderate speed)
   - Few E2E tests (slow, comprehensive)

3. **Test-Driven Development (TDD)**

   - Write tests before or alongside implementation
   - Red → Green → Refactor

4. **Maintainable Tests**
   - Tests should be as clean as production code
   - Use descriptive test names
   - Follow AAA pattern: Arrange → Act → Assert

---

## Test Coverage Requirements

### Minimum Coverage Targets

- **Unit Tests**: ≥80% code coverage
- **Critical Paths**: 100% coverage required
  - Smart contracts
  - Payment/transaction logic
  - Security-related code
  - Data validation

### Coverage by Language

**TypeScript**:

```bash
cd apps/frontend
npm run test:coverage
# Target: 80% coverage
```

**Solidity**:

```bash
cd contracts/ethereum
forge coverage
# Target: 100% for critical contracts
```

**Rust/Anchor**:

```bash
cd contracts/solana
cargo tarpaulin --out Html
# Target: 80% coverage
```

**Go**:

```bash
go test -cover ./...
# Target: 80% coverage
```

---

## TypeScript/React Testing

### Test Framework

**Vitest** for unit and integration tests

### Component Testing

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { History } from "./History";

describe("History Component", () => {
  // Arrange - Setup
  const mockWallet = { address: "0x123", connected: true };

  it("renders transaction history when wallet is connected", async () => {
    // Arrange
    const mockTransactions = [{ id: "1", status: "completed", amount: 100 }];
    vi.mock("./api/bridgeClient", () => ({
      fetchHistory: vi.fn().mockResolvedValue({
        data: mockTransactions,
        pagination: { totalPages: 1 },
      }),
    }));

    // Act
    render(<History ethereumWallet={mockWallet} solanaWallet={null} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("transaction-row-1")).toBeInTheDocument();
    });
  });

  it("handles claim button click", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<History ethereumWallet={mockWallet} solanaWallet={mockWallet} />);

    // Act
    const claimButton = screen.getByTestId("claim-button-123");
    await user.click(claimButton);

    // Assert
    expect(screen.getByText("Confirm Claim")).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { usePolling } from "./usePolling";

describe("usePolling", () => {
  it("polls at specified interval", async () => {
    const callback = vi.fn();
    const interval = 1000;

    renderHook(() => usePolling(callback, interval));

    await waitFor(
      () => {
        expect(callback).toHaveBeenCalledTimes(3);
      },
      { timeout: 3500 }
    );
  });
});
```

---

## Solidity Testing

### Test Framework

**Foundry** (forge test)

### Contract Testing

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/BridgeContract.sol";

contract BridgeContractTest is Test {
    BridgeContract public bridge;
    MockERC20 public token;

    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.startPrank(owner);
        bridge = new BridgeContract(owner);
        vm.stopPrank();

        token = new MockERC20("Test", "TEST", 18);

        vm.prank(owner);
        bridge.setSupportedToken(address(token), true);
    }

    function testBridge() public {
        uint256 amount = 100 ether;

        // Setup
        token.mint(user, amount);
        vm.startPrank(user);
        token.approve(address(bridge), amount);

        // Execute
        uint256 bridgeId = bridge.bridge(
            address(token),
            amount,
            "SolanaAddressHere"
        );

        // Assert
        assertEq(bridgeId, 1);
        assertEq(token.balanceOf(user), 0);
        vm.stopPrank();
    }

    function testRevertTokenNotSupported() public {
        address unsupportedToken = address(new MockERC20("Bad", "BAD", 18));

        vm.expectRevert(
            abi.encodeWithSelector(
                BridgeContract.TokenNotSupported.selector,
                unsupportedToken
            )
        );

        bridge.bridge(unsupportedToken, 100, "destination");
    }

    function testFuzz_BridgeAmount(uint256 amount) public {
        // Bound fuzz inputs
        amount = bound(amount, bridge.minBridgeAmount(), type(uint128).max);

        token.mint(user, amount);
        vm.startPrank(user);
        token.approve(address(bridge), amount);

        uint256 bridgeId = bridge.bridge(address(token), amount, "dest");

        assertEq(bridgeId, 1);
        vm.stopPrank();
    }
}
```

### Test Types

1. **Unit Tests**: Individual functions
2. **Integration Tests**: Multiple contracts interacting
3. **Fuzz Tests**: Random input testing
4. **Invariant Tests**: Property-based testing

---

## Rust/Anchor Testing

### Test Framework

**Anchor Test** with TypeScript

### Program Testing

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { expect } from "chai";

describe("bridge program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Bridge as Program<Bridge>;

  it("Claims tokens with valid signature", async () => {
    // Arrange
    const message = Buffer.from(/* ... */);
    const signature = Buffer.from(/* ... */);

    // Act
    await program.methods
      .claim(Array.from(message), Array.from(signature))
      .accounts({
        // Account list
      })
      .rpc();

    // Assert
    const txState = await program.account.transactionState.fetch(txStatePDA);
    expect(txState.status).to.deep.equal({ claimed: {} });
  });

  it("Rejects claim with invalid signature", async () => {
    // Arrange
    const message = Buffer.from(/* ... */);
    const badSignature = Buffer.alloc(64);

    // Act & Assert
    try {
      await program.methods
        .claim(Array.from(message), Array.from(badSignature))
        .accounts({
          // Account list
        })
        .rpc();

      expect.fail("Should have thrown error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("InvalidSignature");
    }
  });
});
```

---

## Go Testing

### Test Framework

Standard library `testing` package

### Unit Testing

```go
func TestProcessTransaction(t *testing.T) {
    // Arrange
    ctx := context.Background()
    mockStorage := &MockStorage{
        GetTransactionFunc: func(ctx context.Context, hash string) (*Transaction, error) {
            return &Transaction{Hash: hash, Status: "pending"}, nil
        },
    }
    service := NewService(mockStorage)

    // Act
    err := service.ProcessTransaction(ctx, "0x123")

    // Assert
    if err != nil {
        t.Errorf("unexpected error: %v", err)
    }
}
```

### Table-Driven Tests

```go
func TestValidateAmount(t *testing.T) {
    tests := []struct {
        name    string
        amount  uint64
        wantErr bool
    }{
        {"valid amount", 100, false},
        {"zero amount", 0, true},
        {"negative amount", ^uint64(0), true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateAmount(tt.amount)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateAmount() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

---

## E2E Testing

### Framework

See [E2E Testing Guide](../E2E_TESTING_GUIDE.md) for comprehensive E2E testing documentation.

### E2E Test Scope

Test complete user flows:

1. Connect wallet
2. Bridge tokens (Ethereum → Solana)
3. Wait for processing
4. Claim tokens on destination chain
5. Verify balances

### Running E2E Tests

```bash
# Setup test environment
npm run test:e2e:setup

# Run E2E tests
npm run test:e2e

# Cleanup
npm run test:e2e:cleanup
```

---

## Summary

**Testing Checklist**:

- [ ] Unit tests for all public functions
- [ ] Integration tests for multi-component flows
- [ ] E2E tests for critical user paths
- [ ] Test coverage ≥80% (100% for critical code)
- [ ] All edge cases covered
- [ ] Error conditions tested
- [ ] Mock external dependencies
- [ ] Tests are deterministic and isolated

**Remember**:

- Write tests before or with implementation
- Test behavior, not implementation details
- Keep tests simple and readable
- Run tests before committing

For more details, see:

- [E2E Testing Guide](../E2E_TESTING_GUIDE.md)
- [TypeScript Testing](./01-typescript-frontend.md#testing)
- [Solidity Testing](./02-solidity.md#testing)
- [Rust Testing](./03-rust-anchor.md#testing)
- [Go Testing](./04-golang.md#testing)
