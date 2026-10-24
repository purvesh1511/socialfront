import type { ReactNode } from "react";
import { AreaGuard } from "@/components/layouts/area-guard";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { CUSTOMER_NAV } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AreaGuard portal="customer">
      <DashboardShell portal="customer" nav={CUSTOMER_NAV} profileHref={ROUTES.customer.profile}>
        {children}
      </DashboardShell>
    </AreaGuard>
  );
}
