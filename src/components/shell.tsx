import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getMyProfile } from "@/lib/catalog/api";
import { SignedIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "./cn";

const NAV = [
  { to: "/products", label: "Products" },
  { to: "/project", label: "Project" },
] as const;

function active(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const profile = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => getMyProfile(),
    enabled: Boolean(user),
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = (
    <>
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "inline-flex min-h-11 items-center px-1 text-sm",
            active(pathname, item.to) ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          {item.label}
        </Link>
      ))}
      <SignedIn>
        <Link
          to="/dashboard"
          className={cn(
            "inline-flex min-h-11 items-center px-1 text-sm",
            active(pathname, "/dashboard") ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          Dashboard
        </Link>
        <Link
          to="/reviews"
          className={cn(
            "inline-flex min-h-11 items-center px-1 text-sm",
            active(pathname, "/reviews") ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          My reviews
        </Link>
        <Link
          to="/profile"
          className={cn(
            "inline-flex min-h-11 items-center px-1 text-sm",
            active(pathname, "/profile") ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          Profile
        </Link>
        {profile.data?.role === "admin" ? (
          <Link
            to="/admin"
            className={cn(
              "inline-flex min-h-11 items-center px-1 text-sm",
              active(pathname, "/admin") ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            Admin
          </Link>
        ) : null}
      </SignedIn>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link to="/" className="font-serif text-2xl tracking-tight text-ink">
            Alder
          </Link>
          <nav className="hidden items-center gap-4 md:flex">{links}</nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <AuthSlot pending={isPending} signedIn={Boolean(user)} />
            </div>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-md hover:bg-paper-deep md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-line px-4 py-3 md:hidden">
            <nav className="flex flex-col">{links}</nav>
            <div className="mt-3 border-t border-line pt-3">
              <AuthSlot pending={isPending} signedIn={Boolean(user)} />
            </div>
          </div>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-serif text-lg text-ink">Alder</p>
          <p>A review house for objects worth keeping.</p>
          <Link to="/project" className="min-h-11 inline-flex items-center hover:text-ink">
            Project review
          </Link>
        </div>
      </footer>
    </div>
  );
}

function AuthSlot({ pending, signedIn }: { pending: boolean; signedIn: boolean }) {
  if (pending) return <div className="h-8 w-24 animate-pulse rounded-full bg-paper-deep" />;
  if (signedIn) return <UserButton />;
  return (
    <Link
      to="/login"
      className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 text-sm font-medium text-paper"
    >
      Sign in
    </Link>
  );
}
