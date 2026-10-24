import { downloadFile } from "@/lib/download";
import type {
  BillingInterval,
  BillingOverview,
  CustomerBilling,
  Invoice,
  Payment,
  Plan,
  Subscription,
} from "@/types/billing";
import { get, getPaginated, send } from "./api-client";

export interface BillingListParams {
  page?: number;
  search?: string;
  status?: string;
  gateway?: string;
  plan_id?: number;
}

export type PlanInput = Omit<
  Plan,
  "id" | "currency" | "is_free" | "purchasable" | "is_active" | "is_public" | "sort_order"
> & {
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
};

export const billingService = {
  // Customer
  overview: () => get<BillingOverview>("/customer/billing"),
  checkout: (plan: string, interval: BillingInterval) =>
    send<{ url: string }>("post", "/customer/billing/checkout", { plan, interval }),
  cancel: () => send<Subscription>("post", "/customer/billing/cancel"),
  resume: () => send<Subscription>("post", "/customer/billing/resume"),
  invoices: (page = 1) => getPaginated<Invoice>("/customer/billing/invoices", { page }),
  payments: (page = 1) => getPaginated<Payment>("/customer/billing/payments", { page }),
  downloadInvoice: (invoice: Invoice) =>
    downloadFile(`/customer/billing/invoices/${invoice.id}/download`, `${invoice.number}.pdf`),

  // Staff
  subscriptions: (params: BillingListParams) =>
    getPaginated<Subscription>("/admin/subscriptions", params),
  cancelSubscription: (id: number, immediately: boolean) =>
    send<Subscription>("post", `/admin/subscriptions/${id}/cancel`, { immediately }),
  customerBilling: (customerId: number) =>
    get<CustomerBilling>(`/admin/customers/${customerId}/billing`),
  assignPlan: (
    customerId: number,
    input: { plan_id: number; ends_at?: string | null; notes?: string | null },
  ) => send<Subscription>("post", `/admin/customers/${customerId}/subscription`, input),

  // Superadmin
  plans: () => get<Plan[]>("/superadmin/plans"),
  createPlan: (input: PlanInput) => send<Plan>("post", "/superadmin/plans", input),
  updatePlan: (id: number, input: PlanInput) => send<Plan>("put", `/superadmin/plans/${id}`, input),
  allPayments: (params: BillingListParams) => getPaginated<Payment>("/superadmin/payments", params),
  allInvoices: (params: BillingListParams) => getPaginated<Invoice>("/superadmin/invoices", params),
  downloadAnyInvoice: (invoice: Invoice) =>
    downloadFile(`/superadmin/invoices/${invoice.id}/download`, `${invoice.number}.pdf`),
};
