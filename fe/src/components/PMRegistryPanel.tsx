import { useRegistryManager } from '../hooks/useRegistryManager';
import { PMTable } from './PMTable';
import { AddPMForm } from './AddPMForm';

export function PMRegistryPanel() {
  const { pms, isLoading, error, currencies, projects, addPM, isAdding } = useRegistryManager();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-gray-900">PM Registry</h1>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          Failed to load registry. Please try again later.
        </div>
      )}

      {!isLoading && !error && <PMTable data={pms} />}

      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Add Project Manager</h2>
        <AddPMForm onSubmit={addPM} isSubmitting={isAdding} currencies={currencies} projects={projects} />
      </div>
    </div>
  );
}
