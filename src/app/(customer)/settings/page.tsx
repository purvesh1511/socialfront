import type { Metadata } from "next";
import { AccountSettingsPage } from "@/features/settings/account-settings-page";

export const metadata: Metadata = { title: "Settings" };

export default function CustomerSettingsPage() {
  return <AccountSettingsPage />;
}
