import type { AnalyticsOverview, RangeFilter } from "@/types/insights";
import { get, send } from "./api-client";

export interface AnalyticsFilters extends RangeFilter {
  account_id?: number;
  platform?: string;
}

export const analyticsService = {
  overview: (filters: AnalyticsFilters) => get<AnalyticsOverview>("/customer/analytics", filters),
  sync: () => send<{ queued: number }>("post", "/customer/analytics/sync"),
};
