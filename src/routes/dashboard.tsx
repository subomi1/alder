import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, listMyReviews } from "@/lib/catalog/api";
import { RequireAccount } from "@/components/require-account";
import { Stars } from "@/components/stars";
import { EmptyState, ErrorState } from "@/components/states";
import { buttonStyles } from "@/components/ui/button";
import { errorText, formatDate, formatRating } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const profile = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const reviews = useQuery({ queryKey: ["my-reviews"], queryFn: () => listMyReviews() });
  const average =
    reviews.data && reviews.data.length
      ? reviews.data.reduce((sum, review) => sum + review.score, 0) / reviews.data.length
      : 0;

  return (
    <RequireAccount>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs tracking-widest text-muted uppercase">Your house</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
          {profile.data ? `Hello, ${profile.data.displayName}` : "Dashboard"}
        </h1>
        {profile.data?.suspended ? (
          <p className="mt-4 max-w-xl text-sm text-danger">
            This account is suspended. You can still read the shelf, but new reviews are blocked.
          </p>
        ) : null}
        {profile.data?.role === "admin" ? (
          <Link to="/admin" className={`${buttonStyles({ variant: "secondary" })} mt-6`}>
            Open admin desk
          </Link>
        ) : null}

        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          <Tile label="Reviews" value={String(reviews.data?.length ?? "—")} />
          <Tile label="Average given" value={reviews.data ? formatRating(average) : "—"} />
          <Tile label="Role" value={profile.data?.role === "admin" ? "Administrator" : "Member"} />
        </dl>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-3xl">Recent reviews</h2>
            <Link to="/reviews" className="text-sm text-muted hover:text-ink">
              All of yours
            </Link>
          </div>
          {reviews.isPending ? <div className="mt-4 h-24 animate-pulse rounded-lg bg-paper-deep" /> : null}
          {reviews.isError ? (
            <div className="mt-4">
              <ErrorState message={errorText(reviews.error)} onRetry={() => void reviews.refetch()} />
            </div>
          ) : null}
          {reviews.data && reviews.data.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="You haven't reviewed anything yet"
                body="Pick an object on the shelf and leave a rating from one to five."
                action={
                  <Link to="/products" className={buttonStyles()}>
                    Browse products
                  </Link>
                }
              />
            </div>
          ) : null}
          {reviews.data && reviews.data.length > 0 ? (
            <ul className="mt-4 divide-y divide-line rounded-lg bg-surface px-5 shadow-card">
              {reviews.data.slice(0, 4).map((review) => (
                <li key={review.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link
                      to="/products/$slug"
                      params={{ slug: review.productSlug }}
                      className="font-medium hover:underline"
                    >
                      {review.productName}
                    </Link>
                    <p className="text-sm text-muted">{review.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <Stars value={review.score} />
                    <span>{formatDate(review.updatedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </RequireAccount>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-5 py-4 shadow-card">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-3xl capitalize tabular-nums">{value}</dd>
    </div>
  );
}
