import { IsNumber, Min } from 'class-validator';

/**
 * Data transfer object for updating a PM's target balance.
 * Only the target_balance field can be modified via this DTO.
 */
export class UpdateTargetBalanceDto {
  /** The new monthly target balance. Must be at least 1. */
  @IsNumber()
  @Min(1)
  readonly target_balance!: number;
}
