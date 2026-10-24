import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirect } from "@/lib/access";
import { ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/session";

/**
 * Coarse route protection based on session cookies. This only improves UX; every API call
 * is still authenticated and authorized by Laravel.
 */
export function middleware(request: NextRequest): NextResponse {
  const hasToken = request.cookies.has(TOKEN_COOKIE);
  const role = hasToken ? request.cookies.get(ROLE_COOKIE)?.value : undefined;

  const redirectTo = resolveRedirect(request.nextUrl.pathname, role);
  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
