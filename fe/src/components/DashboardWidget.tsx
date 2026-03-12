import type { ReactNode } from 'react';

interface DashboardWidgetProps {
  /** Widget title displayed in the card header. */
  readonly title: string;
  /** Optional children to render inside the widget. Defaults to "Coming soon" placeholder. */
  readonly children?: ReactNode;
}

/** Stub dashboard widget card used as a placeholder for future features. */
export function DashboardWidget({ title, children }: DashboardWidgetProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {children ?? (
        <p className="mt-2 text-sm text-gray-400">Coming soon</p>
      )}
    </div>
  );
}
