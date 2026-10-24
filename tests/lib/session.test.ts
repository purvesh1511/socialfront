import { describe, expect, it } from "vitest";
import { endsSession, issuesToken } from "@/lib/session";

describe("session path helpers", () => {
  it("detects token-issuing endpoints", () => {
    expect(issuesToken("v1/auth/customer/login", "POST")).toBe(true);
    expect(issuesToken("v1/auth/customer/register", "POST")).toBe(true);
    expect(issuesToken("v1/auth/admin/login", "POST")).toBe(true);
    expect(issuesToken("v1/auth/two-factor-challenge", "POST")).toBe(true);
    expect(issuesToken("v1/auth/admin/login", "GET")).toBe(false);
    expect(issuesToken("v1/auth/me", "POST")).toBe(false);
  });

  it("detects logout", () => {
    expect(endsSession("v1/auth/logout", "POST")).toBe(true);
    expect(endsSession("v1/auth/me", "GET")).toBe(false);
  });
});
