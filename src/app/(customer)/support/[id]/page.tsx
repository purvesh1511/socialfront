import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketDetail } from "@/features/support/ticket-detail";

export const metadata: Metadata = { title: "Support ticket" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  return <TicketDetail scope="customer" id={ticketId} />;
}
