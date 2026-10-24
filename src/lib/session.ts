/** Cookie names shared by the BFF proxy (route handler) and middleware. */
export const TOKEN_COOKIE = "ss_token";
export const ROLE_COOKIE = "ss_role";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** API paths (relative to /api) that return a freshly issued token. */
const TOKEN_ISSUING_PATHS = new Set([
  "v1/auth/customer/login",
  "v1/auth/customer/register",
  "v1/auth/admin/login",
  "v1/auth/two-factor-challenge",
]);

export function issuesToken(path: string, method: string): boolean {
  return method === "POST" && TOKEN_ISSUING_PATHS.has(path);
}

export function endsSession(path: string, method: string): boolean {
  return method === "POST" && path === "v1/auth/logout";
}
