import type { Metadata } from "next";
import { CustomerDashboard } from "@/features/dashboard/customer-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <CustomerDashboard />;
}
