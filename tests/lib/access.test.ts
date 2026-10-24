import { describe, expect, it } from "vitest";
import { ADMIN_NAV } from "@/constants/navigation";
import { areaFor, canSeeNavItem, hasPermission, resolveRedirect, safeNext } from "@/lib/access";
import type { AuthUser } from "@/types/user";

const user = (overrides: Partial<AuthUser>): AuthUser => ({
  id: 1,
  name: "Test",
  email: "t@example.com",
  status: "active",
  role: "customer",
  avatar_url: null,
  timezone: "UTC",
  email_verified_at: null,
  last_login_at: null,
  created_at: null,
  permissions: [],
  ...overrides,
});

describe("areaFor", () => {
  it.each([
    ["/login", "guest"],
    ["/admin/login", "guest"],
    ["/admin/customers/5", "admin"],
    ["/dashboard", "customer"],
    ["/settings", "customer"],
    ["/posts/12/edit", "customer"],
    ["/calendar", "customer"],
    ["/accounts/callback/facebook", "customer"],
    ["/queue", "customer"],
    ["/verify-email", "public"],
    ["/", "public"],
  ])("%s is %s", (path, area) => {
    expect(areaFor(path)).toBe(area);
  });
});

describe("resolveRedirect", () => {
  it("sends guests to the matching login page", () => {
    expect(resolveRedirect("/dashboard", undefined)).toBe("/login?next=%2Fdashboard");
    expect(resolveRedirect("/admin/customers", undefined)).toBe(
      "/admin/login?next=%2Fadmin%2Fcustomers",
    );
  });

  it("keeps customers out of the admin panel and staff out of the customer panel", () => {
    expect(resolveRedirect("/admin/dashboard", "customer")).toBe("/dashboard");
    expect(resolveRedirect("/dashboard", "admin")).toBe("/admin/dashboard");
    expect(resolveRedirect("/dashboard", "superadmin")).toBe("/admin/dashboard");
  });

  it("redirects signed-in users away from guest pages", () => {
    expect(resolveRedirect("/login", "customer")).toBe("/dashboard");
    expect(resolveRedirect("/admin/login", "superadmin")).toBe("/admin/dashboard");
  });

  it("allows matching access", () => {
    expect(resolveRedirect("/dashboard", "customer")).toBeNull();
    expect(resolveRedirect("/admin/settings", "admin")).toBeNull();
    expect(resolveRedirect("/verify-email", undefined)).toBeNull();
  });
});

describe("safeNext", () => {
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNext("https://evil.test", "/dashboard")).toBe("/dashboard");
    expect(safeNext("//evil.test", "/dashboard")).toBe("/dashboard");
    expect(safeNext("/\\evil.test", "/dashboard")).toBe("/dashboard");
    expect(safeNext(null, "/dashboard")).toBe("/dashboard");
  });

  it("accepts relative paths", () => {
    expect(safeNext("/settings", "/dashboard")).toBe("/settings");
  });
});

describe("permission-aware navigation", () => {
  it("shows superadmin-only items only to superadmins with the permission", () => {
    const settingsItem = ADMIN_NAV.find((item) => item.label === "Settings")!;
    expect(
      canSeeNavItem(user({ role: "admin", permissions: ["manage_settings"] }), settingsItem),
    ).toBe(false);
    expect(
      canSeeNavItem(user({ role: "superadmin", permissions: ["manage_settings"] }), settingsItem),
    ).toBe(true);
  });

  it("hides items when the permission is missing", () => {
    const auditItem = ADMIN_NAV.find((item) => item.label === "Audit logs")!;
    expect(canSeeNavItem(user({ role: "admin" }), auditItem)).toBe(false);
    expect(
      canSeeNavItem(user({ role: "admin", permissions: ["view_audit_logs"] }), auditItem),
    ).toBe(true);
  });

  it("hasPermission is false without a user", () => {
    expect(hasPermission(undefined, "manage_customers")).toBe(false);
  });
});
