import type { User } from "./user";

export type TicketStatus = "open" | "pending" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketCategory = "account" | "billing" | "publishing" | "technical" | "other";

export interface TicketMessage {
  id: number;
  body: string;
  is_staff: boolean;
  author: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customer?: Pick<User, "id" | "name" | "email">;
  assignee?: { id: number; name: string } | null;
  messages_count?: number;
  messages?: TicketMessage[];
  last_reply_at: string | null;
  closed_at: string | null;
  created_at: string | null;
}
