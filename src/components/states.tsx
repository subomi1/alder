import type { ReactNode } from "react";

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-hidden="true">
      <div className="h-8 w-40 animate-pulse rounded-md bg-paper-deep" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-lg bg-surface shadow-card">
            <div className="aspect-square animate-pulse bg-paper-deep" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-16 animate-pulse rounded bg-paper-deep" />
              <div className="h-5 w-32 animate-pulse rounded bg-paper-deep" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-14 text-center">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg bg-surface px-6 py-10 text-center shadow-card" role="alert">
      <h2 className="font-serif text-2xl">We couldn't load that.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-ink px-4 text-sm font-medium text-paper"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
