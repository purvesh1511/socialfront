import type { AuditLogFilters } from "@/types/admin";
import type { AuditLog } from "@/types/user";
import { get, getPaginated } from "./api-client";

export const auditLogsService = {
  list: (filters: AuditLogFilters) => getPaginated<AuditLog>("/admin/audit-logs", filters),
  events: () => get<string[]>("/admin/audit-logs/events"),
};
