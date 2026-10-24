import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { AccountsPage } from "@/features/social-accounts/accounts-page";

export const metadata: Metadata = { title: "Social accounts" };

export default function Page() {
  return (
    <RequirePermission permission={PERMISSIONS.manageSocialAccounts}>
      <AccountsPage />
    </RequirePermission>
  );
}
