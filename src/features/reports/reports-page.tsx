"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Button, Card, Pagination, RangePicker, Select, Table } from "@/components/ui";
import { usePlatforms, useSocialAccounts } from "@/features/social-accounts/hooks";
import { errorMessage, toApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { formatBytes } from "@/lib/numbers";
import { reportsService, type ReportScope } from "@/services/reports.service";
import { toast } from "@/stores/toast.store";
import type { RangeFilter, Report, ReportFormat, ReportType } from "@/types/insights";

const POLL_MS = 3000;

const TYPES: { value: ReportType; label: string; hint: string }[] = [
  { value: "account", label: "Account report", hint: "Followers and engagement per account" },
  { value: "platform", label: "Platform report", hint: "Totals per network" },
  { value: "post", label: "Post report", hint: "Every published post with its metrics" },
  {
    value: "monthly",
    label: "Monthly report",
    hint: "Day-by-day breakdown for the month of the start date",
  },
];

const FORMATS: { value: ReportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV" },
];

const STATUS_TONE = {
  pending: "neutral",
  processing: "warning",
  completed: "success",
  failed: "danger",
} as const;

/** Customer reports (scope "customer") or the admin customer report (scope "admin"). */
export function ReportsPage({ scope = "customer" }: { scope?: ReportScope }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const reports = useQuery({
    queryKey: ["reports", scope, page],
    queryFn: () => reportsService.list(scope, page),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.items.some(
        (report) => report.status === "pending" || report.status === "processing",
      )
        ? POLL_MS
        : false,
  });
  const remove = useMutation({
    mutationFn: (id: number) => reportsService.remove(scope, id),
    onSuccess: ({ message }) => {
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["reports", scope] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const download = async (report: Report) => {
    try {
      await reportsService.download(scope, report);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title={scope === "admin" ? "Customer reports" : "Reports"}
        description={
          scope === "admin"
            ? "Export customer sign-ups and activity."
            : "Export your analytics as PDF, Excel or CSV."
        }
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ReportForm scope={scope} />
        </div>
        <Card title="Your reports" className="lg:col-span-3" bodyClassName="p-0">
          <Table
            caption="Reports"
            rows={reports.data?.items}
            rowKey={(row) => row.id}
            isLoading={reports.isLoading}
            error={reports.error}
            onRetry={() => void reports.refetch()}
            emptyTitle="No reports yet"
            emptyDescription="Generated reports are kept for 30 days."
            columns={[
              {
                key: "report",
                header: "Report",
                cell: (row) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.type_label}</p>
                    <p className="text-xs text-slate-500">
                      {row.parameters.from} – {row.parameters.to} · {row.format.toUpperCase()}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <span title={row.error_message ?? undefined}>
                    <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
                  </span>
                ),
              },
              {
                key: "created",
                header: "Requested",
                cell: (row) => formatDateTime(row.created_at),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    {row.status === "completed" && (
                      <Button size="sm" variant="secondary" onClick={() => void download(row)}>
                        Download ({formatBytes(row.file_size)})
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${row.type_label}`}
                      onClick={() => remove.mutate(row.id)}
                    >
                      ✕
                    </Button>
                  </div>
                ),
              },
            ]}
          />
          <Pagination meta={reports.data?.meta} onPageChange={setPage} />
        </Card>
      </div>
    </>
  );
}

function ReportForm({ scope }: { scope: ReportScope }) {
  const queryClient = useQueryClient();
  const accounts = useSocialAccounts();
  const platforms = usePlatforms();
  const [type, setType] = useState<ReportType>(scope === "admin" ? "customer" : "account");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [range, setRange] = useState<RangeFilter>({ range: "30d" });
  const [platform, setPlatform] = useState("");
  const [accountId, setAccountId] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const create = useMutation({
    mutationFn: () =>
      reportsService.create(scope, {
        ...range,
        format,
        ...(scope === "admin"
          ? {}
          : {
              type,
              platform: platform || undefined,
              account_id: accountId ? Number(accountId) : undefined,
            }),
      }),
    onSuccess: ({ message }) => {
      setErrors({});
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["reports", scope] });
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setErrors(apiError.errors);
      toast.error(apiError.message);
    },
  });

  return (
    <Card title="New report">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        {scope === "customer" && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Report type</legend>
            <div className="space-y-2">
              {TYPES.map((option) => (
                <label key={option.value} className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="report-type"
                    className="accent-brand-600 mt-1"
                    checked={type === option.value}
                    onChange={() => setType(option.value)}
                  />
                  <span>
                    <span className="font-medium text-slate-800">{option.label}</span>
                    <span className="block text-xs text-slate-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Period</p>
          <RangePicker value={range} onChange={setRange} />
          {(errors.from ?? errors.to) && (
            <p className="mt-1 text-sm text-red-600">{(errors.from ?? errors.to)?.[0]}</p>
          )}
        </div>
        {scope === "customer" && type !== "platform" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Platform"
              placeholder="All platforms"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              options={(platforms.data ?? []).map((p) => ({ value: p.key, label: p.name }))}
            />
            <Select
              label="Account"
              placeholder="All accounts"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              options={(accounts.data ?? []).map((a) => ({ value: String(a.id), label: a.name }))}
            />
          </div>
        )}
        <Select
          label="Format"
          value={format}
          onChange={(e) => setFormat(e.target.value as ReportFormat)}
          options={FORMATS}
          error={errors.format?.[0]}
        />
        <Button type="submit" loading={create.isPending} className="w-full">
          Generate report
        </Button>
      </form>
    </Card>
  );
}
