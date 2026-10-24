"use client";

import { useQuery } from "@tanstack/react-query";
import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { CHART } from "@/components/charts/chart-tokens";
import { LineChart } from "@/components/charts/line-chart";
import { PageHeader } from "@/components/layouts/page-header";
import { ErrorState, Loading } from "@/components/ui";
import { StatCard } from "@/features/dashboard/stat-card";
import { formatMoney, formatShortDate } from "@/lib/format";
import { systemService } from "@/services/system.service";

export function PlatformAnalytics() {
  const overview = useQuery({
    queryKey: ["superadmin", "analytics"],
    queryFn: systemService.analytics,
  });

  if (overview.isLoading) return <Loading />;
  if (overview.error || !overview.data)
    return <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />;

  const data = overview.data;

  return (
    <>
      <PageHeader
        title="Platform analytics"
        description="Revenue, growth and publishing across all customers."
      />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Monthly recurring revenue"
            value={formatMoney(data.mrr, data.currency)}
            hint="Yearly plans counted at 1/12"
          />
          <StatCard
            label="Revenue (30 days)"
            value={formatMoney(data.revenue_30d, data.currency)}
          />
          <StatCard
            label="Customers"
            value={data.customers.toLocaleString()}
            hint={`${data.new_customers_30d} new in 30 days`}
          />
          <StatCard
            label="Paying customers"
            value={data.paying_customers.toLocaleString()}
            hint={
              data.publish_success_rate === null
                ? undefined
                : `Publish success ${data.publish_success_rate}%`
            }
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Sign-ups"
            description="New accounts per day (30 days)"
            table={{
              columns: ["Date", "Sign-ups"],
              rows: data.series.map((p) => [p.date, p.signups]),
            }}
          >
            <LineChart
              data={data.series}
              series={[{ key: "signups", label: "Sign-ups", color: CHART.series[0] }]}
              x={(p) => p.date}
              y={(p) => p.signups}
              formatX={formatShortDate}
              ariaLabel="Daily sign-ups"
              area
            />
          </ChartCard>
          <ChartCard
            title="Publishing"
            description="Successful and failed publish attempts per day"
            table={{
              columns: ["Date", "Published", "Failed"],
              rows: data.series.map((p) => [p.date, p.published, p.failed]),
            }}
          >
            <LineChart
              data={data.series}
              series={[
                { key: "published", label: "Published", color: CHART.series[0] },
                { key: "failed", label: "Failed", color: CHART.series[1] },
              ]}
              x={(p) => p.date}
              y={(p, key) => p[key as "published" | "failed"]}
              formatX={formatShortDate}
              ariaLabel="Daily publishing results"
            />
          </ChartCard>
          <ChartCard
            title="Subscriptions by plan"
            description="Active, trialing and past-due"
            table={{
              columns: ["Plan", "Subscriptions"],
              rows: data.subscriptions_by_plan.map((r) => [r.plan, r.subscriptions]),
            }}
          >
            {data.subscriptions_by_plan.length ? (
              <BarList
                ariaLabel="Subscriptions by plan"
                rows={data.subscriptions_by_plan.map((row) => ({
                  key: row.plan,
                  label: row.plan,
                  value: row.subscriptions,
                }))}
              />
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                No paid or assigned subscriptions yet.
              </p>
            )}
          </ChartCard>
          <ChartCard
            title="AI requests"
            description="Requests per day across all customers"
            table={{
              columns: ["Date", "Requests"],
              rows: data.series.map((p) => [p.date, p.ai_requests]),
            }}
          >
            <LineChart
              data={data.series}
              series={[{ key: "ai_requests", label: "AI requests", color: CHART.series[0] }]}
              x={(p) => p.date}
              y={(p) => p.ai_requests}
              formatX={formatShortDate}
              ariaLabel="Daily AI requests"
            />
          </ChartCard>
        </div>
      </div>
    </>
  );
}
