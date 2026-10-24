import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/types/support";
import { get, getPaginated, send } from "./api-client";

export type SupportScope = "customer" | "admin";

const base = (scope: SupportScope) =>
  scope === "admin" ? "/admin/support/tickets" : "/customer/support/tickets";

export const supportService = {
  list: (
    scope: SupportScope,
    params: { page?: number; status?: string; search?: string; mine?: boolean },
  ) => getPaginated<SupportTicket>(base(scope), { ...params, mine: params.mine ? 1 : undefined }),
  show: (scope: SupportScope, id: number) => get<SupportTicket>(`${base(scope)}/${id}`),
  create: (input: { subject: string; category: TicketCategory; message: string }) =>
    send<SupportTicket>("post", base("customer"), input),
  reply: (scope: SupportScope, id: number, body: string) =>
    send<SupportTicket>("post", `${base(scope)}/${id}/messages`, { body }),
  close: (id: number) => send<SupportTicket>("post", `${base("customer")}/${id}/close`),
  update: (
    id: number,
    input: { status?: TicketStatus; priority?: TicketPriority; assigned_to?: number | null },
  ) => send<SupportTicket>("patch", `${base("admin")}/${id}`, input),
};
