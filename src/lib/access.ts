import { ROUTES } from "@/constants/routes";
import type { NavItem } from "@/constants/navigation";
import type { AuthUser, UserRole } from "@/types/user";

export type Area = "public" | "guest" | "customer" | "admin";

const GUEST_ONLY = [ROUTES.login, ROUTES.register, ROUTES.forgotPassword, ROUTES.resetPassword];
const ADMIN_GUEST_ONLY = [ROUTES.admin.login];

export function isStaffRole(role: string | undefined | null): role is "admin" | "superadmin" {
  return role === "admin" || role === "superadmin";
}

export function homeForRole(role: string | undefined | null): string {
  return isStaffRole(role) ? ROUTES.admin.dashboard : ROUTES.customer.dashboard;
}

function matches(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Classifies a pathname into the area that governs access to it. */
export function areaFor(pathname: string): Area {
  if ([...GUEST_ONLY, ...ADMIN_GUEST_ONLY].some((path) => matches(pathname, path))) {
    return "guest";
  }
  if (matches(pathname, "/admin")) {
    return "admin";
  }
  if (Object.values(ROUTES.customer).some((path) => matches(pathname, path))) {
    return "customer";
  }
  return "public";
}

/**
 * Decides where (if anywhere) a request should be redirected, based only on the
 * session role cookie. The API remains the source of truth for authorization.
 */
export function resolveRedirect(pathname: string, role: string | undefined): string | null {
  const area = areaFor(pathname);
  const signedIn = Boolean(role);

  if (area === "guest") {
    return signedIn ? homeForRole(role) : null;
  }
  if (area === "admin") {
    if (!signedIn) return `${ROUTES.admin.login}?next=${encodeURIComponent(pathname)}`;
    return isStaffRole(role) ? null : ROUTES.customer.dashboard;
  }
  if (area === "customer") {
    if (!signedIn) return `${ROUTES.login}?next=${encodeURIComponent(pathname)}`;
    return role === "customer" ? null : ROUTES.admin.dashboard;
  }
  return null;
}

/** Only allow same-origin relative redirects to avoid open redirects. */
export function safeNext(next: string | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

export function hasPermission(user: AuthUser | undefined, permission?: string): boolean {
  if (!user) return false;
  if (!permission) return true;
  return user.permissions.includes(permission);
}

export function canSeeNavItem(user: AuthUser | undefined, item: NavItem): boolean {
  if (!user) return false;
  if (item.roles && !item.roles.includes(user.role as UserRole)) return false;
  return hasPermission(user, item.permission);
}
