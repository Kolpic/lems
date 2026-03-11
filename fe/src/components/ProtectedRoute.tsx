import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

type AllowedRole = 'ADMIN' | 'USER';

interface ProtectedRouteProps {
  readonly children: ReactNode;
  readonly allowedRole: AllowedRole;
}

/** Route guard that redirects unauthenticated or unauthorized users. */
export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== allowedRole) {
    const redirectPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/pm/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
