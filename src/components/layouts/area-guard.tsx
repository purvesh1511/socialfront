"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorState, PageLoader } from "@/components/ui";
import { useCurrentUser, useUnauthorizedRedirect } from "@/features/auth/hooks";
import { homeForRole, isStaffRole } from "@/lib/access";
import type { Portal } from "@/services/auth.service";

/**
 * Loads the current user and makes sure they belong to this panel. Middleware already
 * handles the common cases; this covers stale cookies and role changes.
 */
export function AreaGuard({ portal, children }: { portal: Portal; children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  useUnauthorizedRedirect(portal);

  const allowed = user
    ? portal === "admin"
      ? isStaffRole(user.role)
      : user.role === "customer"
    : false;

  useEffect(() => {
    if (user && !allowed) router.replace(homeForRole(user.role));
  }, [user, allowed, router]);

  if (isLoading || (user && !allowed)) return <PageLoader />;
  if (error || !user) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return <>{children}</>;
}
