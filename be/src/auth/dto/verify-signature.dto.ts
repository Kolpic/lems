import { IsNotEmpty, IsString } from 'class-validator';
import { IsSolanaAddress } from '../../common/validators/is-solana-address.validator';

/**
 * Data transfer object for wallet-based authentication.
 * The frontend signs a plaintext message with the user's Solana wallet
 * and submits the wallet address, message, and signature for verification.
 */
export class VerifySignatureDto {
  /** The Solana wallet address (must be a valid 44-character Base58 public key). */
  @IsSolanaAddress()
  readonly wallet_address!: string;

  /** The plaintext message that was signed by the wallet. */
  @IsString()
  @IsNotEmpty()
  readonly message!: string;

  /** The Base58-encoded ed25519 signature produced by the wallet. */
  @IsString()
  @IsNotEmpty()
  readonly signature!: string;
}
