"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Card, Input, Pagination, Select, StatusBadge, Table } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { formatDate, formatDateTime } from "@/lib/format";
import { customersService } from "@/services/customers.service";
import { STATUS_OPTIONS } from "../status-options";
import { useListState } from "../use-list-state";

export function CustomersList() {
  const state = useListState();
  const customers = useQuery({
    queryKey: ["admin", "customers", state.params],
    queryFn: () => customersService.list(state.params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Customers" description="Search, review and manage customer accounts." />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              aria-label="Search customers"
              placeholder="Search by name or email…"
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              aria-label="Filter by status"
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              value={state.status}
              onChange={(event) => state.setStatus(event.target.value)}
            />
          </div>
        </div>
        <Table
          caption="Customers"
          rows={customers.data?.items}
          rowKey={(row) => row.id}
          isLoading={customers.isLoading}
          error={customers.error}
          onRetry={() => void customers.refetch()}
          emptyTitle="No customers found"
          emptyDescription={
            state.search || state.status ? "Try adjusting your filters." : undefined
          }
          columns={[
            {
              key: "name",
              header: "Customer",
              cell: (row) => (
                <Link href={`${ROUTES.admin.customers}/${row.id}`} className="block">
                  <span className="text-brand-700 font-medium hover:underline">{row.name}</span>
                  <span className="block text-xs text-slate-500">{row.email}</span>
                </Link>
              ),
            },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
            {
              key: "verified",
              header: "Email",
              cell: (row) =>
                row.email_verified_at ? (
                  <Badge tone="success">Verified</Badge>
                ) : (
                  <Badge tone="warning">Unverified</Badge>
                ),
            },
            {
              key: "last_login",
              header: "Last login",
              cell: (row) => formatDateTime(row.last_login_at),
            },
            { key: "joined", header: "Joined", cell: (row) => formatDate(row.created_at) },
          ]}
        />
        <Pagination meta={customers.data?.meta} onPageChange={state.setPage} />
      </Card>
    </>
  );
}
