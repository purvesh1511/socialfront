import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { RolesMatrix } from "@/features/admin/roles/roles-matrix";

export const metadata: Metadata = { title: "Roles" };

export default function RolesPage() {
  return (
    <RequirePermission permission={PERMISSIONS.manageRoles}>
      <RolesMatrix />
    </RequirePermission>
  );
}
