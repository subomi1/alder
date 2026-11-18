import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { deleteReview, listMyReviews } from "@/lib/catalog/api";
import type { OwnReview } from "@/lib/catalog/types";
import { RequireAccount } from "@/components/require-account";
import { ProductImage } from "@/components/product-image";
import { Stars } from "@/components/stars";
import { EmptyState, ErrorState } from "@/components/states";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { errorText, formatDate } from "@/lib/format";

export const Route = createFileRoute("/reviews")({
  component: MyReviewsPage,
});

function MyReviewsPage() {
  const queryClient = useQueryClient();
  const reviews = useQuery({ queryKey: ["my-reviews"], queryFn: () => listMyReviews() });
  const [pendingDelete, setPendingDelete] = useState<OwnReview | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => deleteReview({ data: { id } }),
    onSuccess: async () => {
      toast.success("Review deleted");
      setPendingDelete(null);
      await queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(errorText(err)),
  });

  return (
    <RequireAccount>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-4xl">My reviews</h1>
        <p className="mt-2 text-muted">Edit a review from the product page. Delete it here if you change your mind.</p>
        {reviews.isPending ? <div className="mt-8 h-40 animate-pulse rounded-lg bg-paper-deep" /> : null}
        {reviews.isError ? (
          <div className="mt-8">
            <ErrorState message={errorText(reviews.error)} onRetry={() => void reviews.refetch()} />
          </div>
        ) : null}
        {reviews.data && reviews.data.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No reviews yet"
              body="When you publish one, it will live here as well as on the product."
              action={
                <Link to="/products" className={buttonStyles()}>
                  Browse products
                </Link>
              }
            />
          </div>
        ) : null}
        {reviews.data && reviews.data.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {reviews.data.map((review) => (
              <li key={review.id} className="flex gap-4 rounded-lg bg-surface p-4 shadow-card">
                <div className="hidden h-24 w-24 overflow-hidden rounded-md sm:block">
                  <ProductImage src={review.imageUrl} name={review.productName} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-2xl">{review.productName}</h2>
                    {review.status === "hidden" ? (
                      <span className="rounded-full bg-paper-deep px-2 py-1 text-xs">Hidden</span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={review.score} />
                    <span className="text-sm text-muted">{formatDate(review.updatedAt)}</span>
                  </div>
                  <p className="mt-2 font-medium">{review.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted">{review.body}</p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to="/products/$slug"
                      params={{ slug: review.productSlug }}
                      hash="review"
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      Edit
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(review)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Dialog
        open={Boolean(pendingDelete)}
        title="Delete this review?"
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-sm text-muted">
          {pendingDelete ? `“${pendingDelete.title}” will be removed from ${pendingDelete.productName}.` : ""}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
          >
            {remove.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </RequireAccount>
  );
}
