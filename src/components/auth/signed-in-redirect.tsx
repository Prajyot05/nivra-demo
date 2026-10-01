"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

/**
 * Full page load (not router.push) so the request carries the fresh session
 * cookie instead of a route prefetched while signed out.
 */
export function SignedInRedirect({ to = "/" }: { to?: string }) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.replace(to);
  }, [isLoaded, isSignedIn, to]);

  return null;
}
