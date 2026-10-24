"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Loading,
  Pagination,
  Table,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { authKeys } from "@/features/auth/hooks";
import { errorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney } from "@/lib/format";
import { billingService } from "@/services/billing.service";
import { toast } from "@/stores/toast.store";
import type { BillingInterval, BillingOverview, Plan } from "@/types/billing";
import { PaymentStatusBadge, SubscriptionStatusBadge } from "./billing-badges";
import { PlanCards } from "./plan-cards";
import { UsageMeters } from "./usage-meters";

const billingKeys = { overview: ["billing", "overview"] as const };

export function BillingPage() {
  const searchParams = useSearchParams();
  const overview = useQuery({ queryKey: billingKeys.overview, queryFn: billingService.overview });
  const checkout = searchParams.get("checkout");

  if (overview.isLoading) return <Loading />;
  if (overview.error || !overview.data)
    return <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />;

  return (
    <>
      <PageHeader title="Billing" description="Your plan, usage and invoices." />
      {checkout === "success" && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Thanks! Your payment is being confirmed — your new plan activates within a minute.
        </p>
      )}
      {checkout === "cancelled" && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
        >
          Checkout was cancelled. You have not been charged.
        </p>
      )}
      <div className="space-y-6">
        <CurrentPlan data={overview.data} />
        <Card title="Usage this month">
          <UsageMeters usage={overview.data.usage} />
        </Card>
        <Plans data={overview.data} />
        <Invoices />
        <Payments />
      </div>
    </>
  );
}

