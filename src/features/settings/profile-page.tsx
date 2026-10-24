"use client";

import { PageHeader } from "@/components/layouts/page-header";
import { Loading } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks";
import { AvatarUpload } from "./avatar-upload";
import { NotificationPreferences } from "./notification-preferences";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";
import { TwoFactorCard } from "./two-factor-card";

/**
 * Shared by the customer (/profile) and admin (/admin/profile) panels. Customers manage their
 * password on /settings, so the security section is optional here.
 */
export function ProfilePage({ includeSecurity = false }: { includeSecurity?: boolean }) {
  const { data: user } = useCurrentUser();
  if (!user) return <Loading />;

  return (
    <>
      <PageHeader title="Profile" description="Manage your personal information." />
      <div className="space-y-6">
        <AvatarUpload user={user} />
        <ProfileForm user={user} />
        {includeSecurity && <PasswordForm />}
        {includeSecurity && <TwoFactorCard />}
        {includeSecurity && (
          <NotificationPreferences events={["approval_requested", "support_ticket_created"]} />
        )}
      </div>
    </>
  );
}
