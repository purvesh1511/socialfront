import type { ReactNode } from "react";
import { AreaGuard } from "@/components/layouts/area-guard";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { ADMIN_NAV } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AreaGuard portal="admin">
      <DashboardShell portal="admin" nav={ADMIN_NAV} profileHref={ROUTES.admin.profile}>
        {children}
      </DashboardShell>
    </AreaGuard>
  );
}
