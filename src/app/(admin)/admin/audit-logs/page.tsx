import type { Metadata } from "next";
import { RequirePermission } from "@/components/layouts/require-permission";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditLogsList } from "@/features/admin/audit-logs/audit-logs-list";

export const metadata: Metadata = { title: "Audit logs" };

export default function AuditLogsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.viewAuditLogs}>
      <AuditLogsList />
    </RequirePermission>
  );
}
