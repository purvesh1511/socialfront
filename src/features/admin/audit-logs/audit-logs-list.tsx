"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, Input, Modal, Pagination, Select, Table } from "@/components/ui";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDateTime, humanize } from "@/lib/format";
import { auditLogsService } from "@/services/audit-logs.service";
import type { AuditLog } from "@/types/user";

export function AuditLogsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const debouncedSearch = useDebounce(search);

  const filters = {
    page,
    search: debouncedSearch || undefined,
    event: event || undefined,
    from: from || undefined,
    to: to || undefined,
  };
  const events = useQuery({
    queryKey: ["admin", "audit-events"],
    queryFn: auditLogsService.events,
    staleTime: Infinity,
  });
  const logs = useQuery({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: () => auditLogsService.list(filters),
    placeholderData: keepPreviousData,
  });

  const withReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Audit logs" description="Security-relevant actions across the platform." />
      <Card bodyClassName="p-0">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="search"
            aria-label="Search by user"
            placeholder="Search by user…"
            value={search}
            onChange={(e) => withReset(setSearch)(e.target.value)}
          />
          <Select
            aria-label="Filter by event"
            placeholder="All events"
            options={(events.data ?? []).map((value) => ({ value, label: humanize(value) }))}
            value={event}
            onChange={(e) => withReset(setEvent)(e.target.value)}
          />
          <Input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => withReset(setFrom)(e.target.value)}
          />
          <Input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => withReset(setTo)(e.target.value)}
          />
        </div>
        <Table
          caption="Audit logs"
          rows={logs.data?.items}
          rowKey={(row) => row.id}
          isLoading={logs.isLoading}
          error={logs.error}
          onRetry={() => void logs.refetch()}
          emptyTitle="No audit entries match your filters"
          columns={[
            { key: "time", header: "Time", cell: (row) => formatDateTime(row.created_at) },
            {
              key: "event",
              header: "Event",
              cell: (row) => (
                <button
                  type="button"
                  className="text-brand-700 font-medium hover:underline"
                  onClick={() => setSelected(row)}
                >
                  {humanize(row.event)}
                </button>
              ),
            },
            { key: "user", header: "User", cell: (row) => row.user?.email ?? "—" },
            {
              key: "subject",
              header: "Subject",
              cell: (row) =>
                row.auditable_type ? `${row.auditable_type} #${row.auditable_id}` : "—",
            },
            { key: "ip", header: "IP", cell: (row) => row.ip_address ?? "—" },
          ]}
        />
        <Pagination meta={logs.data?.meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? humanize(selected.event) : ""}
      >
        {selected && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">User agent</dt>
              <dd className="break-all">{selected.user_agent ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Previous values</dt>
              <dd>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs">
                  {JSON.stringify(selected.old_values, null, 2)}
                </pre>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">New values</dt>
              <dd>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs">
                  {JSON.stringify(selected.new_values, null, 2)}
                </pre>
              </dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
}
