import type { AuthUser } from "@/types/user";
import { get, send } from "./api-client";
import type { LoginInput, RegisterInput, ResetPasswordInput } from "@/validations/auth";

export type Portal = "customer" | "admin";

interface AuthPayload {
  user: AuthUser;
}

/** Returned by login instead of a session when the account uses two-factor authentication. */
export interface TwoFactorRequired {
  two_factor_required: true;
  challenge: string;
}

export type LoginResult = AuthPayload | TwoFactorRequired;

export function needsTwoFactor(result: LoginResult): result is TwoFactorRequired {
  return "two_factor_required" in result && result.two_factor_required;
}

export const authService = {
  me: () => get<AuthUser>("/auth/me"),

  login: (portal: Portal, input: LoginInput) =>
    send<LoginResult>("post", `/auth/${portal}/login`, input),

  twoFactorChallenge: (input: { challenge: string; code?: string; recovery_code?: string }) =>
    send<AuthPayload>("post", "/auth/two-factor-challenge", input),

  register: (input: RegisterInput) => send<AuthPayload>("post", "/auth/customer/register", input),

  logout: () => send<null>("post", "/auth/logout"),

  forgotPassword: (email: string) => send<null>("post", "/auth/forgot-password", { email }),

  resetPassword: (input: ResetPasswordInput & { token: string }) =>
    send<null>("post", "/auth/reset-password", input),

  /** `path` is the signed API path from the email link, e.g. /api/v1/auth/email/verify/... */
  verifyEmail: (path: string) => get<null>(path.replace(/^\/api\/v1/, "")),

  resendVerification: () => send<null>("post", "/auth/email/verification-notification"),
};
