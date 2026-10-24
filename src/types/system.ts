import type { PlatformStatus } from "./social";

export type HealthStatus = "ok" | "warning" | "critical";

export interface FailedJob {
  id: number;
  uuid: string;
  queue: string;
  exception: string;
  failed_at: string;
}

export interface SystemHealth {
  status: HealthStatus;
  scheduler: { healthy: boolean; last_run_at: string | null };
  /** Null when the queue backend is unreachable. */
  queues: Record<string, number | null>;
  oldest_pending_job_at: string | null;
  queue_connection: string;
  checks: {
    queue_backlog: number;
    failed_jobs_24h: number;
    api_errors_24h: number;
    slow_requests_24h: number;
    oauth_failures_24h: number;
    publish_failures_24h: number;
    ai_failures_24h: number;
    payment_failures_24h: number;
    webhook_failures_24h: number;
    errors_24h: number;
    tokens_expiring_7d: number;
    accounts_needing_reconnect: number;
  };
  failed_jobs: FailedJob[];
}

export interface SystemLogEntry {
  id: number;
  level: string;
  channel: string;
  message: string;
  context: Record<string, unknown> | null;
  request_id: string | null;
  created_at: string;
}

export interface ApiLogEntry {
  id: number;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  user_id: number | null;
  ip_address: string | null;
  request_id: string | null;
  created_at: string;
}

export interface PlatformOverview {
  currency: string;
  mrr: number;
  revenue_30d: number;
  customers: number;
  new_customers_30d: number;
  paying_customers: number;
  subscriptions_by_plan: { plan: string; subscriptions: number }[];
  publish_success_rate: number | null;
  series: {
    date: string;
    signups: number;
    published: number;
    failed: number;
    ai_requests: number;
  }[];
}

export interface AiUsageReport {
  period: string;
  totals: { requests: number; input_tokens: number; output_tokens: number; failed: number };
  by_feature: { feature: string; requests: number; failed: number }[];
  top_users: {
    user_id: number;
    name: string;
    email: string;
    requests: number;
    input_tokens: number;
    output_tokens: number;
  }[];
  daily: { date: string; requests: number }[];
  provider: string;
}

export interface PlatformSetting {
  key: string;
  name: string;
  auth_type: string;
  is_enabled: boolean;
  is_configured: boolean;
  /** Effective status: the recorded one unless credentials are missing or verification lapsed. */
  status: PlatformStatus;
  status_label: string;
  recorded_status: PlatformStatus;
  verified_at: string | null;
  verification_notes: string | null;
  docs_url: string | null;
  supports_analytics: boolean;
  accounts_count: number;
}

export interface PlatformUpdate {
  is_enabled?: boolean;
  verification_status?: Exclude<PlatformStatus, "verification_expired">;
  verification_notes?: string | null;
}
