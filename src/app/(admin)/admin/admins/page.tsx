import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { AdminsList } from "@/features/admin/admins/admins-list";

export const metadata: Metadata = { title: "Admins" };

export default function AdminsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.manageAdmins}>
      <AdminsList />
    </RequirePermission>
  );
}
