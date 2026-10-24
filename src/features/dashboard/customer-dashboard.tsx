"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EmailVerificationBanner } from "@/components/layouts/email-verification-banner";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, ErrorState, Loading } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/features/auth/hooks";
import { dashboardService } from "@/services/dashboard.service";
import { ActivityList } from "./activity-list";
import { StatCard } from "./stat-card";

export function CustomerDashboard() {
  const { data: user } = useCurrentUser();
  const dashboard = useQuery({
    queryKey: ["dashboard", "customer"],
    queryFn: dashboardService.customer,
  });

  return (
    <>
      <PageHeader
        title={`Welcome${user ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here's what's happening with your social media."
        actions={
          <Link
            href={ROUTES.posts.create}
            className="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Create post
          </Link>
        }
      />
      <EmailVerificationBanner />

      {dashboard.isLoading ? (
        <Loading />
      ) : dashboard.error || !dashboard.data ? (
        <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatLink
              href={ROUTES.customer.accounts}
              label="Connected accounts"
              value={dashboard.data.connected_accounts}
            />
            <StatLink
              href={ROUTES.posts.scheduled}
              label="Scheduled"
              value={dashboard.data.posts.scheduled ?? 0}
            />
            <StatLink
              href={ROUTES.posts.published}
              label="Published"
              value={dashboard.data.posts.published ?? 0}
            />
            <StatLink
              href={ROUTES.posts.failed}
              label="Failed"
              value={dashboard.data.posts.failed ?? 0}
            />
          </div>
          {dashboard.data.connected_accounts === 0 && (
            <Card title="Get started">
              <p className="text-sm text-slate-600">
                Connect your first social account, then create a post and schedule it or add it to
                your queue.
              </p>
              <Link
                href={ROUTES.customer.accounts}
                className="text-brand-600 hover:text-brand-700 mt-3 inline-block text-sm font-medium"
              >
                Connect an account →
              </Link>
            </Card>
          )}
          <Card title="Recent account activity">
            <ActivityList items={dashboard.data.recent_activity} />
          </Card>
        </div>
      )}
    </>
  );
}

function StatLink({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link
      href={href}
      className="block rounded-xl transition-shadow hover:shadow-md focus-visible:shadow-md"
    >
      <StatCard label={label} value={value} />
    </Link>
  );
}
