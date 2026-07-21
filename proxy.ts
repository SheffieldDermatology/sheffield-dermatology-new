/**
 * Coarse route protection at the edge of the request: unauthenticated visits
 * to protected areas are redirected before rendering. Fine-grained checks
 * (roles, permissions, MFA, row scoping) happen server-side in layouts,
 * server actions and route handlers — this file is never the only control.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "sd_session";

const SITE_ONLY = process.env.SITE_ONLY === "1" || process.env.SITE_ONLY === "true";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lean "info + enquiry" deployment: the patient portal, staff workspace and
  // admin are not part of this launch. Send those paths home rather than
  // letting them touch the (absent) database.
  if (SITE_ONLY && /^\/(patient|staff|admin)(\/|$)/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  const isPatientArea =
    pathname.startsWith("/patient") &&
    !pathname.startsWith("/patient/sign-in") &&
    !pathname.startsWith("/patient/register") &&
    !pathname.startsWith("/patient/reset") &&
    !pathname.startsWith("/patient/verify");
  const isStaffArea = pathname.startsWith("/staff") && !pathname.startsWith("/staff/sign-in");
  const isAdminArea = pathname.startsWith("/admin");

  if ((isPatientArea || isStaffArea || isAdminArea) && !hasSessionCookie) {
    const signIn = isPatientArea ? "/patient/sign-in" : "/staff/sign-in";
    const url = request.nextUrl.clone();
    url.pathname = signIn;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/patient/:path*", "/staff/:path*", "/admin/:path*"],
};
