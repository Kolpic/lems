import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { verifySignature } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

/** Generates a random nonce string for the sign message. */
function generateNonce(): string {
  return `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
}

/** Encodes a Uint8Array as a base64 string. */
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Login page that connects a Solana wallet and authenticates via signature. */
export function LoginView() {
  const navigate = useNavigate();
  const { connected, publicKey, signMessage, disconnect } = useWallet();
  const auth = useAuth();
  const hasTriggeredSign = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;
    if (hasTriggeredSign.current) return;

    hasTriggeredSign.current = true;

    const performSign = async () => {
      const nonce = generateNonce();
      const message = `Sign this message to authenticate with LEMS. Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(message);

      try {
        const signatureBytes = await signMessage(messageBytes);
        const signatureBase64 = toBase64(signatureBytes);

        setIsVerifying(true);
        const response = await verifySignature({
          wallet_address: publicKey.toBase58(),
          message,
          signature: signatureBase64,
        });

        auth.login(response);
        const path = response.user.role === 'ADMIN' ? '/admin/dashboard' : '/pm/dashboard';
        navigate(path, { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Wallet signature was rejected or failed.';
        setAuthError(message);
        hasTriggeredSign.current = false;
        setIsVerifying(false);
      }
    };

    void performSign();
  }, [connected, publicKey, signMessage, auth, navigate]);

  // If already authenticated, redirect to the appropriate dashboard
  if (auth.isAuthenticated && auth.user) {
    const path = auth.isAdmin ? '/admin/dashboard' : '/pm/dashboard';
    return <Navigate to={path} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            LEMS Authentication
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Connect your Solflare wallet to sign in.
          </p>
        </div>

        <div className="flex justify-center">
          <WalletMultiButton />
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600" role="status">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Verifying signature...
          </div>
        )}

        {authError && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {authError}
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                void disconnect();
                hasTriggeredSign.current = false;
              }}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
