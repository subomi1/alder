import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminStats } from "@/lib/catalog/api";
import { AdminFrame } from "@/components/admin-frame";
import { ErrorState } from "@/components/states";
import { errorText, formatRating } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminStats() });
  return (
    <AdminFrame title="Overview" lede="A snapshot of the shelf: members, objects, and what is waiting on moderation.">
      {stats.isPending ? <div className="h-40 animate-pulse rounded-lg bg-paper-deep" /> : null}
      {stats.isError ? <ErrorState message={errorText(stats.error)} onRetry={() => void stats.refetch()} /> : null}
      {stats.data ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Tile label="Products" value={String(stats.data.products)} />
              <Tile label="Members" value={String(stats.data.users)} />
              <Tile label="Reviews" value={String(stats.data.reviews)} />
              <Tile label="Hidden" value={String(stats.data.hidden)} />
              <Tile label="Suspended" value={String(stats.data.suspended)} />
              <Tile label="Average" value={formatRating(stats.data.avgRating)} />
            </dl>
            <h2 className="mt-10 font-serif text-2xl">Published reviews by category</h2>
            <ul className="mt-4 space-y-3">
              {stats.data.byCategory.map((item) => {
                const max = Math.max(1, ...stats.data!.byCategory.map((row) => row.reviews));
                return (
                  <li key={item.name} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-sm">
                    <span>{item.name}</span>
                    <span className="h-2 rounded-full bg-paper-deep">
                      <span
                        className="block h-2 rounded-full bg-accent"
                        style={{ width: `${(item.reviews / max) * 100}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-muted">{item.reviews}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <aside>
            <h2 className="font-serif text-2xl">Latest notes</h2>
            <ul className="mt-4 space-y-3">
              {stats.data.recent.map((review) => (
                <li key={review.id} className="rounded-lg bg-surface p-4 shadow-card">
                  <p className="text-sm text-muted">{review.productName}</p>
                  <p className="font-medium">{review.title}</p>
                  <p className="text-sm text-muted">
                    {review.authorName} · {review.status}
                  </p>
                </li>
              ))}
            </ul>
            <Link to="/admin/reviews" className="mt-4 inline-flex min-h-11 items-center text-sm text-accent">
              Moderate reviews
            </Link>
          </aside>
        </div>
      ) : null}
    </AdminFrame>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-4 shadow-card">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-3xl tabular-nums">{value}</dd>
    </div>
  );
}
