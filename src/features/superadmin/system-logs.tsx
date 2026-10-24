"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Card, Input, Pagination, Select, Table } from "@/components/ui";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { systemService } from "@/services/system.service";
import type { SystemLogEntry } from "@/types/system";

const LEVELS = ["warning", "error", "critical", "alert", "emergency"].map((value) => ({
  value,
  label: value,
}));
const CHANNELS = ["billing", "oauth", "publishing", "ai", "analytics"].map((value) => ({
  value,
  label: value,
}));

export function SystemLogs() {
  const [tab, setTab] = useState<"logs" | "api">("logs");

  return (
    <>
      <PageHeader
        title="System logs"
        description="Warnings and errors from the application, plus failed and slow API requests."
      />
      <div
        role="tablist"
        aria-label="Log type"
        className="mb-4 flex gap-1 border-b border-slate-200"
      >
        {(
          [
            ["logs", "Application logs"],
            ["api", "API requests"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "logs" ? <ApplicationLogs /> : <ApiLogs />}
    </>
  );
}

function ApplicationLogs() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [expanded, setExpanded] = useState<number | null>(null);
  const params = {
    page,
    level: level || undefined,
    channel: channel || undefined,
    search: debouncedSearch || undefined,
  };
  const logs = useQuery({
    queryKey: ["superadmin", "logs", params],
    queryFn: () => systemService.logs(params),
    placeholderData: keepPreviousData,
  });

  return (
    <Card bodyClassName="p-0">
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            aria-label="Search messages"
            placeholder="Search messages…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            aria-label="Level"
            placeholder="All levels"
            value={level}
            options={LEVELS}
            onChange={(event) => {
              setLevel(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            aria-label="Category"
            placeholder="All categories"
            value={channel}
            options={CHANNELS}
            onChange={(event) => {
              setChannel(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <Table
        rows={logs.data?.items}
        rowKey={(row) => row.id}
        isLoading={logs.isLoading}
        error={logs.error}
        onRetry={() => void logs.refetch()}
        emptyTitle="No log entries"
        columns={[
          { key: "time", header: "Time", cell: (row) => formatDateTime(row.created_at) },
          { key: "level", header: "Level", cell: (row) => <LevelBadge level={row.level} /> },
          { key: "channel", header: "Category", cell: (row) => row.channel },
          {
            key: "message",
            header: "Message",
            className: "max-w-xl whitespace-normal",
            cell: (row) => (
              <LogMessage
                entry={row}
                expanded={expanded === row.id}
                onToggle={() => setExpanded(expanded === row.id ? null : row.id)}
              />
            ),
          },
        ]}
      />
      <Pagination meta={logs.data?.meta} onPageChange={setPage} />
    </Card>
  );
}

function LogMessage({
  entry,
  expanded,
  onToggle,
}: {
  entry: SystemLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <p className="text-slate-800">{entry.message}</p>
      {(entry.context || entry.request_id) && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="text-brand-600 mt-1 text-xs font-medium"
        >
          {expanded ? "Hide details" : "Details"}
        </button>
      )}
      {expanded && (
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify({ request_id: entry.request_id, ...entry.context }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  return <Badge tone={level === "warning" ? "warning" : "danger"}>{level}</Badge>;
}

function ApiLogs() {
  const [page, setPage] = useState(1);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const logs = useQuery({
    queryKey: ["superadmin", "api-logs", page, errorsOnly],
    queryFn: () => systemService.apiLogs({ page, errors_only: errorsOnly }),
    placeholderData: keepPreviousData,
  });

  return (
    <Card bodyClassName="p-0">
      <div className="border-b border-slate-100 p-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="accent-brand-600 size-4"
            checked={errorsOnly}
            onChange={(event) => {
              setErrorsOnly(event.target.checked);
              setPage(1);
            }}
          />
          Server errors only (5xx)
        </label>
      </div>
      <Table
        rows={logs.data?.items}
        rowKey={(row) => row.id}
        isLoading={logs.isLoading}
        error={logs.error}
        onRetry={() => void logs.refetch()}
        emptyTitle="No failed or slow requests recorded"
        columns={[
          { key: "time", header: "Time", cell: (row) => formatDateTime(row.created_at) },
          {
            key: "request",
            header: "Request",
            cell: (row) => (
              <span className="font-mono text-xs">
                {row.method} {row.path}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <Badge
                tone={row.status >= 500 ? "danger" : row.status >= 400 ? "warning" : "neutral"}
              >
                {row.status}
              </Badge>
            ),
          },
          {
            key: "duration",
            header: "Duration",
            className: "text-right tabular-nums",
            cell: (row) => `${row.duration_ms.toLocaleString()} ms`,
          },
          {
            key: "user",
            header: "User",
            cell: (row) => (row.user_id ? `#${row.user_id}` : "Guest"),
          },
          {
            key: "id",
            header: "Request ID",
            cell: (row) => <span className="font-mono text-xs">{row.request_id ?? "—"}</span>,
          },
        ]}
      />
      <Pagination meta={logs.data?.meta} onPageChange={setPage} />
    </Card>
  );
}
