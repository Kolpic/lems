/** User profile returned from the auth endpoint. */
export interface AuthUser {
  readonly id: string;
  readonly wallet_address: string;
  readonly role: 'ADMIN' | 'USER';
}

/** Response from POST /api/v1/auth/verify (matches actual BE format). */
export interface AuthResponse {
  readonly access_token: string;
  readonly user: AuthUser;
}

/** Payload sent to POST /api/v1/auth/verify. */
export interface VerifySignaturePayload {
  readonly wallet_address: string;
  readonly message: string;
  readonly signature: string;
}

/** Shape of the AuthContext value exposed by useAuth(). */
export interface AuthContextValue {
  readonly jwt: string | null;
  readonly user: AuthUser | null;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly isUser: boolean;
  readonly login: (response: AuthResponse) => void;
  readonly logout: () => void;
}
