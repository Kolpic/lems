import { useRegistryManager } from '../hooks/useRegistryManager';
import { PMTable } from './PMTable';
import { AddPMForm } from './AddPMForm';
import { Spinner } from './Spinner';

/** PM registry panel with table, edit, and add form. Layout-agnostic — parent owns spacing/width. */
export function PMRegistryPanel() {
  const { pms, isLoading, error, currencies, projects, addPM, isAdding, updateTarget, isUpdatingTarget } = useRegistryManager();

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">PM Registry</h2>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          Failed to load registry. Please try again later.
        </div>
      )}

      {!isLoading && !error && (
        <PMTable
          data={pms}
          onUpdateTarget={(id, newBalance) => updateTarget({ id, target_balance: newBalance })}
          isUpdatingTarget={isUpdatingTarget}
        />
      )}

      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Add Project Manager</h2>
        <AddPMForm onSubmit={addPM} isSubmitting={isAdding} currencies={currencies} projects={projects} />
      </div>
    </div>
  );
}
