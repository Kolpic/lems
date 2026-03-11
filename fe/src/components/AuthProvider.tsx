import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextValue, AuthResponse, AuthUser } from '../types/auth';
import { AuthContext } from '../contexts/AuthContext';

const SESSION_TOKEN_KEY = 'access_token';
const SESSION_USER_KEY = 'auth_user';

/** Attempts to rehydrate the user object from sessionStorage. */
function loadStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  readonly children: ReactNode;
}

/** Provides auth state to the entire application via React Context. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [jwt, setJwt] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_TOKEN_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  const login = useCallback((response: AuthResponse) => {
    sessionStorage.setItem(SESSION_TOKEN_KEY, response.access_token);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(response.user));
    setJwt(response.access_token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setJwt(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      jwt,
      user,
      isAuthenticated: jwt !== null && user !== null,
      isAdmin: user?.role === 'ADMIN',
      isUser: user?.role === 'USER',
      login,
      logout,
    }),
    [jwt, user, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
