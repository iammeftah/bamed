import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { mocksEnabled } from "@/lib/config";

/**
 * First gate for the back office: no cookie, no page.
 * It only checks the cookie exists. The real check is the backend, on the
 * dashboard layout and on every API call.
 */
export function proxy(request: NextRequest) {
  // Demo mode (no backend) has no server session, so the gate is skipped in dev
  if (mocksEnabled && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    const { pathname, search } = request.nextUrl;
    const url = request.nextUrl.clone();
    url.pathname = "/admin/auth";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};