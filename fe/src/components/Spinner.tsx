interface SpinnerProps {
  /** Tailwind size class for width and height (e.g. 'h-4 w-4', 'h-8 w-8'). */
  readonly size?: string;
}

/** Reusable animated loading spinner. */
export function Spinner({ size = 'h-8 w-8' }: SpinnerProps) {
  return (
    <div
      className={`${size} animate-spin rounded-full border-4 border-blue-600 border-t-transparent`}
      role="status"
      aria-label="Loading"
    />
  );
}
