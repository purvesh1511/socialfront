import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/layouts/require-permission";
import { Loading } from "@/components/ui";
import { PERMISSIONS } from "@/constants/permissions";
import { BillingPage } from "@/features/billing/billing-page";

export const metadata: Metadata = { title: "Billing" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageBilling}>
      <Suspense fallback={<Loading />}>
        <BillingPage />
      </Suspense>
    </RequirePermission>
  );
}
