import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { SystemLogs } from "@/features/superadmin/system-logs";

export const metadata: Metadata = { title: "System logs" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.viewSystemHealth}>
      <SystemLogs />
    </RequirePermission>
  );
}
