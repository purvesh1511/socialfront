import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/validations/auth";

describe("auth validation", () => {
  it("requires a valid email and password for login", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["email", "password"]);
  });

  it("requires matching password confirmation on register", () => {
    const result = registerSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      password: "secret-123",
      password_confirmation: "different",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["password_confirmation"]);
  });

  it("accepts a valid registration", () => {
    expect(
      registerSchema.safeParse({
        name: "Jane",
        email: "jane@example.com",
        password: "secret-123",
        password_confirmation: "secret-123",
      }).success,
    ).toBe(true);
  });
});
