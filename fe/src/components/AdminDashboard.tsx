import { useLogout } from '../hooks/useLogout';
import { PMRegistryPanel } from './PMRegistryPanel';
import { TreasuryPulseHeader } from './TreasuryPulseHeader';
import { BatchRefillModule } from './BatchRefillModule';
import { GlobalTransactionFeed } from './GlobalTransactionFeed';

/** Admin dashboard view with PM registry, treasury overview, and transaction feed. */
export function AdminDashboard() {
  const logout = useLogout();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          type="button"
          onClick={logout}
          className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>

      <TreasuryPulseHeader />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PMRegistryPanel />
        </div>
        <div className="space-y-6">
          <BatchRefillModule />
          <GlobalTransactionFeed />
        </div>
      </div>
    </div>
  );
}
