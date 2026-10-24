"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui";
import { usePermission } from "@/features/auth/hooks";
import type { PermissionName } from "@/constants/permissions";

/** Hides a page when the user lacks a permission. The API enforces the same rule. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: PermissionName;
  children: ReactNode;
}) {
  const allowed = usePermission(permission);

  if (!allowed) {
    return (
      <EmptyState
        title="Access denied"
        description="You don't have permission to view this page."
      />
    );
  }

  return <>{children}</>;
}
