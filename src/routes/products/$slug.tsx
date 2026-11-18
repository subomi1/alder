import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteReview, getMyProfile, getMyReview, getProduct } from "@/lib/catalog/api";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ReviewForm } from "@/components/review-form";
import { Shell } from "@/components/shell";
import { Stars } from "@/components/stars";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { errorText, formatDate, formatRating, money, wasEdited } from "@/lib/format";

export const Route = createFileRoute("/products/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const product = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: slug }),
  });
  const me = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => getMyProfile(),
    enabled: Boolean(user),
  });
  const mine = useQuery({
    queryKey: ["my-review", product.data?.id, user?.id],
    queryFn: () => getMyReview({ data: product.data!.id }),
    enabled: Boolean(user && product.data?.id),
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteReview({ data: { id } }),
    onSuccess: async () => {
      toast.success("Review deleted");
      await queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(errorText(err)),
  });

  const data = product.data;

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link to="/products" className="text-sm text-muted hover:text-ink">
          All products
        </Link>
        {product.isPending ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-lg bg-paper-deep" />
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-paper-deep" />
              <div className="h-10 w-64 animate-pulse rounded bg-paper-deep" />
              <div className="h-24 animate-pulse rounded bg-paper-deep" />
            </div>
          </div>
        ) : null}
        {product.isError ? (
          <div className="mt-6">
            <ErrorState message={errorText(product.error)} onRetry={() => void product.refetch()} />
          </div>
        ) : null}
        {data ? (
          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <div className="overflow-hidden rounded-lg bg-paper-deep">
                <ProductImage src={data.imageUrl} name={data.name} className="aspect-square" />
              </div>
              <p className="mt-8 text-xs tracking-widest text-muted uppercase">{data.brand}</p>
              <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{data.name}</h1>
              <p className="mt-4 max-w-2xl text-ink-soft">{data.description}</p>

              <section className="mt-10">
                <h2 className="font-serif text-3xl">Reviews</h2>
                {data.reviews.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState title="No reviews yet" body="Be the first to say what this object is actually like." />
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {data.reviews.map((review) => (
                      <li key={review.id} className="py-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <Stars value={review.score} />
                          <h3 className="font-serif text-xl">{review.title}</h3>
                          {review.origin === "house" ? (
                            <span className="rounded-full bg-paper-deep px-2 py-1 text-xs text-ink-soft">
                              House note
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 max-w-2xl break-words whitespace-pre-wrap text-sm text-ink-soft">
                          {review.body}
                        </p>
                        <p className="mt-3 text-sm text-muted">
                          {review.authorName} · {formatDate(review.createdAt)}
                          {wasEdited(review.createdAt, review.updatedAt) ? " · Edited" : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {data.related.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-serif text-3xl">Also in {data.categoryName}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {data.related.map((item) => (
                      <ProductCard key={item.id} product={item} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="h-fit rounded-lg bg-surface p-5 shadow-card lg:sticky lg:top-24">
              <p className="text-sm text-muted">{data.categoryName}</p>
              <p className="mt-2 font-serif text-3xl tabular-nums">{money(data.priceCents)}</p>
              <p className="text-xs text-muted">Typical price</p>
              <div className="mt-4 flex items-center gap-2">
                <Stars value={data.avgRating} />
                <span className="text-sm tabular-nums">
                  {formatRating(data.avgRating)} · {data.reviewCount} reviews
                </span>
              </div>
              <Distribution distribution={data.distribution} />
              <div className="mt-6 border-t border-line pt-6">
                {isPending ? <div className="h-24 animate-pulse rounded-md bg-paper-deep" /> : null}
                {!isPending && !user ? (
                  <div>
                    <p className="text-sm text-ink-soft">Sign in to rate this object and publish a review.</p>
                    <Link
                      to="/login"
                      className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink"
                    >
                      Sign in to review
                    </Link>
                  </div>
                ) : null}
                {user && me.data?.suspended ? (
                  <p className="text-sm text-danger">This account is suspended and cannot publish reviews.</p>
                ) : null}
                {user && me.data && !me.data.suspended ? (
                  <div>
                    {mine.data ? (
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">Your review</p>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm("Delete your review?")) remove.mutate(mine.data!.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <p className="mb-4 text-sm font-medium">Write a review</p>
                    )}
                    {mine.isPending ? <div className="h-24 animate-pulse rounded-md bg-paper-deep" /> : null}
                    {mine.isError ? <p className="text-sm text-danger">{errorText(mine.error)}</p> : null}
                    {!mine.isPending && !mine.isError ? (
                      <ReviewForm productId={data.id} existing={mine.data} />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function Distribution({ distribution }: { distribution: Record<1 | 2 | 3 | 4 | 5, number> }) {
  const peak = Math.max(1, ...([1, 2, 3, 4, 5] as const).map((score) => distribution[score]));
  return (
    <ol className="mt-4 space-y-1.5">
      {([5, 4, 3, 2, 1] as const).map((score) => (
        <li key={score} className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-2 text-xs text-muted">
          <span className="tabular-nums">{score}</span>
          <span className="h-1.5 rounded-full bg-paper-deep">
            <span
              className="block h-1.5 rounded-full bg-star"
              style={{ width: `${(distribution[score] / peak) * 100}%` }}
            />
          </span>
          <span className="text-right tabular-nums">{distribution[score]}</span>
        </li>
      ))}
    </ol>
  );
}
