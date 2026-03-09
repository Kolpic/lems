/**
 * Represents the authenticated user extracted from the JWT payload.
 * Attached to the request object by JwtAuthGuard via Passport JwtStrategy.
 */
export interface RequestUser {
  readonly id: string;
  readonly walletAddress: string;
  readonly role: string;
}
