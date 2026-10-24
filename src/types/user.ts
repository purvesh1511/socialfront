export type UserRole = "superadmin" | "admin" | "customer";
export type UserStatus = "active" | "suspended";

export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  role: UserRole | null;
  avatar_url: string | null;
  timezone: string;
  requires_post_approval?: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string | null;
}

/** The signed-in user including effective permissions. */
export interface AuthUser extends User {
  permissions: string[];
  two_factor_enabled?: boolean;
  two_factor_setup_required?: boolean;
  /** Customers only: the plan currently in effect. */
  plan?: { slug: string | null; name: string | null; features: string[] };
}

export interface AuditLog {
  id: number;
  event: string;
  user: Pick<User, "id" | "name" | "email"> | null;
  auditable_type: string | null;
  auditable_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  data: { title?: string; message?: string; url?: string; event?: string; [key: string]: unknown };
  read_at: string | null;
  created_at: string | null;
}
