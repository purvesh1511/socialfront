"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { CHART } from "@/components/charts/chart-tokens";
import { LineChart } from "@/components/charts/line-chart";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  RangePicker,
  Select,
  Table,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { StatCard } from "@/features/dashboard/stat-card";
import { AccountAvatar } from "@/features/social-accounts/account-avatar";
import { usePlatforms, useSocialAccounts } from "@/features/social-accounts/hooks";
import { errorMessage } from "@/lib/api-error";
import { formatDateTime, formatShortDate as shortDate } from "@/lib/format";
import { formatCompact, formatSigned } from "@/lib/numbers";
import { analyticsService, type AnalyticsFilters } from "@/services/analytics.service";
import { toast } from "@/stores/toast.store";
import type { AnalyticsOverview, RangeFilter } from "@/types/insights";

export function AnalyticsPage() {
  const accounts = useSocialAccounts();
  const platforms = usePlatforms();
  const [range, setRange] = useState<RangeFilter>({ range: "30d" });
  const [platform, setPlatform] = useState("");
  const [accountId, setAccountId] = useState("");

  const customIncomplete = range.range === "custom" && (!range.from || !range.to);
  const filters: AnalyticsFilters = {
    ...range,
    platform: platform || undefined,
    account_id: accountId ? Number(accountId) : undefined,
  };
  const overview = useQuery({
    queryKey: ["analytics", filters],
    queryFn: () => analyticsService.overview(filters),
    placeholderData: keepPreviousData,
    enabled: !customIncomplete,
  });
  const sync = useMutation({
    mutationFn: analyticsService.sync,
    onSuccess: ({ message }) => toast.success(message),
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        description={
          overview.data?.last_synced_at
            ? `Last updated ${formatDateTime(overview.data.last_synced_at)}`
            : "Metrics refresh daily."
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            loading={sync.isPending}
            onClick={() => sync.mutate()}
          >
            Refresh data
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <RangePicker value={range} onChange={setRange} />
        <div className="ml-auto flex flex-wrap gap-2">
          <div className="w-40">
            <Select
              aria-label="Platform"
              placeholder="All platforms"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              options={(platforms.data ?? [])
                .filter((p) => p.supports_analytics)
                .map((p) => ({ value: p.key, label: p.name }))}
            />
          </div>
          <div className="w-48">
            <Select
              aria-label="Account"
              placeholder="All accounts"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              options={(accounts.data ?? []).map((a) => ({
                value: String(a.id),
                label: `${a.name} (${a.platform.name})`,
              }))}
            />
          </div>
        </div>
      </div>

      {overview.isLoading ? (
        <Loading />
      ) : overview.error ? (
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      ) : !overview.data || overview.data.accounts.length === 0 ? (
        <EmptyState
          title="No accounts to analyse yet"
          description="Connect a social account and publish a few posts. Metrics appear after the first daily sync."
          action={
            <Link
              href={ROUTES.customer.accounts}
              className="text-brand-600 hover:text-brand-700 text-sm font-medium"
            >
              Connect an account →
            </Link>
          }
        />
      ) : (
        <AnalyticsContent data={overview.data} />
      )}
    </>
  );
}

function AnalyticsContent({ data }: { data: AnalyticsOverview }) {
  const { totals, timeseries } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Followers"
          value={formatCompact(totals.followers)}
          change={{
            value: totals.follower_change,
            label: `${formatSigned(totals.follower_change)} in this period`,
          }}
        />
        <StatCard
          label="Engagement"
          value={formatCompact(totals.engagement)}
          hint={`${totals.engagement_rate}% engagement rate`}
        />
        <StatCard
          label="Impressions"
          value={formatCompact(totals.impressions)}
          hint={`${formatCompact(totals.reach)} reach`}
        />
        <StatCard
          label="Posts published"
          value={formatCompact(totals.posts)}
          hint={`${formatCompact(totals.likes)} likes · ${formatCompact(totals.comments)} comments`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Engagement"
          description="Likes, comments, shares, saves and clicks on posts published each day"
          table={{
            columns: ["Date", "Posts", "Engagement"],
            rows: timeseries.map((p) => [p.date, p.posts, p.engagement]),
          }}
        >
          <LineChart
            data={timeseries}
            series={[{ key: "engagement", label: "Engagement", color: CHART.series[0] }]}
            x={(p) => p.date}
            y={(p, key) => p[key as "engagement"]}
            formatX={shortDate}
            ariaLabel="Daily engagement"
            area
          />
        </ChartCard>
        <ChartCard
          title="Followers"
          description="Total followers across selected accounts"
          table={{
            columns: ["Date", "Followers"],
            rows: timeseries.map((p) => [p.date, p.followers]),
          }}
        >
          <LineChart
            data={timeseries}
            series={[{ key: "followers", label: "Followers", color: CHART.series[0] }]}
            x={(p) => p.date}
            y={(p) => p.followers}
            formatX={shortDate}
            ariaLabel="Followers over time"
          />
        </ChartCard>
        <ChartCard
          title="Impressions and reach"
          description="Views of posts published each day"
          table={{
            columns: ["Date", "Impressions", "Reach"],
            rows: timeseries.map((p) => [p.date, p.impressions, p.reach]),
          }}
        >
          <LineChart
            data={timeseries}
            series={[
              { key: "impressions", label: "Impressions", color: CHART.series[0] },
              { key: "reach", label: "Reach", color: CHART.series[1] },
            ]}
            x={(p) => p.date}
            y={(p, key) => p[key as "impressions" | "reach"]}
            formatX={shortDate}
            ariaLabel="Daily impressions and reach"
          />
        </ChartCard>
        <ChartCard
          title="Engagement by platform"
          table={{
            columns: ["Platform", "Accounts", "Followers", "Posts", "Engagement", "Impressions"],
            rows: data.platforms.map((p) => [
              p.name,
              p.accounts,
              p.followers,
              p.posts,
              p.engagement,
              p.impressions,
            ]),
          }}
        >
          {data.platforms.length === 0 ? (
            <EmptyState title="No platform data" />
          ) : (
            <BarList
              ariaLabel="Engagement by platform"
              rows={data.platforms.map((p) => ({
                key: p.platform,
                label: p.name,
                value: p.engagement,
                detail: `${formatCompact(p.followers)} followers · ${p.posts} posts · ${formatCompact(p.impressions)} impressions`,
              }))}
            />
          )}
        </ChartCard>
      </div>

      <Card title="Top posts" description="Ranked by engagement" bodyClassName="p-0">
        <Table
          caption="Top posts"
          rows={data.top_posts}
          rowKey={(row) => `${row.post_id}-${row.account.id}`}
          emptyTitle="No published posts in this period"
          columns={[
            {
              key: "post",
              header: "Post",
              className: "max-w-md whitespace-normal",
              cell: (row) => (
                <Link href={ROUTES.posts.detail(row.post_id)} className="flex items-center gap-3">
                  {row.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element -- user uploads on the API host
                    <img
                      src={row.thumbnail}
                      alt=""
                      className="size-10 shrink-0 rounded object-cover"
                    />
                  )}
                  <span className="hover:text-brand-700 line-clamp-2 text-slate-800">
                    {row.content || "(media only)"}
                  </span>
                </Link>
              ),
            },
            {
              key: "account",
              header: "Account",
              cell: (row) => <AccountAvatar account={row.account} size="sm" />,
            },
            { key: "date", header: "Published", cell: (row) => shortDate(row.published_on) },
            {
              key: "engagement",
              header: "Engagement",
              className: "text-right tabular-nums",
              cell: (row) => formatCompact(row.engagement),
            },
            {
              key: "impressions",
              header: "Impressions",
              className: "text-right tabular-nums",
              cell: (row) => formatCompact(row.impressions),
            },
            {
              key: "likes",
              header: "Likes",
              className: "text-right tabular-nums",
              cell: (row) => formatCompact(row.likes),
            },
          ]}
        />
      </Card>

      <Card title="Accounts" bodyClassName="p-0">
        <Table
          caption="Accounts"
          rows={data.accounts}
          rowKey={(row) => row.account.id}
          columns={[
            {
              key: "account",
              header: "Account",
              cell: (row) => (
                <span className="flex items-center gap-2">
                  <AccountAvatar account={row.account} size="sm" />
                  {row.account.name}
                </span>
              ),
            },
            {
              key: "followers",
              header: "Followers",
              className: "text-right tabular-nums",
              cell: (row) => formatCompact(row.followers),
            },
            {
              key: "engagement",
              header: "Engagement",
              className: "text-right tabular-nums",
              cell: (row) => formatCompact(row.engagement),
            },
            {
              key: "impressions",
              header: "Impressions",
              className: "text-right tabular-nums",
              cell: (row) => formatCompact(row.impressions),
            },
            {
              key: "sync",
              header: "Last sync",
              cell: (row) =>
                row.supports_analytics ? (
                  formatDateTime(row.synced_at)
                ) : (
                  <span className="text-slate-400">
                    Not available for {row.account.platform.name}
                  </span>
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
