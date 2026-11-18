import { createFileRoute } from "@tanstack/react-router";
import { queryProduct } from "@/lib/catalog/api";
import { ApiError } from "@/lib/catalog/errors";

export const Route = createFileRoute("/api/catalog/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const data = await queryProduct(params.slug);
          return Response.json({ data });
        } catch (err) {
          const status = err instanceof ApiError ? err.status : 500;
          const message = err instanceof ApiError ? err.message : "Something went wrong.";
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
