import type { ReactNode } from 'react';

export function FullPageStatus({ text }: { text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-ground px-4 text-muted" role="status">
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger-ink">
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-quiet" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-rule px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {children && <div className="mx-auto mt-2 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}
