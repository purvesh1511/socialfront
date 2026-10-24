"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, Button, Card, ErrorState, Loading, Table } from "@/components/ui";
import { errorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { systemService } from "@/services/system.service";
import { toast } from "@/stores/toast.store";
import type { HealthStatus, SystemHealth as Health } from "@/types/system";

const REFRESH_MS = 30_000;

const STATUS: Record<
  HealthStatus,
  { tone: "success" | "warning" | "danger"; label: string; icon: string }
> = {
  ok: { tone: "success", label: "All systems normal", icon: "✓" },
  warning: { tone: "warning", label: "Needs attention", icon: "!" },
  critical: { tone: "danger", label: "Critical", icon: "✕" },
};

const CHECKS: { key: keyof Health["checks"]; label: string; warnAbove?: number }[] = [
  { key: "failed_jobs_24h", label: "Failed jobs", warnAbove: 0 },
  { key: "api_errors_24h", label: "API errors (5xx)", warnAbove: 0 },
  { key: "slow_requests_24h", label: "Slow API requests" },
  { key: "errors_24h", label: "Logged errors", warnAbove: 0 },
  { key: "publish_failures_24h", label: "Publishing failures" },
  { key: "oauth_failures_24h", label: "OAuth failures" },
  { key: "ai_failures_24h", label: "AI provider failures" },
  { key: "payment_failures_24h", label: "Failed payments" },
  { key: "webhook_failures_24h", label: "Webhook failures", warnAbove: 0 },
  { key: "tokens_expiring_7d", label: "Tokens expiring (7 days)" },
  { key: "accounts_needing_reconnect", label: "Accounts needing reconnect" },
];

export function SystemHealth() {
  const queryClient = useQueryClient();
  const health = useQuery({
    queryKey: ["superadmin", "health"],
    queryFn: systemService.health,
    refetchInterval: REFRESH_MS,
  });
  const onDone = ({ message }: { message: string }) => {
    toast.success(message);
    void queryClient.invalidateQueries({ queryKey: ["superadmin", "health"] });
  };
  const onError = (error: unknown) => toast.error(errorMessage(error));
  const retry = useMutation({ mutationFn: systemService.retryJob, onSuccess: onDone, onError });
  const forget = useMutation({ mutationFn: systemService.forgetJob, onSuccess: onDone, onError });

  if (health.isLoading) return <Loading />;
  if (health.error || !health.data)
    return <ErrorState error={health.error} onRetry={() => void health.refetch()} />;

  const data = health.data;
  const status = STATUS[data.status];

  return (
    <>
      <PageHeader
        title="System health"
        description={`Refreshes every 30 seconds · updated ${formatDateTime(new Date(health.dataUpdatedAt).toISOString())}`}
        actions={
          <Badge tone={status.tone}>
            <span aria-hidden="true">{status.icon}&nbsp;</span>
            {status.label}
          </Badge>
        }
      />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Scheduler">
            <p
              className={
                data.scheduler.healthy
                  ? "text-sm font-medium text-emerald-700"
                  : "text-sm font-medium text-red-700"
              }
            >
              <span aria-hidden="true">{data.scheduler.healthy ? "✓ " : "✕ "}</span>
              {data.scheduler.healthy ? "Running" : "Not running"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Last heartbeat: {formatDateTime(data.scheduler.last_run_at)}
            </p>
            {!data.scheduler.healthy && (
              <p className="mt-2 text-xs text-slate-600">
                Check that{" "}
                <code className="rounded bg-slate-100 px-1">php artisan schedule:work</code> (or the
                cron entry) is running.
              </p>
            )}
          </Card>
          <Card title="Queues" description={`Connection: ${data.queue_connection}`}>
            <dl className="space-y-1 text-sm">
              {Object.entries(data.queues).map(([name, size]) => (
                <div key={name} className="flex justify-between">
                  <dt className="text-slate-600">{name}</dt>
                  <dd className="font-medium tabular-nums">
                    {size === null ? "Unreachable" : `${size.toLocaleString()} waiting`}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-slate-500">
              Oldest waiting job: {formatDateTime(data.oldest_pending_job_at)}
            </p>
          </Card>
          <Card title="Failed jobs (stored)">
            <p className="text-3xl font-semibold tabular-nums">{data.failed_jobs.length}</p>
            <p className="mt-1 text-xs text-slate-500">Most recent 50 shown below.</p>
          </Card>
        </div>

        <Card title="Last 24 hours">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map((check) => {
              const value = data.checks[check.key];
              const warn = check.warnAbove !== undefined && value > check.warnAbove;
              return (
                <div
                  key={check.key}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm"
                >
                  <dt className="text-slate-600">{check.label}</dt>
                  <dd
                    className={
                      warn
                        ? "font-semibold text-amber-800 tabular-nums"
                        : "font-medium text-slate-900 tabular-nums"
                    }
                  >
                    {warn && <span aria-hidden="true">! </span>}
                    {value.toLocaleString()}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Card>

        <Card title="Failed jobs" bodyClassName="p-0">
          <Table
            rows={data.failed_jobs}
            rowKey={(row) => row.uuid}
            emptyTitle="No failed jobs"
            columns={[
              { key: "failed", header: "Failed", cell: (row) => formatDateTime(row.failed_at) },
              { key: "queue", header: "Queue", cell: (row) => row.queue },
              {
                key: "exception",
                header: "Error",
                className: "max-w-md whitespace-normal",
                cell: (row) => (
                  <span className="line-clamp-2 font-mono text-xs">{row.exception}</span>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={retry.isPending && retry.variables === row.uuid}
                      onClick={() => retry.mutate(row.uuid)}
                    >
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={forget.isPending && forget.variables === row.uuid}
                      onClick={() => forget.mutate(row.uuid)}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
