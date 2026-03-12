import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from './useAuth';

/** Combines auth logout with wallet disconnect to fully clear session state. */
export function useLogout() {
  const { logout } = useAuth();
  const { disconnect, select } = useWallet();

  return useCallback(() => {
    logout();
    void disconnect();
    select(null);
  }, [logout, disconnect, select]);
}
