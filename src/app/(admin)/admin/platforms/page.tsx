import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { PlatformsManager } from "@/features/superadmin/platforms-manager";

export const metadata: Metadata = { title: "Social platforms" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageSettings}>
      <PlatformsManager />
    </RequirePermission>
  );
}
