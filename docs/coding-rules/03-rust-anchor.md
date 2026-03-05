# Rust/Anchor Program Guidelines

Standards and best practices for Solana programs using Anchor framework (`contracts/solana`).

## Table of Contents

- [Anchor Version](#anchor-version)
- [Program Structure](#program-structure)
- [Account Validation](#account-validation)
- [Security Patterns](#security-patterns)
- [Error Handling](#error-handling)
- [Documentation](#documentation)
- [Testing](#testing)

---

## Anchor Version

### Version Standard

```toml
# Anchor.toml
[toolchain]
anchor_version = "0.28.0"

[features]
resolution = true
skip-lint = false
```

---

## Program Structure

### Directory Organization

```
contracts/solana/
├── programs/
│   └── bridge/
│       └── src/
│           ├── lib.rs           # Program entry point
│           ├── errors.rs        # Custom error types
│           ├── events.rs        # Event definitions
│           └── state.rs         # Account state structures
├── tests/
│   └── bridge.ts               # TypeScript tests
└── Anchor.toml
```

### Module Layout (lib.rs)

```rust
use anchor_lang::prelude::*;

// Declare program ID
declare_id!("YourProgramIDHere");

// Module declarations
mod errors;
mod events;
mod state;

use errors::*;
use events::*;
use state::*;

#[program]
pub mod bridge {
    use super::*;

    /// Initialize the bridge program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Implementation
    }

    /// Claim tokens after bridging
    pub fn claim(
        ctx: Context<Claim>,
        message: Vec<u8>,
        signature: Vec<u8>,
    ) -> Result<()> {
        // Implementation
    }
}

// Context structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    // Account definitions
}

#[derive(Accounts)]
pub struct Claim<'info> {
    // Account definitions
}
```

---

## Account Validation

### Context Validation

**Use Anchor's account validation**

```rust
#[derive(Accounts)]
pub struct Claim<'info> {
    /// CHECK: Validated by signature verification
    #[account(mut)]
    pub authority: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + TransactionState::INIT_SPACE,
        seeds = [b"transaction", transaction_hash.as_ref()],
        bump
    )]
    pub transaction_state: Account<'info, TransactionState>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

### Account Constraints

```rust
// ✅ GOOD: Explicit constraints
#[account(
    mut,
    constraint = user_token_account.owner == user.key() @ BridgeError::InvalidTokenAccount,
    constraint = user_token_account.mint == token_mint.key() @ BridgeError::TokenMintMismatch
)]
pub user_token_account: Account<'info, TokenAccount>,

// ✅ GOOD: Seeds validation for PDAs
#[account(
    seeds = [b"bridge-state"],
    bump = bridge_state.bump,
)]
pub bridge_state: Account<'info, BridgeState>,
```

---

## Security Patterns

### CEI Pattern (Checks-Effects-Interactions)

```rust
pub fn claim(
    ctx: Context<Claim>,
    message: Vec<u8>,
    signature: Vec<u8>,
) -> Result<()> {
    // ========== CHECKS ==========
    // 1. Validate message format
    require!(message.len() == 104, BridgeError::InvalidMessageLength);

    // 2. Verify signature
    let pubkey = Pubkey::from_str(VALIDATOR_PUBLIC_KEY)
        .map_err(|_| BridgeError::InvalidValidatorKey)?;

    ed25519_program::verify(&pubkey, &message, &signature)
        .map_err(|_| BridgeError::InvalidSignature)?;

    // 3. Check not already claimed
    require!(
        ctx.accounts.transaction_state.status == TransactionStatus::Pending,
        BridgeError::AlreadyClaimed
    );

    // ========== EFFECTS ==========
    ctx.accounts.transaction_state.status = TransactionStatus::Claimed;
    ctx.accounts.transaction_state.claimed_at = Clock::get()?.unix_timestamp;

    // ========== INTERACTIONS ==========
    // Mint tokens to user
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        ),
        amount,
    )?;

    // Emit event
    emit!(TokensClaimed {
        transaction_hash,
        user: ctx.accounts.user.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

### Overflow Protection

```rust
// ✅ GOOD: Use checked arithmetic
let total = amount1.checked_add(amount2)
    .ok_or(BridgeError::Overflow)?;

// ✅ GOOD: Safe operations with explicit checks
pub fn add_amount(current: u64, additional: u64) -> Result<u64> {
    current.checked_add(additional)
        .ok_or_else(|| error!(BridgeError::AmountOverflow))
}

// ❌ BAD: Unchecked arithmetic
let total = amount1 + amount2; // Can panic on overflow!
```

### Signer Validation

```rust
// ✅ GOOD: Verify signer
#[account(mut)]
pub user: Signer<'info>,

// In instruction:
require!(ctx.accounts.user.key() == expected_authority, BridgeError::Unauthorized);

// ✅ GOOD: PDA signer
#[account(
    seeds = [b"authority"],
    bump,
)]
pub pda_authority: AccountInfo<'info>,

// Use for CPI:
let signer_seeds = &[&[b"authority", &[ctx.bumps.pda_authority]][..]];
```

---

## Error Handling

### Custom Errors

```rust
// errors.rs
use anchor_lang::prelude::*;

#[error_code]
pub enum BridgeError {
    #[msg("Invalid message length. Expected 104 bytes")]
    InvalidMessageLength,

    #[msg("Signature verification failed")]
    InvalidSignature,

    #[msg("Transaction already claimed")]
    AlreadyClaimed,

    #[msg("Insufficient balance")]
    InsufficientBalance,

    #[msg("Token mint mismatch")]
    TokenMintMismatch,

    #[msg("Amount overflow")]
    AmountOverflow,
}
```

### Error Usage

```rust
// ✅ GOOD: Use require! with custom errors
require!(
    message.len() == 104,
    BridgeError::InvalidMessageLength
);

// ✅ GOOD: Return errors with context
pub fn validate_amount(amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(error!(BridgeError::ZeroAmount));
    }
    if amount > MAX_BRIDGE_AMOUNT {
        return Err(error!(BridgeError::ExcessiveAmount));
    }
    Ok(())
}

// ❌ BAD: Using panic
assert!(amount > 0); // Don't use assert! in programs
```

---

## Documentation

### Rustdoc Comments

```rust
/// Claims tokens on Solana after bridging from Ethereum
///
/// # Arguments
///
/// * `ctx` - The program context containing all accounts
/// * `message` - The 104-byte bridge message from Ethereum
/// * `signature` - The validator's Ed25519 signature
///
/// # Security
///
/// - Validates Ed25519 signature from trusted validator
/// - Checks message hash matches stored hash
/// - Prevents double-claiming via status check
/// - Implements CEI pattern for safety
///
/// # Errors
///
/// Returns error if:
/// - Message length is not 104 bytes
/// - Signature verification fails
/// - Transaction already claimed
/// - Token minting fails
pub fn claim(
    ctx: Context<Claim>,
    message: Vec<u8>,
    signature: Vec<u8>,
) -> Result<()> {
    // Implementation
}
```

### Account Documentation

```rust
/// Bridge state account storing configuration
#[account]
pub struct BridgeState {
    /// Program authority that can modify settings
    pub authority: Pubkey,
    /// Bump seed for PDA derivation
    pub bump: u8,
    /// Minimum bridge amount (in lamports)
    pub min_bridge_amount: u64,
    /// Total number of transactions processed
    pub transaction_count: u64,
    /// Whether the bridge is currently paused
    pub is_paused: bool,
}
```

---

## Testing

### Test Structure

```typescript
// tests/bridge.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { expect } from "chai";

describe("bridge", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Bridge as Program<Bridge>;

  it("Initializes the bridge", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        // Account list
      })
      .rpc();

    const bridgeState = await program.account.bridgeState.fetch(bridgeStatePDA);
    expect(bridgeState.authority.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
  });

  it("Claims tokens with valid signature", async () => {
    const message = Buffer.from(/* ... */);
    const signature = Buffer.from(/* ... */);

    await program.methods
      .claim(Array.from(message), Array.from(signature))
      .accounts({
        // Account list
      })
      .rpc();

    const txState = await program.account.transactionState.fetch(txStatePDA);
    expect(txState.status).to.deep.equal({ claimed: {} });
  });

  it("Rejects invalid signature", async () => {
    const message = Buffer.from(/* ... */);
    const badSignature = Buffer.alloc(64); // Invalid

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

## Summary

Key takeaways for Rust/Anchor development:

1. **Anchor Validation**: Use account constraints for validation
2. **CEI Pattern**: Follow Checks-Effects-Interactions
3. **Checked Math**: Use checked_add/sub/mul to prevent overflows
4. **Custom Errors**: Define descriptive error types
5. **Documentation**: Use rustdoc for all public items
6. **Testing**: Comprehensive test coverage with Anchor tests
7. **Security**: Validate signatures, check account ownership, prevent reentrancy

For more details, see:

- [General Guidelines](./00-general-guidelines.md)
- [Testing Standards](./06-testing.md)
- [Anchor Book](https://book.anchor-lang.com/)
