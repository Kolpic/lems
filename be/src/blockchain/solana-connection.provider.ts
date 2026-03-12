import type { Provider } from '@nestjs/common';
import { Connection } from '@solana/web3.js';

/** Injection token for the singleton Solana Connection instance. */
export const SOLANA_CONNECTION = 'SOLANA_CONNECTION';

const DEVNET_RPC_URL = 'https://api.devnet.solana.com';

/**
 * Factory provider that creates a singleton Solana Connection.
 * Reads SOLANA_RPC_URL from environment; defaults to devnet.
 * Uses 'confirmed' commitment for a balance of speed and finality.
 * Optionally accepts SOLANA_WS_URL for a custom WebSocket endpoint.
 */
export const solanaConnectionProvider: Provider = {
  provide: SOLANA_CONNECTION,
  useFactory: (): Connection => {
    const rpcUrl = process.env.SOLANA_RPC_URL ?? DEVNET_RPC_URL;
    const wsUrl = process.env.SOLANA_WS_URL;

    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: wsUrl,
    });
  },
};
