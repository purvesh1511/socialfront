import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { InvoicesList } from "@/features/superadmin/billing-records";

export const metadata: Metadata = { title: "Invoices" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageSubscriptions}>
      <InvoicesList />
    </RequirePermission>
  );
}
