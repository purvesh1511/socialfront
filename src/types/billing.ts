import type { User } from "./user";

export type BillingInterval = "month" | "year";
export type SubscriptionStatus =
  "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "expired";
export type PaymentGateway = "stripe" | "razorpay" | "manual";

export type PlanFeatureKey =
  | "analytics"
  | "advanced_analytics"
  | "reports"
  | "ai_assistant"
  | "content_library"
  | "priority_support";

export type PlanLimitKey =
  | "social_accounts"
  | "posts_per_month"
  | "ai_requests_per_month"
  | "library_storage_mb"
  | "report_exports_per_month";

export interface Plan {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  /** Minor units (cents/paise). Null = not sold for that interval. */
  monthly_price: number | null;
  yearly_price: number | null;
  currency: string;
  trial_days: number;
  is_free: boolean;
  purchasable: boolean;
  features: Partial<Record<PlanFeatureKey, boolean>>;
  /** Null = unlimited. */
  limits: Partial<Record<PlanLimitKey, number | null>>;
  // Superadmin only
  is_active?: boolean;
  is_public?: boolean;
  sort_order?: number;
  gateway_prices?: Partial<Record<"stripe" | "razorpay", Partial<Record<BillingInterval, string>>>>;
}

type UserRef = Pick<User, "id" | "name" | "email">;

export interface Subscription {
  id: number;
  plan?: Pick<Plan, "id" | "slug" | "name">;
  user?: UserRef;
  gateway: PaymentGateway;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ends_at: string | null;
  past_due_since: string | null;
  notes?: string | null;
  created_at: string | null;
}

export interface UsageRow {
  key: PlanLimitKey;
  label: string;
  limit: number | null;
  used: number;
}

export interface BillingOverview {
  plan: Plan | null;
  subscription: Subscription | null;
  features: PlanFeatureKey[];
  usage: UsageRow[];
  plans: Plan[];
  gateway: { key: string; configured: boolean; supports_resume: boolean };
}

export interface Invoice {
  id: number;
  number: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  line_items: { description: string; amount: number; quantity?: number }[] | null;
  user?: UserRef;
  period_start: string | null;
  period_end: string | null;
  issued_at: string;
  paid_at: string | null;
}

export interface Payment {
  id: number;
  gateway: PaymentGateway;
  gateway_payment_id?: string | null;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "refunded";
  failure_reason: string | null;
  invoice?: { id: number; number: string } | null;
  user?: UserRef;
  paid_at: string | null;
  created_at: string | null;
}

export interface CustomerBilling {
  plan: Plan | null;
  subscription: Subscription | null;
  usage: UsageRow[];
  history: Subscription[];
  invoices: Invoice[];
  plans: Plan[];
}
