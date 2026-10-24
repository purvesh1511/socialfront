"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, Input, Pagination, Select, Table } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { PaymentStatusBadge } from "@/features/billing/billing-badges";
import { useDebounce } from "@/hooks/use-debounce";
import { errorMessage } from "@/lib/api-error";
import { formatDate, formatDateTime, formatMoney, humanize } from "@/lib/format";
import { billingService } from "@/services/billing.service";
import { toast } from "@/stores/toast.store";

function useFilters() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [gateway, setGateway] = useState("");
  const debouncedSearch = useDebounce(search);
  const reset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  return {
    page,
    setPage,
    search,
    setSearch: reset(setSearch),
    status,
    setStatus: reset(setStatus),
    gateway,
    setGateway: reset(setGateway),
    params: {
      page,
      search: debouncedSearch || undefined,
      status: status || undefined,
      gateway: gateway || undefined,
    },
  };
}

const customerCell = (user?: { id: number; name: string; email: string }) =>
  user ? (
    <Link
      href={`${ROUTES.admin.customers}/${user.id}`}
      className="text-brand-700 font-medium hover:underline"
    >
      {user.name}
      <span className="block text-xs font-normal text-slate-500">{user.email}</span>
    </Link>
  ) : (
    "—"
  );

export function PaymentsList() {
  const filters = useFilters();
  const payments = useQuery({
    queryKey: ["superadmin", "payments", filters.params],
    queryFn: () => billingService.allPayments(filters.params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Payments"
        description="Successful and failed charges from every gateway."
      />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              aria-label="Search payments"
              placeholder="Customer email or payment ID…"
              value={filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              aria-label="Status"
              placeholder="All statuses"
              value={filters.status}
              options={[
                { value: "succeeded", label: "Paid" },
                { value: "failed", label: "Failed" },
                { value: "refunded", label: "Refunded" },
              ]}
              onChange={(e) => filters.setStatus(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              aria-label="Gateway"
              placeholder="All gateways"
              value={filters.gateway}
              options={[
                { value: "stripe", label: "Stripe" },
                { value: "razorpay", label: "Razorpay" },
              ]}
              onChange={(e) => filters.setGateway(e.target.value)}
            />
          </div>
        </div>
        <Table
          rows={payments.data?.items}
          rowKey={(row) => row.id}
          isLoading={payments.isLoading}
          error={payments.error}
          onRetry={() => void payments.refetch()}
          emptyTitle="No payments match"
          columns={[
            {
              key: "date",
              header: "Date",
              cell: (row) => formatDateTime(row.paid_at ?? row.created_at),
            },
            { key: "customer", header: "Customer", cell: (row) => customerCell(row.user) },
            {
              key: "amount",
              header: "Amount",
              className: "text-right tabular-nums",
              cell: (row) => formatMoney(row.amount, row.currency),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <PaymentStatusBadge status={row.status} />,
            },
            { key: "gateway", header: "Gateway", cell: (row) => humanize(row.gateway) },
            {
              key: "ref",
              header: "Reference",
              className: "whitespace-normal",
              cell: (row) => (
                <span className="text-xs">
                  <span className="font-mono">{row.gateway_payment_id ?? "—"}</span>
                  {row.failure_reason && (
                    <span className="block text-red-700">{row.failure_reason}</span>
                  )}
                </span>
              ),
            },
          ]}
        />
        <Pagination meta={payments.data?.meta} onPageChange={filters.setPage} />
      </Card>
    </>
  );
}

export function InvoicesList() {
  const filters = useFilters();
  const params = { page: filters.params.page, search: filters.params.search };
  const invoices = useQuery({
    queryKey: ["superadmin", "invoices", params],
    queryFn: () => billingService.allInvoices(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Issued automatically for each successful payment."
      />
      <Card bodyClassName="p-0">
        <div className="border-b border-slate-100 p-4">
          <div className="max-w-md">
            <Input
              type="search"
              aria-label="Search invoices"
              placeholder="Invoice number or customer email…"
              value={filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
            />
          </div>
        </div>
        <Table
          rows={invoices.data?.items}
          rowKey={(row) => row.id}
          isLoading={invoices.isLoading}
          error={invoices.error}
          onRetry={() => void invoices.refetch()}
          emptyTitle="No invoices match"
          columns={[
            {
              key: "number",
              header: "Invoice",
              cell: (row) => <span className="font-medium">{row.number}</span>,
            },
            { key: "date", header: "Issued", cell: (row) => formatDate(row.issued_at) },
            { key: "customer", header: "Customer", cell: (row) => customerCell(row.user) },
            {
              key: "total",
              header: "Total",
              className: "text-right tabular-nums",
              cell: (row) => formatMoney(row.total, row.currency),
            },
            {
              key: "download",
              header: "",
              className: "text-right",
              cell: (row) => (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    billingService
                      .downloadAnyInvoice(row)
                      .catch((error: unknown) => toast.error(errorMessage(error)))
                  }
                >
                  PDF
                </Button>
              ),
            },
          ]}
        />
        <Pagination meta={invoices.data?.meta} onPageChange={filters.setPage} />
      </Card>
    </>
  );
}
