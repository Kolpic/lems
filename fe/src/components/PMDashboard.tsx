import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';

/** Placeholder dashboard view for project managers (USER role). */
export function PMDashboard() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">PM Dashboard</h1>
        <button
          type="button"
          onClick={logout}
          className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>
      <p className="text-gray-600">
        Welcome, {user?.wallet_address.slice(0, 6)}...{user?.wallet_address.slice(-4)}
      </p>
    </div>
  );
}
