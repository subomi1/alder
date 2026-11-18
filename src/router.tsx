import { createRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 text-ink">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium tracking-widest text-muted uppercase">Alder</p>
        <h1 className="mt-3 font-serif text-4xl">That page is not on the shelf.</h1>
        <p className="mt-3 text-muted">The link may be out of date, or the object was removed.</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
  });
}
