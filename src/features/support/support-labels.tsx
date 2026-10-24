import { Badge } from "@/components/ui";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/types/support";

export const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "publishing", label: "Publishing" },
  { value: "technical", label: "Technical issue" },
  { value: "other", label: "Something else" },
];

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Waiting on customer" },
  { value: "closed", label: "Closed" },
];

export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TicketStatusBadge({
  status,
  staff = false,
}: {
  status: TicketStatus;
  staff?: boolean;
}) {
  if (status === "open") return <Badge tone="brand">{staff ? "Open" : "Awaiting reply"}</Badge>;
  if (status === "pending")
    return <Badge tone="warning">{staff ? "Waiting on customer" : "Replied"}</Badge>;
  return <Badge>Closed</Badge>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const tone = priority === "urgent" ? "danger" : priority === "high" ? "warning" : "neutral";
  return <Badge tone={tone}>{priority}</Badge>;
}
