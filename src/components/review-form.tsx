import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createReview, updateReview } from "@/lib/catalog/api";
import type { MyProductReview } from "@/lib/catalog/types";
import { reviewInput, reviewUpdateInput } from "@/lib/catalog/validate";
import { errorText } from "@/lib/format";
import { Button } from "./ui/button";
import { controlClass, Field } from "./ui/field";
import { StarPicker } from "./stars";

export function ReviewForm({
  productId,
  existing,
}: {
  productId: number;
  existing?: MyProductReview | null;
}) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState(existing?.score ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [formError, setFormError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (existing) {
        const data = reviewUpdateInput.parse({ id: existing.id, score, title, body });
        return updateReview({ data });
      }
      const data = reviewInput.parse({ productId, score, title, body });
      return createReview({ data });
    },
    onSuccess: async () => {
      toast.success(existing ? "Review updated" : "Review published");
      setFormError("");
      await queryClient.invalidateQueries();
    },
    onError: (err) => setFormError(errorText(err)),
  });

  return (
    <form
      id="review"
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setFormError("");
        const check = existing
          ? reviewUpdateInput.safeParse({ id: existing.id, score, title, body })
          : reviewInput.safeParse({ productId, score, title, body });
        if (!check.success) {
          setFormError(check.error.issues[0]?.message ?? "Check the form and try again.");
          return;
        }
        save.mutate();
      }}
    >
      <div>
        <p className="mb-1.5 text-sm font-medium">Your rating</p>
        <StarPicker value={score} onChange={setScore} />
      </div>
      <Field label="Title">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          className={`${controlClass} h-11`}
          placeholder="What should someone know first?"
        />
      </Field>
      <Field label="Review" hint={`${body.trim().length}/2000`}>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          rows={5}
          className={`${controlClass} min-h-32 py-3`}
          placeholder="Be specific. What held up, and what didn't?"
        />
      </Field>
      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      {existing?.status === "hidden" ? (
        <p className="text-sm text-muted">This review is hidden. Editing it does not publish it again.</p>
      ) : null}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : existing ? "Save changes" : "Publish review"}
      </Button>
    </form>
  );
}
