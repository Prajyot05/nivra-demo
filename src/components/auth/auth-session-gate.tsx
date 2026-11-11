"use client";

import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { DEFAULT_APP_HOME } from "@/lib/route-flags";
import { safeAppPath } from "@/lib/safe-app-path";

/**
 * On auth pages: hide sign-in UI while Clerk loads; send signed-in users away
 * with a full-page loader (full navigation so session cookies apply).
 */
export function AuthSessionGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => safeAppPath(searchParams.get("from"), DEFAULT_APP_HOME),
    [searchParams],
  );

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.replace(redirectTo);
    }
  }, [isLoaded, isSignedIn, redirectTo]);

  if (!isLoaded) {
    return <AuthLoadingScreen phase="checking" />;
  }

  if (isSignedIn) {
    return <AuthLoadingScreen phase="redirecting" />;
  }

  return <>{children}</>;
}
