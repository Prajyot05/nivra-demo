import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { PATHNAME_HEADER } from "@/lib/pathname-header";

/**
 * Signed-in gate for Server Components (pages and layouts).
 * Signed-out visitors go to /login and come back to the same path.
 */
export async function requireSignedIn() {
  const headerStore = await headers();
  const from = safeAppPath(headerStore.get(PATHNAME_HEADER));
  return auth.protect({
    unauthenticatedUrl: `/login?from=${encodeURIComponent(from)}`,
  });
}

function safeAppPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}
