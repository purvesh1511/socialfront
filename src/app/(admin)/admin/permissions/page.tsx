import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { PermissionsList } from "@/features/admin/roles/permissions-list";

export const metadata: Metadata = { title: "Permissions" };

export default function PermissionsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.manageRoles}>
      <PermissionsList />
    </RequirePermission>
  );
}
