import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Shell } from "./shell";
import { PageSkeleton } from "./states";

export function RequireAccount({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <Shell>
        <PageSkeleton />
      </Shell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <Shell>{children}</Shell>;
}
