import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';
import { PersonalBudgetCard } from './PersonalBudgetCard';
import { PersonalTransactionFeed } from './PersonalTransactionFeed';

/** Dashboard view for project managers (USER role). */
export function PMDashboard() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PM Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome, {user?.wallet_address.slice(0, 6)}...{user?.wallet_address.slice(-4)}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PersonalBudgetCard />
        <PersonalTransactionFeed />
      </div>
    </div>
  );
}
