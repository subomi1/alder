import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listCategories, listProducts } from "@/lib/catalog/api";
import { SORTS, type SortId } from "@/lib/catalog/types";
import { ProductCard } from "@/components/product-card";
import { Shell } from "@/components/shell";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/states";
import { controlClass } from "@/components/ui/field";
import { cn } from "@/components/cn";
import { errorText } from "@/lib/format";

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => {
    const raw = typeof search.category === "string" ? search.category.slice(0, 40) : "";
    if (raw && /^[a-z0-9-]+$/.test(raw)) return { category: raw };
    return {};
  },
  component: ProductsPage,
});

function ProductsPage() {
  const category = Route.useSearch().category ?? "";
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortId>("rating");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(q), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  const categories = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const products = useQuery({
    queryKey: ["products", debounced, category, sort],
    queryFn: () => listProducts({ data: { q: debounced, category, sort } }),
  });

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">The shelf</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Products</h1>
        <p className="mt-3 max-w-xl text-muted">
          Search by name or brand, or stay inside one category. Prices are typical shelf prices, not a checkout.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search objects"
            aria-label="Search products"
            className={`${controlClass} h-11 sm:max-w-sm`}
          />
          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            className={`${controlClass} h-11 sm:w-56`}
          >
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            active={category === ""}
            onClick={() => void navigate({ search: {} })}
            label="All"
          />
          {categories.data?.map((item) => (
            <FilterChip
              key={item.slug}
              active={category === item.slug}
              onClick={() => void navigate({ search: { category: item.slug } })}
              label={item.name}
            />
          ))}
        </div>

        <div className="mt-8">
          {products.isPending ? <PageSkeleton /> : null}
          {products.isError ? (
            <ErrorState message={errorText(products.error)} onRetry={() => void products.refetch()} />
          ) : null}
          {products.data && products.data.length === 0 ? (
            <EmptyState
              title="Nothing matches"
              body="Try another word, or clear the category. The shelf itself is still here."
            />
          ) : null}
          {products.data && products.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm",
        active ? "bg-ink text-paper" : "bg-surface text-ink-soft shadow-card",
      )}
    >
      {label}
    </button>
  );
}
