"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { CHART } from "@/components/charts/chart-tokens";
import { LineChart } from "@/components/charts/line-chart";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, ErrorState, Input, Loading, Table } from "@/components/ui";
import { StatCard } from "@/features/dashboard/stat-card";
import { formatShortDate, humanize } from "@/lib/format";
import { formatCompact } from "@/lib/numbers";
import { systemService } from "@/services/system.service";

const thisMonth = () => new Date().toISOString().slice(0, 7);

export function AiUsage() {
  const [period, setPeriod] = useState(thisMonth);
  const usage = useQuery({
    queryKey: ["superadmin", "ai-usage", period],
    queryFn: () => systemService.aiUsage(period),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="AI usage"
        description="Requests and tokens across all customers."
        actions={
          <div className="w-44">
            <Input
              type="month"
              aria-label="Month"
              value={period}
              max={thisMonth()}
              onChange={(event) => event.target.value && setPeriod(event.target.value)}
            />
          </div>
        }
      />
      {usage.isLoading ? (
        <Loading />
      ) : usage.error || !usage.data ? (
        <ErrorState error={usage.error} onRetry={() => void usage.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Requests"
              value={usage.data.totals.requests.toLocaleString()}
              hint={`Provider: ${usage.data.provider}`}
            />
            <StatCard label="Failed requests" value={usage.data.totals.failed.toLocaleString()} />
            <StatCard label="Input tokens" value={formatCompact(usage.data.totals.input_tokens)} />
            <StatCard
              label="Output tokens"
              value={formatCompact(usage.data.totals.output_tokens)}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Requests per day"
              table={{
                columns: ["Date", "Requests"],
                rows: usage.data.daily.map((p) => [p.date, p.requests]),
              }}
            >
              <LineChart
                data={usage.data.daily}
                series={[{ key: "requests", label: "Requests", color: CHART.series[0] }]}
                x={(p) => p.date}
                y={(p) => p.requests}
                formatX={formatShortDate}
                ariaLabel="AI requests per day"
                area
              />
            </ChartCard>
            <ChartCard
              title="By feature"
              table={{
                columns: ["Feature", "Requests", "Failed"],
                rows: usage.data.by_feature.map((r) => [humanize(r.feature), r.requests, r.failed]),
              }}
            >
              {usage.data.by_feature.length ? (
                <BarList
                  ariaLabel="AI requests by feature"
                  rows={usage.data.by_feature.map((row) => ({
                    key: row.feature,
                    label: humanize(row.feature),
                    value: row.requests,
                    detail: row.failed ? `${row.failed} failed` : undefined,
                  }))}
                />
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">
                  No AI requests this month.
                </p>
              )}
            </ChartCard>
          </div>
          <Card title="Top customers" bodyClassName="p-0">
            <Table
              rows={usage.data.top_users}
              rowKey={(row) => row.user_id}
              emptyTitle="No usage this month"
              columns={[
                {
                  key: "user",
                  header: "Customer",
                  cell: (row) => (
                    <span>
                      <span className="font-medium text-slate-800">{row.name}</span>
                      <span className="block text-xs text-slate-500">{row.email}</span>
                    </span>
                  ),
                },
                {
                  key: "requests",
                  header: "Requests",
                  className: "text-right tabular-nums",
                  cell: (row) => row.requests.toLocaleString(),
                },
                {
                  key: "in",
                  header: "Input tokens",
                  className: "text-right tabular-nums",
                  cell: (row) => formatCompact(row.input_tokens),
                },
                {
                  key: "out",
                  header: "Output tokens",
                  className: "text-right tabular-nums",
                  cell: (row) => formatCompact(row.output_tokens),
                },
              ]}
            />
          </Card>
        </div>
      )}
    </>
  );
}
