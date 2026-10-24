import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { CustomersList } from "@/features/admin/customers/customers-list";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <RequirePermission permission={PERMISSIONS.manageCustomers}>
      <CustomersList />
    </RequirePermission>
  );
}
