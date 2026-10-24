import type { AuditLog, User } from "./user";

export interface Role {
  id: number;
  name: string;
  users_count: number;
  permissions: string[];
}

export interface Permission {
  id: number;
  name: string;
}

export type SettingType = "string" | "boolean" | "integer" | "json";

export interface Setting {
  key: string;
  group: string;
  label: string | null;
  description: string | null;
  /** True when this setting overrides server configuration (.env). */
  overrides_config: boolean;
  type: SettingType;
  value: unknown;
  is_encrypted: boolean;
  has_value: boolean;
  is_public: boolean;
}

export interface PublicSettings {
  app_name?: string;
  support_email?: string;
  registration_enabled?: boolean;
  maintenance_message?: string | null;
}

export interface AdminDashboard {
  stats: {
    total_customers: number;
    active_customers: number;
    suspended_customers: number;
    new_customers_7d: number;
    new_customers_30d: number;
    total_admins: number;
  };
  recent_customers: User[];
  pending_approvals: number | null;
  open_tickets: number | null;
  active_subscriptions: number | null;
  recent_activity: AuditLog[] | null;
}

export interface CustomerDashboard {
  connected_accounts: number;
  posts: Partial<Record<string, number>>;
  email_verified: boolean;
  unread_notifications: number;
  member_since: string | null;
  recent_activity: AuditLog[];
}

export interface CustomerDetail {
  customer: User;
  recent_activity: AuditLog[];
}

export interface AuditLogFilters {
  page?: number;
  per_page?: number;
  search?: string;
  event?: string;
  from?: string;
  to?: string;
}
