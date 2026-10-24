import { PERMISSIONS, type PermissionName } from "./permissions";
import { ROUTES } from "./routes";
import type { UserRole } from "@/types/user";

export interface NavItem {
  label: string;
  href: string;
  permission?: PermissionName;
  roles?: UserRole[];
  /** Items with a section are grouped under that heading in the sidebar. */
  section?: string;
}

export const CUSTOMER_NAV: NavItem[] = [
  { label: "Dashboard", href: ROUTES.customer.dashboard },
  { label: "Create post", href: ROUTES.posts.create, permission: PERMISSIONS.createPosts },
  { label: "Posts", href: ROUTES.customer.posts },
  { label: "Calendar", href: ROUTES.customer.calendar },
  { label: "Queue", href: ROUTES.customer.queue },
  { label: "Analytics", href: ROUTES.customer.analytics, permission: PERMISSIONS.viewAnalytics },
  { label: "Reports", href: ROUTES.customer.reports, permission: PERMISSIONS.viewAnalytics },
  { label: "Library", href: ROUTES.customer.library, permission: PERMISSIONS.manageContentLibrary },
  { label: "AI Studio", href: ROUTES.customer.ai, permission: PERMISSIONS.useAi },
  {
    label: "Accounts",
    href: ROUTES.customer.accounts,
    permission: PERMISSIONS.manageSocialAccounts,
  },
  {
    label: "Billing",
    href: ROUTES.customer.billing,
    permission: PERMISSIONS.manageBilling,
    section: "Account",
  },
  { label: "Support", href: ROUTES.customer.support, section: "Account" },
  { label: "Notifications", href: ROUTES.customer.notifications, section: "Account" },
  { label: "Profile", href: ROUTES.customer.profile, section: "Account" },
  { label: "Settings", href: ROUTES.customer.settings, section: "Account" },
];

const superadmin: UserRole[] = ["superadmin"];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: ROUTES.admin.dashboard },
  { label: "Customers", href: ROUTES.admin.customers, permission: PERMISSIONS.manageCustomers },
  {
    label: "Subscriptions",
    href: ROUTES.admin.subscriptions,
    permission: PERMISSIONS.manageSubscriptions,
  },
  { label: "Support", href: ROUTES.admin.support, permission: PERMISSIONS.manageSupport },
  { label: "Approvals", href: ROUTES.admin.approvals, permission: PERMISSIONS.approvePosts },
  { label: "Reports", href: ROUTES.admin.reports, permission: PERMISSIONS.viewReports },
  { label: "Notifications", href: ROUTES.admin.notifications },

  // Superadmin console
  {
    label: "Plans",
    href: ROUTES.admin.plans,
    permission: PERMISSIONS.managePlans,
    roles: superadmin,
    section: "Billing",
  },
  {
    label: "Payments",
    href: ROUTES.admin.payments,
    permission: PERMISSIONS.manageSubscriptions,
    roles: superadmin,
    section: "Billing",
  },
  {
    label: "Invoices",
    href: ROUTES.admin.invoices,
    permission: PERMISSIONS.manageSubscriptions,
    roles: superadmin,
    section: "Billing",
  },
  {
    label: "Platform analytics",
    href: ROUTES.admin.platformAnalytics,
    permission: PERMISSIONS.viewSystemHealth,
    roles: superadmin,
    section: "Insights",
  },
  {
    label: "AI usage",
    href: ROUTES.admin.aiUsage,
    permission: PERMISSIONS.viewSystemHealth,
    roles: superadmin,
    section: "Insights",
  },
  {
    label: "System health",
    href: ROUTES.admin.system,
    permission: PERMISSIONS.viewSystemHealth,
    roles: superadmin,
    section: "Monitoring",
  },
  {
    label: "System logs",
    href: ROUTES.admin.systemLogs,
    permission: PERMISSIONS.viewSystemHealth,
    roles: superadmin,
    section: "Monitoring",
  },
  {
    label: "Audit logs",
    href: ROUTES.admin.auditLogs,
    permission: PERMISSIONS.viewAuditLogs,
    section: "Monitoring",
  },
  {
    label: "Admins",
    href: ROUTES.admin.admins,
    permission: PERMISSIONS.manageAdmins,
    roles: superadmin,
    section: "Administration",
  },
  {
    label: "Roles",
    href: ROUTES.admin.roles,
    permission: PERMISSIONS.manageRoles,
    roles: superadmin,
    section: "Administration",
  },
  {
    label: "Permissions",
    href: ROUTES.admin.permissions,
    permission: PERMISSIONS.manageRoles,
    roles: superadmin,
    section: "Administration",
  },
  {
    label: "Social platforms",
    href: ROUTES.admin.platforms,
    permission: PERMISSIONS.manageSettings,
    roles: superadmin,
    section: "Administration",
  },
  {
    label: "Settings",
    href: ROUTES.admin.settings,
    permission: PERMISSIONS.manageSettings,
    roles: superadmin,
    section: "Administration",
  },
  { label: "My profile", href: ROUTES.admin.profile, section: "Account" },
];

export const TIMEZONES: string[] =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];
