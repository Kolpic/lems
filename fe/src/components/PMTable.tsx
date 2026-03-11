import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import type { PM } from '../types/registry';
import { EditTargetDialog } from './EditTargetDialog';

interface PMTableProps {
  readonly data: PM[];
  readonly onUpdateTarget: (id: string, newBalance: number) => Promise<unknown>;
  readonly isUpdatingTarget: boolean;
}

const columnHelper = createColumnHelper<PM>();

export function PMTable({ data, onUpdateTarget, isUpdatingTarget }: PMTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('project', {
        header: 'Project',
        cell: (info) => info.getValue().name,
      }),
      columnHelper.accessor('wallet_address', {
        header: 'Wallet Address',
        cell: (info) => {
          const address = info.getValue();
          return (
            <span className="font-mono text-sm" title={address}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          );
        },
      }),
      columnHelper.accessor('target_balance', {
        header: 'Target Balance',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="inline-flex items-center">
              {info.getValue()}
              <EditTargetDialog
                pmId={row.id}
                pmName={row.name}
                currentBalance={info.getValue()}
                onSave={onUpdateTarget}
                isSaving={isUpdatingTarget}
              />
            </span>
          );
        },
      }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: (info) =>
          info.getValue() ? (
            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Inactive
            </span>
          ),
      }),
    ],
    [onUpdateTarget, isUpdatingTarget],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">
        No project managers registered yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
