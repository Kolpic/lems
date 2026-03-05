# Solidity Smart Contract Guidelines

Standards and best practices for Ethereum smart contracts (`contracts/ethereum`).

## Table of Contents

- [Compiler Version](#compiler-version)
- [Contract Structure](#contract-structure)
- [Security Patterns](#security-patterns)
- [NatSpec Documentation](#natspec-documentation)
- [Function Modifiers](#function-modifiers)
- [Error Handling](#error-handling)
- [Events](#events)
- [Gas Optimization](#gas-optimization)
- [Testing](#testing)

---

## Compiler Version

### Version Standard

```solidity
// ✅ GOOD: Specific version with caret
pragma solidity ^0.8.13;

// ❌ BAD: Floating pragma
pragma solidity >=0.8.0 <0.9.0;

// ❌ BAD: Wildcard
pragma solidity *;
```

**Rationale**: Specific versions ensure consistent compilation and prevent unexpected behavior from compiler updates.

### Compiler Settings

**foundry.toml**:

```toml
[profile.default]
solc_version = "0.8.13"
optimizer = true
optimizer_runs = 200
via_ir = false
```

---

## Contract Structure

### File Organization

**One contract per file**, named identically:

```
contracts/ethereum/src/
├── BridgeContract.sol
├── TokenRegistry.sol
└── interfaces/
    └── IBridgeContract.sol
```

### Contract Layout

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// 1. Imports (OpenZeppelin first, then local)
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IBridgeContract.sol";

// 2. Contract with NatSpec
/// @title Bridge Contract for cross-chain token transfers
/// @author Age of Empires Team
/// @notice Handles token burning and cross-chain bridge events
/// @dev Implements CEI pattern for all state-changing operations
contract BridgeContract is Ownable, Pausable, ReentrancyGuard {

    // 3. Type declarations
    using SafeERC20 for IERC20;

    // 4. State variables (grouped by visibility)
    mapping(address => bool) public supportedTokens;
    uint256 public minBridgeAmount;
    uint256 public bridgeCounter;

    // 5. Events
    event TokenBridged(/* params */);
    event TokenSupported(address indexed token, bool supported);

    // 6. Custom errors
    error TokenNotSupported(address token);
    error InsufficientAmount(uint256 provided, uint256 required);
    error InvalidDestinationAddress();

    // 7. Modifiers
    modifier onlySupportedToken(address token) {
        if (!supportedTokens[token]) revert TokenNotSupported(token);
        _;
    }

    // 8. Constructor
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialization
    }

    // 9. External functions
    function bridge(/* params */) external { }

    // 10. Public functions
    function getSupportedTokens() public view returns (address[] memory) { }

    // 11. Internal functions
    function _validateBridge(/* params */) internal view { }

    // 12. Private functions
    function _executeTokenBurn(/* params */) private { }
}
```

---

## Security Patterns

### Checks-Effects-Interactions (CEI)

**Always follow CEI pattern to prevent reentrancy**

```solidity
/// @dev Implements CEI pattern
function bridge(
    address token,
    uint256 amount,
    string calldata destinationAddress
) external whenNotPaused nonReentrant onlySupportedToken(token) {
    // ========== CHECKS ==========
    if (amount < minBridgeAmount) {
        revert InsufficientAmount(amount, minBridgeAmount);
    }
    if (bytes(destinationAddress).length == 0) {
        revert InvalidDestinationAddress();
    }

    // ========== EFFECTS ==========
    unchecked {
        bridgeCounter++; // Safe: won't overflow in practice
    }

    // ========== INTERACTIONS ==========
    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    IERC20(token).burn(amount); // or safeTransfer to burn address

    emit TokenBridged(
        bridgeCounter,
        msg.sender,
        token,
        amount,
        destinationAddress,
        block.timestamp
    );
}
```

### Reentrancy Protection

**Use OpenZeppelin's ReentrancyGuard**

```solidity
// ✅ GOOD: ReentrancyGuard on state-changing functions
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BridgeContract is ReentrancyGuard {
    function bridge(/* params */) external nonReentrant {
        // Protected from reentrancy
    }
}

// ❌ BAD: No protection
function bridge(/* params */) external {
    // Vulnerable to reentrancy!
    token.call{value: amount}("");
}
```

### Access Control

**Use OpenZeppelin's access control contracts**

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// ✅ GOOD: Simple owner-only functions
contract BridgeContract is Ownable {
    function pause() external onlyOwner {
        _pause();
    }
}

// ✅ GOOD: Role-based access for complex permissions
contract BridgeContract is AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function validateTransaction(/* params */) external onlyRole(VALIDATOR_ROLE) {
        // Only validators can call
    }
}
```

### Integer Overflow/Underflow

**Solidity 0.8+ has built-in overflow checks**

```solidity
// ✅ GOOD: Default checked arithmetic (Solidity 0.8+)
uint256 total = amount1 + amount2; // Reverts on overflow

// ✅ GOOD: Use unchecked for gas optimization when safe
unchecked {
    bridgeCounter++; // Safe: won't overflow in practice
    i++; // Loop counter
}

// ❌ BAD: Using SafeMath in 0.8+ (unnecessary)
using SafeMath for uint256;
uint256 total = amount1.add(amount2); // Redundant in 0.8+
```

### Input Validation

```solidity
// ✅ GOOD: Validate all inputs
function bridge(
    address token,
    uint256 amount,
    string calldata destinationAddress
) external {
    // Validate token
    if (token == address(0)) revert InvalidToken();
    if (!supportedTokens[token]) revert TokenNotSupported(token);

    // Validate amount
    if (amount == 0) revert ZeroAmount();
    if (amount < minBridgeAmount) revert InsufficientAmount(amount, minBridgeAmount);
    if (amount > MAX_BRIDGE_AMOUNT) revert ExcessiveAmount(amount, MAX_BRIDGE_AMOUNT);

    // Validate destination
    if (bytes(destinationAddress).length == 0) revert InvalidDestinationAddress();
    if (bytes(destinationAddress).length > 64) revert DestinationAddressTooLong();

    // Proceed with bridge...
}
```

---

## NatSpec Documentation

### Documentation Standard

**All public/external functions MUST have NatSpec**

```solidity
/// @notice Burns tokens and initiates cross-chain bridge transfer
/// @dev Implements CEI pattern for reentrancy protection
/// @param token The ERC20 token address to bridge
/// @param amount The amount of tokens to burn (in token's smallest unit)
/// @param destinationAddress The destination address on target chain (hex string)
/// @return bridgeId The unique identifier for this bridge transaction
/// @custom:security Requires token to be in supportedTokens mapping
/// @custom:security Uses nonReentrant modifier to prevent reentrancy attacks
/// @custom:security Validates amount is above minBridgeAmount
function bridge(
    address token,
    uint256 amount,
    string calldata destinationAddress
) external whenNotPaused nonReentrant returns (uint256 bridgeId) {
    // Implementation
}
```

### NatSpec Tags

- `@title` - Contract title (contracts only)
- `@author` - Author name (contracts only)
- `@notice` - User-facing description
- `@dev` - Developer notes and implementation details
- `@param` - Parameter description
- `@return` - Return value description
- `@custom:security` - Security considerations
- `@custom:gas` - Gas optimization notes
- `@inheritdoc` - Inherit documentation from interface/parent

### Contract-Level Documentation

```solidity
/// @title Bridge Contract for Cross-Chain Token Transfers
/// @author Age of Empires Team
/// @notice Enables users to bridge ERC20 tokens from Ethereum to Solana
/// @dev This contract handles token burning on Ethereum side. The bridge monitors
///      BridgeEvent emissions and mints equivalent tokens on Solana after validation.
/// @custom:security-contact security@ageofempires.com
contract BridgeContract is Ownable, Pausable, ReentrancyGuard {
    // ...
}
```

---

## Function Modifiers

### Modifier Order

```solidity
// ✅ GOOD: Consistent modifier order
// 1. Visibility (external, public, internal, private)
// 2. State mutability (pure, view, payable)
// 3. Custom modifiers (in logical order: access → state → validation)
// 4. Returns

function bridge(
    address token,
    uint256 amount
)
    external                    // 1. Visibility
    payable                     // 2. State mutability
    whenNotPaused              // 3. State check
    nonReentrant               // 3. Security
    onlySupportedToken(token)  // 3. Validation
    returns (uint256)          // 4. Return type
{
    // Implementation
}
```

### Custom Modifiers

```solidity
// ✅ GOOD: Descriptive modifier names
modifier onlySupportedToken(address token) {
    if (!supportedTokens[token]) {
        revert TokenNotSupported(token);
    }
    _;
}

modifier validAmount(uint256 amount) {
    if (amount < minBridgeAmount) {
        revert InsufficientAmount(amount, minBridgeAmount);
    }
    _;
}

// Use in function
function bridge(address token, uint256 amount)
    external
    onlySupportedToken(token)
    validAmount(amount)
{
    // Implementation
}
```

---

## Error Handling

### Custom Errors (Gas Efficient)

**Always use custom errors over require strings**

```solidity
// ✅ GOOD: Custom errors with parameters
error TokenNotSupported(address token);
error InsufficientAmount(uint256 provided, uint256 required);
error UnauthorizedCaller(address caller, address expected);
error InvalidDestinationAddress(string provided);

function bridge(address token, uint256 amount) external {
    if (!supportedTokens[token]) {
        revert TokenNotSupported(token);
    }
    if (amount < minBridgeAmount) {
        revert InsufficientAmount(amount, minBridgeAmount);
    }
    // ...
}

// ❌ BAD: require with string (expensive gas)
function bridge(address token, uint256 amount) external {
    require(supportedTokens[token], "Token not supported");
    require(amount >= minBridgeAmount, "Amount too low");
}
```

### Error Naming Conventions

- Use PascalCase for error names
- Include relevant parameters for debugging
- Be specific: `InvalidTokenAddress` not just `Invalid`
- Group related errors:

```solidity
// Token errors
error TokenNotSupported(address token);
error TokenAlreadySupported(address token);
error TokenTransferFailed(address token, address from, address to);

// Amount errors
error ZeroAmount();
error InsufficientAmount(uint256 provided, uint256 required);
error ExcessiveAmount(uint256 provided, uint256 maximum);

// Authorization errors
error Unauthorized(address caller);
error OnlyOwner(address caller, address owner);
```

---

## Events

### Event Declarations

```solidity
// ✅ GOOD: Indexed parameters for filtering, descriptive names
event TokenBridged(
    uint256 indexed bridgeId,
    address indexed sender,
    address indexed token,
    uint256 amount,
    string destinationAddress,
    uint256 timestamp
);

event TokenSupported(address indexed token, bool supported);
event MinBridgeAmountUpdated(uint256 oldAmount, uint256 newAmount);

// Up to 3 indexed parameters (cheaper for filtering)
// Remaining parameters not indexed (cheaper to emit)
```

### Event Emission

**Emit events for all state changes**

```solidity
// ✅ GOOD: Event emitted after state change (CEI pattern)
function setSupportedToken(address token, bool supported) external onlyOwner {
    // CHECKS
    if (token == address(0)) revert InvalidTokenAddress();

    // EFFECTS
    supportedTokens[token] = supported;

    // EVENT (part of effects)
    emit TokenSupported(token, supported);
}

// ❌ BAD: No event emitted
function setSupportedToken(address token, bool supported) external onlyOwner {
    supportedTokens[token] = supported;
    // Missing event!
}
```

---

## Gas Optimization

### Storage vs Memory vs Calldata

```solidity
// ✅ GOOD: Use appropriate data location
function processData(
    uint256[] calldata ids,      // calldata: external + read-only
    string memory name,          // memory: will be modified
    uint256 amount              // value type: no location specifier
) external {
    // Use calldata for large arrays that won't be modified
    for (uint256 i = 0; i < ids.length; i++) {
        // Process ids[i]
    }

    // Use memory for strings/arrays that will be modified
    bytes memory nameBytes = bytes(name);
}

// ❌ BAD: Using memory when calldata would work
function processData(uint256[] memory ids) external {
    // Copying to memory costs extra gas
}
```

### Unchecked Arithmetic

```solidity
// ✅ GOOD: Unchecked for safe operations
function distribute(uint256 amount) external {
    uint256 remaining = amount;

    for (uint256 i = 0; i < recipients.length;) {
        // Send to recipient...

        unchecked {
            i++; // Loop counter can't overflow
        }
    }
}

// ❌ BAD: Checked arithmetic where unnecessary
for (uint256 i = 0; i < recipients.length; i++) {
    // Overflow check on every iteration (expensive)
}
```

### Short-Circuit Evaluation

```solidity
// ✅ GOOD: Cheap checks first
if (amount == 0 || amount < minAmount || !supportedTokens[token]) {
    revert InvalidBridge();
}

// ❌ BAD: Expensive check first
if (!supportedTokens[token] || amount == 0 || amount < minAmount) {
    // SLOAD before simple comparisons
}
```

### Caching Storage Reads

```solidity
// ✅ GOOD: Cache storage variable
function calculateTotal() external view returns (uint256) {
    uint256 _minAmount = minBridgeAmount; // Cache SLOAD

    uint256 total = 0;
    for (uint256 i = 0; i < items.length; i++) {
        if (items[i] >= _minAmount) {  // Use cached value
            total += items[i];
        }
    }
    return total;
}

// ❌ BAD: Reading from storage multiple times
function calculateTotal() external view returns (uint256) {
    uint256 total = 0;
    for (uint256 i = 0; i < items.length; i++) {
        if (items[i] >= minBridgeAmount) {  // SLOAD on every iteration!
            total += items[i];
        }
    }
    return total;
}
```

### Uint256 Packing

```solidity
// ✅ GOOD: Pack smaller uints in same slot (32 bytes total)
struct BridgeData {
    uint128 amount;      // 16 bytes
    uint64 timestamp;    // 8 bytes
    uint32 chainId;      // 4 bytes
    uint32 status;       // 4 bytes
    // Total: 32 bytes = 1 storage slot
}

// ❌ BAD: Each uint256 uses full slot
struct BridgeData {
    uint256 amount;      // 32 bytes = 1 slot
    uint256 timestamp;   // 32 bytes = 1 slot
    uint256 chainId;     // 32 bytes = 1 slot
    uint256 status;      // 32 bytes = 1 slot
    // Total: 128 bytes = 4 storage slots (3x more expensive)
}
```

---

## Testing

### Test Structure

```solidity
// Test file: BridgeContract.t.sol
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/BridgeContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BridgeContractTest is Test {
    BridgeContract public bridge;
    MockERC20 public token;

    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        // Deploy contracts
        vm.prank(owner);
        bridge = new BridgeContract(owner);

        token = new MockERC20("Test Token", "TEST", 18);

        // Setup initial state
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

### Testing Best Practices

1. **Test all public/external functions**
2. **Test all revert conditions**
3. **Use fuzz testing for numeric inputs**
4. **Test access control**
5. **Test pause/unpause functionality**
6. **Test edge cases** (zero amounts, maximum values)
7. **Test event emissions**

---

## Summary

Key takeaways for Solidity development:

1. **Security First**: CEI pattern, reentrancy guards, input validation
2. **Custom Errors**: Use instead of require strings for gas efficiency
3. **NatSpec**: Document all public functions comprehensively
4. **OpenZeppelin**: Use battle-tested libraries for common patterns
5. **Gas Optimization**: Calldata, unchecked math, storage caching
6. **Events**: Emit for all state changes with indexed parameters
7. **Testing**: Comprehensive test coverage including edge cases

For more details, see:

- [General Guidelines](./00-general-guidelines.md)
- [Testing Standards](./06-testing.md)
- [OpenZeppelin Contracts Docs](https://docs.openzeppelin.com/contracts/)
