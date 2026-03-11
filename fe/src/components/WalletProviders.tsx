import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProvidersProps {
  readonly children: ReactNode;
}

/** Wraps children with Solana Wallet Adapter context providers. */
export function WalletProviders({ children }: WalletProvidersProps) {
  const endpoint = useMemo(
    () => import.meta.env.VITE_SOLANA_RPC_URL as string | undefined ?? clusterApiUrl('devnet'),
    [],
  );

  const wallets = useMemo(() => [new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
