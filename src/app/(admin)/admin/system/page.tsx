import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { SystemHealth } from "@/features/superadmin/system-health";

export const metadata: Metadata = { title: "System health" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.viewSystemHealth}>
      <SystemHealth />
    </RequirePermission>
  );
}
