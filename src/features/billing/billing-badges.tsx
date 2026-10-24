import { Badge } from "@/components/ui";
import type { Payment, SubscriptionStatus } from "@/types/billing";

const SUBSCRIPTION_TONES: Record<SubscriptionStatus, Parameters<typeof Badge>[0]["tone"]> = {
  incomplete: "neutral",
  trialing: "brand",
  active: "success",
  past_due: "warning",
  canceled: "neutral",
  expired: "danger",
};

const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  incomplete: "Awaiting payment",
  trialing: "Trial",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Cancelled",
  expired: "Expired",
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge tone={SUBSCRIPTION_TONES[status]}>{SUBSCRIPTION_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: Payment["status"] }) {
  const tone = status === "succeeded" ? "success" : status === "failed" ? "danger" : "neutral";
  return <Badge tone={tone}>{status === "succeeded" ? "Paid" : status}</Badge>;
}

export const SUBSCRIPTION_STATUS_OPTIONS = (
  Object.keys(SUBSCRIPTION_LABELS) as SubscriptionStatus[]
).map((value) => ({ value, label: SUBSCRIPTION_LABELS[value] }));
