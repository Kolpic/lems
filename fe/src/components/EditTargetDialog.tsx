import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface EditTargetDialogProps {
  readonly pmId: string;
  readonly pmName: string;
  readonly currentBalance: string;
  readonly onSave: (id: string, newBalance: number) => Promise<unknown>;
  readonly isSaving: boolean;
}

/**
 * Radix UI Dialog for editing a PM's target balance.
 * Opens via a pencil icon button and validates that the new balance is > 0.
 */
export function EditTargetDialog({
  pmId,
  pmName,
  currentBalance,
  onSave,
  isSaving,
}: EditTargetDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentBalance);
  const [error, setError] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setValue(currentBalance);
      setError('');
    }
  };

  const handleSave = async () => {
    const parsed = Number(value);

    if (Number.isNaN(parsed) || parsed < 1) {
      setError('Target balance must be a number greater than 0.');
      return;
    }

    try {
      await onSave(pmId, parsed);
      setOpen(false);
    } catch {
      setError('Failed to update target balance. Please try again.');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="ml-2 inline-flex items-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={`Edit target balance for ${pmName}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            Edit Target Balance
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500">
            Update the target balance for <span className="font-medium">{pmName}</span>.
          </Dialog.Description>

          <div className="mt-4">
            <label htmlFor="target-balance-input" className="block text-sm font-medium text-gray-700">
              Target Balance
            </label>
            <input
              id="target-balance-input"
              type="number"
              min="1"
              step="any"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSaving}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSaving}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
