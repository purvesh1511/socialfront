import type {
  AiUsageReport,
  ApiLogEntry,
  PlatformOverview,
  PlatformSetting,
  PlatformUpdate,
  SystemHealth,
  SystemLogEntry,
} from "@/types/system";
import { get, getPaginated, send } from "./api-client";

export const systemService = {
  health: () => get<SystemHealth>("/superadmin/system/health"),
  retryJob: (uuid: string) => send<null>("post", `/superadmin/system/failed-jobs/${uuid}/retry`),
  forgetJob: (uuid: string) => send<null>("delete", `/superadmin/system/failed-jobs/${uuid}`),
  logs: (params: { page?: number; level?: string; channel?: string; search?: string }) =>
    getPaginated<SystemLogEntry>("/superadmin/system/logs", params),
  apiLogs: (params: { page?: number; errors_only?: boolean }) =>
    getPaginated<ApiLogEntry>("/superadmin/system/api-logs", {
      ...params,
      errors_only: params.errors_only ? 1 : undefined,
    }),
  analytics: () => get<PlatformOverview>("/superadmin/system/analytics"),
  aiUsage: (period?: string) => get<AiUsageReport>("/superadmin/system/ai-usage", { period }),
  platforms: () => get<PlatformSetting[]>("/superadmin/platforms"),
  updatePlatform: (key: string, data: PlatformUpdate) =>
    send<PlatformSetting>("put", `/superadmin/platforms/${key}`, data),
  testEmail: () => send<null>("post", "/superadmin/settings/test-email"),
};
