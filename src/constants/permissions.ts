/** Mirrors backend App\Enums\Permission. */
export const PERMISSIONS = {
  manageCustomers: "manage_customers",
  manageAdmins: "manage_admins",
  manageRoles: "manage_roles",
  managePlans: "manage_plans",
  manageSubscriptions: "manage_subscriptions",
  manageSettings: "manage_settings",
  viewReports: "view_reports",
  viewAuditLogs: "view_audit_logs",
  approvePosts: "approve_posts",
  manageSupport: "manage_support",
  viewSystemHealth: "view_system_health",
  manageSocialAccounts: "manage_social_accounts",
  createPosts: "create_posts",
  editPosts: "edit_posts",
  deletePosts: "delete_posts",
  schedulePosts: "schedule_posts",
  publishPosts: "publish_posts",
  viewAnalytics: "view_analytics",
  manageBilling: "manage_billing",
  manageContentLibrary: "manage_content_library",
  useAi: "use_ai",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
