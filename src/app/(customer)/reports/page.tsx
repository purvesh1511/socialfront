import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { ReportsPage } from "@/features/reports/reports-page";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.viewAnalytics}>
      <ReportsPage />
    </RequirePermission>
  );
}