function CurrentPlan({ data }: { data: BillingOverview }) {
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { subscription, plan } = data;
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["billing"] });
    void queryClient.invalidateQueries({ queryKey: authKeys.me });
  };
  const onError = (error: unknown) => toast.error(errorMessage(error));

  const cancel = useMutation({
    mutationFn: billingService.cancel,
    onSuccess: ({ message }) => {
      toast.success(message);
      setConfirmCancel(false);
      refresh();
    },
    onError,
  });
  const resume = useMutation({
    mutationFn: billingService.resume,
    onSuccess: ({ message }) => {
      toast.success(message);
      refresh();
    },
    onError,
  });

  const periodEnd = subscription?.current_period_end ?? subscription?.ends_at;

  return (
    <Card
      title="Current plan"
      actions={subscription ? <SubscriptionStatusBadge status={subscription.status} /> : undefined}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-slate-900">{plan?.name ?? "Free"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {!subscription
              ? "Upgrade any time to unlock more accounts, posts and features."
              : subscription.status === "trialing" && subscription.trial_ends_at
                ? `Free trial until ${formatDate(subscription.trial_ends_at)}.`
                : subscription.cancel_at_period_end
                  ? `Cancelled — access continues until ${formatDate(periodEnd)}.`
                  : subscription.gateway === "manual"
                    ? subscription.ends_at
                      ? `Assigned by our team until ${formatDate(subscription.ends_at)}.`
                      : "Assigned by our team."
                    : periodEnd
                      ? `Renews ${formatDate(periodEnd)} (${subscription.interval === "year" ? "yearly" : "monthly"}).`
                      : null}
          </p>
          {subscription?.status === "past_due" && (
            <p className="mt-2 text-sm font-medium text-amber-800">
              Your last payment failed. Please update your payment method with the payment provider
              to keep your plan.
            </p>
          )}
        </div>
        {subscription && subscription.gateway !== "manual" && (
          <div className="flex gap-2">
            {subscription.cancel_at_period_end ? (
              data.gateway.supports_resume && (
                <Button loading={resume.isPending} onClick={() => resume.mutate()}>
                  Keep my plan
                </Button>
              )
            ) : (
              <Button variant="secondary" onClick={() => setConfirmCancel(true)}>
                Cancel plan
              </Button>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel your plan?"
        description={`You keep ${plan?.name ?? "your plan"} until ${formatDate(periodEnd)}, then move to the Free plan. Posts and accounts above Free limits stay, but you can't add more.`}
        confirmLabel="Cancel plan"
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onCancel={() => setConfirmCancel(false)}
      />
    </Card>
  );
}

function Plans({ data }: { data: BillingOverview }) {
  const router = useRouter();
  const [interval, setBillingInterval] = useState<BillingInterval>(
    data.subscription?.interval ?? "month",
  );
  const [pending, setPending] = useState<string | null>(null);

  const checkout = useMutation({
    mutationFn: (plan: Plan) => billingService.checkout(plan.slug, interval),
    onMutate: (plan) => setPending(plan.slug),
    onSuccess: ({ data: session }) => {
      window.location.assign(session.url);
    },
    onError: (error) => {
      setPending(null);
      toast.error(errorMessage(error));
    },
  });

  // Reset the spinner if the user comes back with the browser's back button.
  useEffect(() => {
    const reset = () => setPending(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <Card
      title="Plans"
      description={
        data.gateway.configured
          ? "Payments are processed securely by our payment provider."
          : "Online payments are not available yet — contact support to change plans."
      }
      actions={
        <div
          role="group"
          aria-label="Billing interval"
          className="inline-flex rounded-lg bg-slate-100 p-1 text-sm"
        >
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => setBillingInterval(value)}
              className={cn(
                "rounded-md px-3 py-1 font-medium",
                interval === value
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              {value === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      }
    >
      <PlanCards
        plans={data.plans}
        interval={interval}
        currentSlug={data.plan?.slug ?? null}
        pendingSlug={pending}
        onChoose={(plan) => checkout.mutate(plan)}
        onContact={() => router.push(`${ROUTES.customer.support}?new=1&category=billing`)}
      />
    </Card>
  );
}

function Invoices() {
  const [page, setPage] = useState(1);
  const invoices = useQuery({
    queryKey: ["billing", "invoices", page],
    queryFn: () => billingService.invoices(page),
    placeholderData: keepPreviousData,
  });

  return (
    <Card title="Invoices" bodyClassName="p-0">
      <Table
        rows={invoices.data?.items}
        rowKey={(row) => row.id}
        isLoading={invoices.isLoading}
        error={invoices.error}
        onRetry={() => void invoices.refetch()}
        emptyTitle="No invoices yet"
        columns={[
          { key: "number", header: "Invoice", cell: (row) => row.number },
          { key: "date", header: "Date", cell: (row) => formatDate(row.issued_at) },
          { key: "total", header: "Amount", cell: (row) => formatMoney(row.total, row.currency) },
          {
            key: "download",
            header: "",
            className: "text-right",
            cell: (row) => (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  billingService
                    .downloadInvoice(row)
                    .catch((error: unknown) => toast.error(errorMessage(error)))
                }
              >
                Download PDF
              </Button>
            ),
          },
        ]}
      />
      <Pagination meta={invoices.data?.meta} onPageChange={setPage} />
    </Card>
  );
}

function Payments() {
  const [page, setPage] = useState(1);
  const payments = useQuery({
    queryKey: ["billing", "payments", page],
    queryFn: () => billingService.payments(page),
    placeholderData: keepPreviousData,
  });

  return (
    <Card title="Payment history" bodyClassName="p-0">
      <Table
        rows={payments.data?.items}
        rowKey={(row) => row.id}
        isLoading={payments.isLoading}
        error={payments.error}
        onRetry={() => void payments.refetch()}
        emptyTitle="No payments yet"
        columns={[
          { key: "date", header: "Date", cell: (row) => formatDate(row.paid_at ?? row.created_at) },
          { key: "amount", header: "Amount", cell: (row) => formatMoney(row.amount, row.currency) },
          {
            key: "status",
            header: "Status",
            cell: (row) => <PaymentStatusBadge status={row.status} />,
          },
          {
            key: "detail",
            header: "Details",
            cell: (row) => row.failure_reason ?? row.invoice?.number ?? "—",
          },
        ]}
      />
      <Pagination meta={payments.data?.meta} onPageChange={setPage} />
    </Card>
  );
}
