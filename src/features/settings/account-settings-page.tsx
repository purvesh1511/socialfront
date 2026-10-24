"use client";

import { EmailVerificationBanner } from "@/components/layouts/email-verification-banner";
import { PageHeader } from "@/components/layouts/page-header";
import { Card } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks";
import { formatDateTime } from "@/lib/format";
import { NotificationPreferences } from "./notification-preferences";
import { PasswordForm } from "./password-form";
import { TwoFactorCard } from "./two-factor-card";

const CUSTOMER_EVENTS = [
  "post_scheduled",
  "post_published",
  "post_failed",
  "post_approved",
  "post_rejected",
  "social_account_connected",
  "social_account_expired",
  "payment_succeeded",
  "payment_failed",
  "subscription_changed",
  "support_reply",
];

export function AccountSettingsPage() {
  const { data: user } = useCurrentUser();

  return (
    <>
      <PageHeader title="Settings" description="Security and account settings." />
      <EmailVerificationBanner />
      <div className="space-y-6">
        <PasswordForm />
        <TwoFactorCard />
        <NotificationPreferences events={CUSTOMER_EVENTS} />
        <Card title="Sign-in details">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Email verification</dt>
              <dd className="mt-1 font-medium">
                {user?.email_verified_at
                  ? `Verified ${formatDateTime(user.email_verified_at)}`
                  : "Not verified"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Last sign-in</dt>
              <dd className="mt-1 font-medium">{formatDateTime(user?.last_login_at)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
