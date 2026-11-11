const AUTH_PREFIXES = ["/login", "/sign-in", "/sign-up", "/signed-out"];

/**
 * Same-origin app path for post-login redirects. Rejects open redirects and auth loops.
 */
export function safeAppPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (AUTH_PREFIXES.some((p) => value === p || value.startsWith(`${p}/`))) {
    return fallback;
  }
  return value;
}
