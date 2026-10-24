import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { SubscriptionsList } from "@/features/admin/billing/subscriptions-list";

export const metadata: Metadata = { title: "Subscriptions" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageSubscriptions}>
      <SubscriptionsList />
    </RequirePermission>
  );
}
