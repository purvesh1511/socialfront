import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { PlatformAnalytics } from "@/features/superadmin/platform-analytics";

export const metadata: Metadata = { title: "Platform analytics" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.viewSystemHealth}>
      <PlatformAnalytics />
    </RequirePermission>
  );
}
