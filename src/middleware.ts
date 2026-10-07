import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PATHNAME_HEADER } from "@/lib/pathname-header";
import { CALCULATORS_PUBLIC } from "@/lib/public-access";

/**
 * Early hop for signed-out visitors. This is not the auth guarantee.
 * Pages, layouts, and route handlers call `requireSignedIn()` or `auth()`.
 */
const PUBLIC_PREFIXES = ["/login", "/sign-in", "/sign-up", "/api/webhooks"];
const PROTECTED_WHEN_CALCULATORS_PUBLIC = ["/admin", "/company", "/api"];
const PUBLIC_CALCULATOR_APIS = ["/api/calculate", "/api/calculators"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/api/health") return true;
  if (matchesPrefix(pathname, PUBLIC_PREFIXES)) return true;
  if (!CALCULATORS_PUBLIC) return false;
  if (matchesPrefix(pathname, PUBLIC_CALCULATOR_APIS)) return true;
  return !matchesPrefix(pathname, PROTECTED_WHEN_CALCULATORS_PUBLIC);
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname, search } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, `${pathname}${search}`);

  if (!isPublicPath(pathname)) {
    const { userId } = await auth();
    if (!userId) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const login = new URL("/login", request.url);
      login.searchParams.set("from", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
