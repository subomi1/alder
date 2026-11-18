import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminDeleteProduct, adminListProducts, adminSaveProduct, listCategories } from "@/lib/catalog/api";
import { PRODUCT_IMAGES, type AdminProduct } from "@/lib/catalog/types";
import { centsToDollars, dollarsToCents, productInput } from "@/lib/catalog/validate";
import { errorText, money } from "@/lib/format";
import { AdminFrame } from "@/components/admin-frame";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { controlClass, Field } from "@/components/ui/field";
import { ErrorState } from "@/components/states";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPage,
});

type Draft = {
  id?: number;
  name: string;
  brand: string;
  categorySlug: string;
  summary: string;
  description: string;
  price: string;
  imageUrl: string;
};

const EMPTY: Draft = {
  name: "",
  brand: "",
  categorySlug: "desk",
  summary: "",
  description: "",
  price: "",
  imageUrl: PRODUCT_IMAGES[0].src,
};

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts() });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<AdminProduct | null>(null);

  const save = useMutation({
    mutationFn: async (value: Draft) => {
      const cents = dollarsToCents(value.price);
      if (cents === null) throw new Error("Enter a price like 24.00, up to 5000.");
      const data = productInput.parse({
        id: value.id,
        name: value.name,
        brand: value.brand,
        categorySlug: value.categorySlug,
        summary: value.summary,
        description: value.description,
        priceCents: cents,
        imageUrl: value.imageUrl,
      });
      return adminSaveProduct({ data });
    },
    onSuccess: async () => {
      toast.success("Product saved");
      setDraft(null);
      await queryClient.invalidateQueries();
    },
    onError: (err) => setError(errorText(err)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteProduct({ data: { id } }),
    onSuccess: async () => {
      toast.success("Product deleted");
      setRemoving(null);
      await queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(errorText(err)),
  });

  return (
    <AdminFrame title="Products" lede="Add an object, correct its copy, or take it off the shelf. Deleting a product removes its reviews.">
      <Button
        onClick={() => {
          setError("");
          setDraft({ ...EMPTY, categorySlug: categories.data?.[0]?.slug ?? "desk" });
        }}
      >
        Add product
      </Button>
      {products.isPending ? <div className="mt-6 h-40 animate-pulse rounded-lg bg-paper-deep" /> : null}
      {products.isError ? (
        <div className="mt-6">
          <ErrorState message={errorText(products.error)} onRetry={() => void products.refetch()} />
        </div>
      ) : null}
      {products.data ? (
        <div className="mt-6 overflow-x-auto rounded-lg bg-surface shadow-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Reviews</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((product) => (
                <tr key={product.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted">{product.brand}</p>
                  </td>
                  <td className="px-4 py-3">{product.categoryName}</td>
                  <td className="px-4 py-3 tabular-nums">{money(product.priceCents)}</td>
                  <td className="px-4 py-3 tabular-nums">{product.reviewCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="min-h-11 px-2 text-sm hover:underline"
                      onClick={() => {
                        setError("");
                        setDraft({
                          id: product.id,
                          name: product.name,
                          brand: product.brand,
                          categorySlug: product.categorySlug,
                          summary: product.summary,
                          description: product.description,
                          price: centsToDollars(product.priceCents),
                          imageUrl: product.imageUrl,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="min-h-11 px-2 text-sm text-danger hover:underline"
                      onClick={() => setRemoving(product)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Dialog open={Boolean(draft)} title={draft?.id ? "Edit product" : "Add product"} onClose={() => setDraft(null)}>
        {draft ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              save.mutate(draft);
            }}
          >
            <Field label="Name">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={`${controlClass} h-11`}
              />
            </Field>
            <Field label="Brand">
              <input
                value={draft.brand}
                onChange={(event) => setDraft({ ...draft, brand: event.target.value })}
                className={`${controlClass} h-11`}
              />
            </Field>
            <Field label="Category">
              <select
                value={draft.categorySlug}
                onChange={(event) => setDraft({ ...draft, categorySlug: event.target.value })}
                className={`${controlClass} h-11`}
              >
                {categories.data?.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price (USD)">
              <input
                inputMode="decimal"
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                className={`${controlClass} h-11`}
                placeholder="24.00"
              />
            </Field>
            <Field label="Summary">
              <input
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                className={`${controlClass} h-11`}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className={`${controlClass} min-h-28 py-3`}
              />
            </Field>
            <Field label="Image">
              <select
                value={draft.imageUrl}
                onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
                className={`${controlClass} h-11`}
              >
                {PRODUCT_IMAGES.map((image) => (
                  <option key={image.src} value={image.src}>
                    {image.label}
                  </option>
                ))}
              </select>
            </Field>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(removing)} title="Delete product?" onClose={() => setRemoving(null)}>
        <p className="text-sm text-muted">
          {removing ? `${removing.name} and every review attached to it will be removed.` : ""}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={remove.isPending} onClick={() => removing && remove.mutate(removing.id)}>
            Delete
          </Button>
        </div>
      </Dialog>
    </AdminFrame>
  );
}
