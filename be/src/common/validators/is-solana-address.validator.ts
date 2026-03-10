import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PublicKey } from '@solana/web3.js';

const SOLANA_ADDRESS_LENGTH = 44;

/**
 * Custom validator constraint that verifies a string is a valid Solana public key.
 * Validates both string length (exactly 44 characters) and Base58 format
 * by attempting to instantiate a PublicKey from @solana/web3.js.
 */
@ValidatorConstraint({ async: false })
export class IsSolanaAddressConstraint implements ValidatorConstraintInterface {
  /** @inheritdoc */
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    if (value.length !== SOLANA_ADDRESS_LENGTH) return false;

    try {
      new PublicKey(value);
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  defaultMessage(): string {
    return 'Invalid Solana address format. Must be a 44-character public key.';
  }
}

/**
 * Decorator that validates a property is a valid Solana public key address.
 *
 * @param validationOptions - Optional class-validator options
 * @returns PropertyDecorator
 */
export function IsSolanaAddress(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    registerDecorator({
      target: target.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: IsSolanaAddressConstraint,
    });
  };
}
