import type { AuthResponse, VerifySignaturePayload } from '../types/auth';

const API_BASE_URL = 'http://localhost:3000/api/v1';

/** Submits a wallet signature to the backend for verification and JWT issuance. */
export async function verifySignature(payload: VerifySignaturePayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  return response.json() as Promise<AuthResponse>;
}
