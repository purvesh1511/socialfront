import type { Metadata } from "next";
import { ProfilePage } from "@/features/settings/profile-page";

export const metadata: Metadata = { title: "My profile" };

export default function AdminProfilePage() {
  return <ProfilePage includeSecurity />;
}
