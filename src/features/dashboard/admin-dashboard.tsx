"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, ErrorState, Loading, StatusBadge, Table } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { formatDate } from "@/lib/format";
import { dashboardService } from "@/services/dashboard.service";
import { ActivityList } from "./activity-list";
import { StatCard } from "./stat-card";

export function AdminDashboard() {
  const dashboard = useQuery({ queryKey: ["dashboard", "admin"], queryFn: dashboardService.admin });

  if (dashboard.isLoading) return <Loading />;
  if (dashboard.error || !dashboard.data) {
    return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;
  }

  const {
    stats,
    recent_customers: recentCustomers,
    recent_activity: recentActivity,
  } = dashboard.data;

  return (
    <>
      <PageHeader title="Dashboard" description="Platform overview." />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total customers" value={stats.total_customers} />
          <StatCard
            label="Active customers"
            value={stats.active_customers}
            hint={`${stats.suspended_customers} suspended`}
          />
          <StatCard
            label="New (7 days)"
            value={stats.new_customers_7d}
            hint={`${stats.new_customers_30d} in 30 days`}
          />
          {dashboard.data.pending_approvals !== null ? (
            <Link href={ROUTES.admin.approvals} className="block rounded-xl hover:shadow-md">
              <StatCard
                label="Pending approvals"
                value={dashboard.data.pending_approvals}
                hint="Posts waiting for review"
              />
            </Link>
          ) : (
            <StatCard label="Staff accounts" value={stats.total_admins} />
          )}
          {dashboard.data.open_tickets !== null && (
            <Link href={ROUTES.admin.support} className="block rounded-xl hover:shadow-md">
              <StatCard
                label="Open support tickets"
                value={dashboard.data.open_tickets}
                hint="Waiting for a reply"
              />
            </Link>
          )}
          {dashboard.data.active_subscriptions !== null && (
            <Link href={ROUTES.admin.subscriptions} className="block rounded-xl hover:shadow-md">
              <StatCard
                label="Active subscriptions"
                value={dashboard.data.active_subscriptions}
                hint="Trialing, active and past due"
              />
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Newest customers" bodyClassName="p-0">
            <Table
              rows={recentCustomers}
              rowKey={(row) => row.id}
              emptyTitle="No customers yet"
              columns={[
                {
                  key: "name",
                  header: "Customer",
                  cell: (row) => (
                    <Link
                      href={`${ROUTES.admin.customers}/${row.id}`}
                      className="text-brand-700 font-medium hover:underline"
                    >
                      {row.name}
                    </Link>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row) => <StatusBadge status={row.status} />,
                },
                { key: "joined", header: "Joined", cell: (row) => formatDate(row.created_at) },
              ]}
            />
          </Card>
          {recentActivity && (
            <Card title="Recent activity">
              <ActivityList items={recentActivity} showUser />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
