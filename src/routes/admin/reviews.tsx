import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminDeleteReview, adminListReviews, adminSetReviewStatus } from "@/lib/catalog/api";
import { AdminFrame } from "@/components/admin-frame";
import { Stars } from "@/components/stars";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { errorText, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const reviews = useQuery({ queryKey: ["admin-reviews"], queryFn: () => adminListReviews() });
  const refresh = async () => {
    await queryClient.invalidateQueries();
  };
  const status = useMutation({
    mutationFn: adminSetReviewStatus,
    onSuccess: async () => {
      toast.success("Review updated");
      await refresh();
    },
    onError: (err) => toast.error(errorText(err)),
  });
  const remove = useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: async () => {
      toast.success("Review removed");
      await refresh();
    },
    onError: (err) => toast.error(errorText(err)),
  });

  return (
    <AdminFrame
      title="Review moderation"
      lede="Hide a review to drop it from public ratings. The author can still see it, and editing does not publish it again."
    >
      {reviews.isPending ? <div className="h-40 animate-pulse rounded-lg bg-paper-deep" /> : null}
      {reviews.isError ? <ErrorState message={errorText(reviews.error)} onRetry={() => void reviews.refetch()} /> : null}
      {reviews.data ? (
        <ul className="space-y-3">
          {reviews.data.map((review) => (
            <li key={review.id} className="rounded-lg bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link to="/products/$slug" params={{ slug: review.productSlug }} className="text-sm text-muted hover:text-ink">
                    {review.productName}
                  </Link>
                  <h2 className="font-serif text-2xl">{review.title}</h2>
                </div>
                <Stars value={review.score} />
              </div>
              <p className="mt-3 text-sm break-words whitespace-pre-wrap text-ink-soft">{review.body}</p>
              <p className="mt-3 text-sm text-muted">
                {review.authorName} · {review.origin === "house" ? "House note" : "Member"} · {review.status} ·{" "}
                {formatDate(review.createdAt)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {review.status === "published" ? (
                  <Button
                    variant="secondary"
                    onClick={() => status.mutate({ data: { id: review.id, status: "hidden" } })}
                  >
                    Hide
                  </Button>
                ) : (
                  <Button onClick={() => status.mutate({ data: { id: review.id, status: "published" } })}>
                    Publish
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm("Remove this review permanently?")) {
                      remove.mutate({ data: { id: review.id } });
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminFrame>
  );
}
