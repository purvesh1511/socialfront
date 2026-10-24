import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { TicketDetail } from "@/features/support/ticket-detail";

export const metadata: Metadata = { title: "Support ticket" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  return (
    <RequirePermission permission={PERMISSIONS.manageSupport}>
      <TicketDetail scope="admin" id={ticketId} />
    </RequirePermission>
  );
}
