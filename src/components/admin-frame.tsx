import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getMyProfile } from "@/lib/catalog/api";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "./cn";
import { Shell } from "./shell";
import { EmptyState, PageSkeleton } from "./states";

const TABS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/products", label: "Products", exact: false },
  { to: "/admin/users", label: "Users", exact: false },
  { to: "/admin/reviews", label: "Reviews", exact: false },
] as const;

export function AdminFrame({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const profile = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => getMyProfile(),
    enabled: Boolean(user),
  });

  let body: ReactNode;
  if (isPending || (user && profile.isPending)) body = <PageSkeleton />;
  else if (!user) body = <RedirectToSignIn />;
  else if (profile.isError) {
    body = (
      <EmptyState
        title="Couldn't confirm your role"
        body="Refresh the page. If you just signed up, your profile is still opening."
      />
    );
  } else if (profile.data?.role !== "admin") {
    body = (
      <EmptyState
        title="Admins only"
        body="This desk is for administrators. The first account on Alder is granted that role."
        action={
          <Link to="/dashboard" className="text-sm font-medium text-accent">
            Back to your dashboard
          </Link>
        }
      />
    );
  } else {
    body = (
      <>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const on = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm",
                  on ? "bg-ink text-paper" : "bg-surface text-ink-soft shadow-card",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <h1 className="mt-8 font-serif text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{lede}</p>
        <div className="mt-8">{children}</div>
      </>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{body}</div>
    </Shell>
  );
}
