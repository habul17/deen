import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const APP_ROUTES = ["/today", "/history", "/stats", "/settings", "/onboarding"];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

// Optimistic redirects based on cookie presence only. Real authorization happens in the API routes.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && APP_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  const expired = request.nextUrl.searchParams.has("expired");
  if (hasSession && !expired && (pathname === "/" || AUTH_ROUTES.includes(pathname))) {
    return NextResponse.redirect(new URL("/today", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/today/:path*", "/history/:path*", "/stats/:path*", "/settings/:path*", "/onboarding/:path*", "/sign-in", "/sign-up"],
};
