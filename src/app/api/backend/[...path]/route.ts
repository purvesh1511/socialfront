import { NextResponse, type NextRequest } from "next/server";
import {
  ROLE_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  TOKEN_COOKIE,
  endsSession,
  issuesToken,
} from "@/lib/session";

/**
 * Backend-for-frontend proxy: forwards /api/backend/<path> to <BACKEND_URL>/api/<path>.
 *
 * - Attaches the Sanctum token from an httpOnly cookie, so the token never reaches browser JS.
 * - On login/register/2FA challenge, moves the token from the response body into the cookie.
 * - On logout or a 401, clears the session cookies.
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? "https://socialapi.whitefirms.org/public").replace(
  /\/$/,
  "",
);
const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "user-agent",
  "accept-language",
  "x-request-id",
];

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path: segments } = await context.params;

  if (!segments.every((segment) => SAFE_SEGMENT.test(segment) && segment !== "..")) {
    return NextResponse.json(
      { success: false, message: "Invalid path.", data: null },
      { status: 400 },
    );
  }

  const path = segments.join("/");
  const method = request.method.toUpperCase();
  const target = `${BACKEND_URL}/api/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("accept", "application/json");

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "The API is unavailable. Please try again shortly.", data: null },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const requestId = upstream.headers.get("x-request-id");

  if (issuesToken(path, method) && upstream.ok) {
    const body = (await upstream.json()) as {
      data: { token?: string; token_type?: string; user?: { role: string } } | null;
    };

    // Accounts with two-factor authentication get a challenge instead of a token.
    if (!body.data?.token || !body.data.user) {
      return NextResponse.json(body, { status: upstream.status });
    }

    const { token: issued, user } = body.data;
    const response = NextResponse.json({ ...body, data: { user } }, { status: upstream.status });
    setSession(response, issued, user.role);
    return response;
  }

  const response = new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: { "content-type": contentType, ...(requestId ? { "x-request-id": requestId } : {}) },
  });

  for (const name of ["retry-after", "content-disposition", "content-length"]) {
    const value = upstream.headers.get(name);
    if (value) response.headers.set(name, value);
  }

  if (endsSession(path, method) || upstream.status === 401) {
    clearSession(response);
  }

  return response;
}

function setSession(response: NextResponse, token: string, role: string): void {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
  response.cookies.set(TOKEN_COOKIE, token, options);
  response.cookies.set(ROLE_COOKIE, role, options);
}

function clearSession(response: NextResponse): void {
  response.cookies.delete(TOKEN_COOKIE);
  response.cookies.delete(ROLE_COOKIE);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
