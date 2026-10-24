import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { CustomerDetail } from "@/features/admin/customers/customer-detail";

export const metadata: Metadata = { title: "Customer details" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isInteger(customerId) || customerId <= 0) notFound();

  return (
    <RequirePermission permission={PERMISSIONS.manageCustomers}>
      <CustomerDetail id={customerId} />
    </RequirePermission>
  );
}
