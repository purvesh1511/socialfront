"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, ConfirmDialog, Input, Pagination, Select, Table } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import {
  SUBSCRIPTION_STATUS_OPTIONS,
  SubscriptionStatusBadge,
} from "@/features/billing/billing-badges";
import { useDebounce } from "@/hooks/use-debounce";
import { errorMessage } from "@/lib/api-error";
import { formatDate, humanize } from "@/lib/format";
import { billingService } from "@/services/billing.service";
import { toast } from "@/stores/toast.store";
import type { Subscription } from "@/types/billing";

const ENTITLED = ["trialing", "active", "past_due"];

export function SubscriptionsList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [gateway, setGateway] = useState("");
  const [cancelling, setCancelling] = useState<Subscription | null>(null);
  const debouncedSearch = useDebounce(search);

  const params = {
    page,
    search: debouncedSearch || undefined,
    status: status || undefined,
    gateway: gateway || undefined,
  };
  const subscriptions = useQuery({
    queryKey: ["admin", "subscriptions", params],
    queryFn: () => billingService.subscriptions(params),
    placeholderData: keepPreviousData,
  });

  const cancel = useMutation({
    mutationFn: ({ id, immediately }: { id: number; immediately: boolean }) =>
      billingService.cancelSubscription(id, immediately),
    onSuccess: ({ message }) => {
      toast.success(message);
      setCancelling(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const resetPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Every paid, trial and manually assigned plan."
      />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              aria-label="Search subscriptions"
              placeholder="Search customer name or email…"
              value={search}
              onChange={(event) => resetPage(setSearch)(event.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              aria-label="Filter by status"
              placeholder="All statuses"
              value={status}
              options={SUBSCRIPTION_STATUS_OPTIONS}
              onChange={(event) => resetPage(setStatus)(event.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              aria-label="Filter by gateway"
              placeholder="All gateways"
              value={gateway}
              options={[
                { value: "stripe", label: "Stripe" },
                { value: "razorpay", label: "Razorpay" },
                { value: "manual", label: "Manual" },
              ]}
              onChange={(event) => resetPage(setGateway)(event.target.value)}
            />
          </div>
        </div>
        <Table
          rows={subscriptions.data?.items}
          rowKey={(row) => row.id}
          isLoading={subscriptions.isLoading}
          error={subscriptions.error}
          onRetry={() => void subscriptions.refetch()}
          emptyTitle="No subscriptions match"
          columns={[
            {
              key: "customer",
              header: "Customer",
              cell: (row) =>
                row.user ? (
                  <Link
                    href={`${ROUTES.admin.customers}/${row.user.id}`}
                    className="text-brand-700 font-medium hover:underline"
                  >
                    {row.user.name}
                    <span className="block text-xs font-normal text-slate-500">
                      {row.user.email}
                    </span>
                  </Link>
                ) : (
                  "—"
                ),
            },
            { key: "plan", header: "Plan", cell: (row) => row.plan?.name ?? "—" },
            {
              key: "status",
              header: "Status",
              cell: (row) => <SubscriptionStatusBadge status={row.status} />,
            },
            {
              key: "billing",
              header: "Billing",
              cell: (row) =>
                `${humanize(row.gateway)}${row.interval ? ` · ${row.interval}ly` : ""}`,
            },
            {
              key: "period",
              header: "Renews / ends",
              cell: (row) =>
                row.cancel_at_period_end
                  ? `Ends ${formatDate(row.current_period_end ?? row.ends_at)}`
                  : formatDate(row.current_period_end ?? row.ends_at),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              cell: (row) =>
                ENTITLED.includes(row.status) ? (
                  <Button size="sm" variant="secondary" onClick={() => setCancelling(row)}>
                    Cancel
                  </Button>
                ) : null,
            },
          ]}
        />
        <Pagination meta={subscriptions.data?.meta} onPageChange={setPage} />
      </Card>
      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel subscription?"
        description={
          cancelling?.gateway === "manual"
            ? `${cancelling.user?.name ?? "The customer"} moves to the Free plan immediately.`
            : `${cancelling?.user?.name ?? "The customer"} keeps ${cancelling?.plan?.name ?? "the plan"} until the end of the paid period, and the payment provider stops future charges.`
        }
        confirmLabel="Cancel subscription"
        destructive
        loading={cancel.isPending}
        onConfirm={() =>
          cancelling &&
          cancel.mutate({ id: cancelling.id, immediately: cancelling.gateway === "manual" })
        }
        onCancel={() => setCancelling(null)}
      />
    </>
  );
}
