import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getHome } from "@/lib/catalog/api";
import { buttonStyles } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { Shell } from "@/components/shell";
import { ErrorState, PageSkeleton } from "@/components/states";
import { errorText, formatRating } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const home = useQuery({ queryKey: ["home"], queryFn: () => getHome() });

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted uppercase">Review house</p>
            <h1 className="mt-3 max-w-xl font-serif text-5xl text-ink sm:text-6xl">Objects, examined.</h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Alder is where people write careful reviews of things they actually keep. Read the shelf,
              then leave a rating of your own.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className={buttonStyles({ variant: "primary" })}>
                Browse products
              </Link>
              <Link to="/register" className={buttonStyles({ variant: "secondary" })}>
                Create an account
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {home.data
              ? home.data.featured.slice(0, 4).map((product) => (
                  <Link
                    key={product.slug}
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    className="overflow-hidden rounded-lg bg-surface shadow-card"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="aspect-square w-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
                    />
                  </Link>
                ))
              : Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="aspect-square animate-pulse rounded-lg bg-paper-deep" />
                ))}
          </div>
        </section>

        {home.isPending ? <PageSkeleton /> : null}
        {home.isError ? (
          <div className="mt-12">
            <ErrorState message={errorText(home.error)} onRetry={() => void home.refetch()} />
          </div>
        ) : null}

        {home.data ? (
          <>
            <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-4">
              <Stat label="Objects" value={String(home.data.stats.products)} />
              <Stat label="Published reviews" value={String(home.data.stats.reviews)} />
              <Stat label="Categories" value={String(home.data.stats.categories)} />
              <Stat label="Members" value={String(home.data.stats.members)} />
            </dl>

            <section className="mt-16">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-serif text-3xl">Highest regarded</h2>
                <Link to="/products" className="text-sm text-muted hover:text-ink">
                  Full shelf
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {home.data.featured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            <section className="mt-16">
              <h2 className="font-serif text-3xl">Browse by room</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {home.data.categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      to="/products"
                      search={{ category: category.slug }}
                      className="block rounded-lg bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
                    >
                      <p className="font-serif text-2xl">{category.name}</p>
                      <p className="mt-2 text-sm text-muted">{category.blurb}</p>
                      <p className="mt-4 text-sm tabular-nums text-ink-soft">
                        {category.productCount} objects
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-16 grid gap-6 rounded-lg bg-ink px-6 py-10 text-paper sm:px-10 lg:grid-cols-3">
              <Step n="01" title="Discover" body="Search the shelf or filter by the room an object belongs to." />
              <Step n="02" title="Read" body="House notes and member reviews sit beside an average from one to five." />
              <Step
                n="03"
                title="Review"
                body="Sign in to rate something you own. You can edit or delete it later."
              />
            </section>
            <p className="mt-6 text-sm text-muted">
              Top of the shelf right now sits at {formatRating(home.data.featured[0]?.avgRating ?? 0)}.
            </p>
          </>
        ) : null}
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-3xl tabular-nums">{value}</dd>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="text-xs tracking-widest text-paper/60">{n}</p>
      <h3 className="mt-2 font-serif text-2xl">{title}</h3>
      <p className="mt-2 text-sm text-paper/75">{body}</p>
    </div>
  );
}
