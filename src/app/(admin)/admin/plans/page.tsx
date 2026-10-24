import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { PlansManager } from "@/features/superadmin/plans-manager";

export const metadata: Metadata = { title: "Plans" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.managePlans}>
      <PlansManager />
    </RequirePermission>
  );
}
