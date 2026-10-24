import type { AdminDashboard, CustomerDashboard } from "@/types/admin";
import { get } from "./api-client";

export const dashboardService = {
  customer: () => get<CustomerDashboard>("/customer/dashboard"),
  admin: () => get<AdminDashboard>("/admin/dashboard"),
};
