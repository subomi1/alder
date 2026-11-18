import { createFileRoute } from "@tanstack/react-router";
import { queryProducts } from "@/lib/catalog/api";
import { ApiError } from "@/lib/catalog/errors";
import { normalizeList } from "@/lib/catalog/validate";

function jsonError(err: unknown) {
  const status = err instanceof ApiError ? err.status : 500;
  const message = err instanceof ApiError ? err.message : "Something went wrong.";
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/catalog/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        try {
          const input = normalizeList({
            q: url.searchParams.get("q") ?? "",
            category: url.searchParams.get("category") ?? "",
            sort: url.searchParams.get("sort") ?? undefined,
          });
          const data = await queryProducts(input);
          return Response.json({ data });
        } catch (err) {
          return jsonError(err);
        }
      },
    },
  },
});
