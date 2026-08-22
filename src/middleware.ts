import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import {
  CALCULATOR_ROUTES,
  getFirstEnabledRoute,
  isCalculatorEnabled,
} from "@/lib/calculator-nav";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isCalculatorRoute(pathname: string): boolean {
  return CALCULATOR_ROUTES.includes(pathname as (typeof CALCULATOR_ROUTES)[number]);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const profileId = await verifySessionToken(sessionToken);

  if (isPublicPath(pathname)) {
    if (profileId && pathname === "/login") {
      return NextResponse.redirect(new URL(getFirstEnabledRoute(), request.url));
    }
    return NextResponse.next();
  }

  if (!profileId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isCalculatorRoute(pathname) && !isCalculatorEnabled(pathname)) {
    return NextResponse.redirect(new URL(getFirstEnabledRoute(), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
