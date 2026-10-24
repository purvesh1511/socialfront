"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Card, Input, Pagination, Table } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { APPROVAL_ACTION_LABELS } from "@/constants/social";
import { APPROVAL_TONES } from "@/features/approvals/approval-panel";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { approvalsService } from "@/services/approvals.service";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

export function ApprovalsList() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const params = { page, status: status || undefined, search: debounced || undefined };

  const approvals = useQuery({
    queryKey: ["admin", "approvals", params],
    queryFn: () => approvalsService.list(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Review posts from customers who require approval before publishing."
      />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div role="tablist" aria-label="Status" className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  status === tab.value
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ml-auto w-64">
            <Input
              type="search"
              aria-label="Search by customer"
              placeholder="Search by customer…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <Table
          caption="Approval requests"
          rows={approvals.data?.items}
          rowKey={(row) => row.id}
          isLoading={approvals.isLoading}
          error={approvals.error}
          onRetry={() => void approvals.refetch()}
          emptyTitle={status === "pending" ? "Nothing waiting for review" : "No approval requests"}
          columns={[
            {
              key: "post",
              header: "Post",
              className: "max-w-md whitespace-normal",
              cell: (row) => (
                <Link href={`${ROUTES.admin.approvals}/${row.id}`} className="block">
                  <span className="hover:text-brand-700 line-clamp-2 text-slate-800">
                    {row.post?.content || "(media only)"}
                  </span>
                  <span className="text-xs text-slate-500">{row.requester?.email}</span>
                </Link>
              ),
            },
            {
              key: "accounts",
              header: "Accounts",
              cell: (row) => (
                <div className="flex -space-x-1">
                  {row.post?.targets.slice(0, 4).map((target) => (
                    <AccountAvatar key={target.id} account={target.account} size="sm" />
                  ))}
                </div>
              ),
            },
            {
              key: "action",
              header: "When approved",
              cell: (row) => (
                <span className="text-xs">
                  {APPROVAL_ACTION_LABELS[row.requested_action]}
                  {row.requested_scheduled_at && (
                    <span className="block text-slate-500">
                      {formatDateTime(row.requested_scheduled_at)}
                    </span>
                  )}
                </span>
              ),
            },
            {
              key: "submitted",
              header: "Submitted",
              cell: (row) => formatDateTime(row.created_at),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge tone={APPROVAL_TONES[row.status]}>{row.status}</Badge>,
            },
          ]}
        />
        <Pagination meta={approvals.data?.meta} onPageChange={setPage} />
      </Card>
    </>
  );
}
