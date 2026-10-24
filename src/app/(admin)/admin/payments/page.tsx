import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { PaymentsList } from "@/features/superadmin/billing-records";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageSubscriptions}>
      <PaymentsList />
    </RequirePermission>
  );
}
