import { useLogout } from '../hooks/useLogout';
import { PMRegistryPanel } from './PMRegistryPanel';

/** Admin dashboard view wrapping the PM Registry Panel with sign-out. */
export function AdminDashboard() {
  const logout = useLogout();

  return (
    <div>
      <div className="mx-auto flex max-w-5xl items-center justify-end p-6 pb-0">
        <button
          type="button"
          onClick={logout}
          className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>
      <PMRegistryPanel />
    </div>
  );
}
