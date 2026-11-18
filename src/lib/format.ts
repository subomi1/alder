export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRating(value: number): string {
  if (!value) return "New";
  return value.toFixed(1);
}

export function errorText(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message.replace(/^Server function error:?\s*/i, "").trim();
    return message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function wasEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(updated)) return false;
  return updated - created > 60_000;
}
