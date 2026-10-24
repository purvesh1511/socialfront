import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/layouts/require-permission";
import { Loading } from "@/components/ui";
import { PERMISSIONS } from "@/constants/permissions";
import { SystemSettingsForm } from "@/features/admin/settings/system-settings-form";

export const metadata: Metadata = { title: "System settings" };

export default function SystemSettingsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.manageSettings}>
      <Suspense fallback={<Loading />}>
        <SystemSettingsForm />
      </Suspense>
    </RequirePermission>
  );
}
