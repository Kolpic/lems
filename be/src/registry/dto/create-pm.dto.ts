import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { IsSolanaAddress } from '../../common/validators/is-solana-address.validator';

/**
 * Data transfer object for creating a new Project Manager registration.
 * All fields are validated using class-validator decorators.
 */
export class CreatePMDto {
  /** The display name of the project manager. */
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  /** The Solana wallet address (must be a valid 44-character Base58 public key). */
  @IsSolanaAddress()
  readonly wallet_address!: string;

  /** The monthly target balance to maintain for this PM's wallet. Must be at least 1. */
  @IsNumber()
  @Min(1)
  readonly target_balance!: number;

  /** The project identifier this PM is assigned to. */
  @IsString()
  @IsNotEmpty()
  readonly project_id!: string;

  /** The UUID of the currency (e.g., USDC) for this PM's allocations. */
  @IsUUID()
  readonly currency_id!: string;
}
