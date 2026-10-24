import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { AnalyticsPage } from "@/features/analytics/analytics-page";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.viewAnalytics}>
      <AnalyticsPage />
    </RequirePermission>
  );
}
