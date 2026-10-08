"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

/** Drops the revoked session cookie so /login does not bounce back into the app. */
export function ClearStaleSession() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    if (isLoaded && isSignedIn) void signOut();
  }, [isLoaded, isSignedIn, signOut]);

  return null;
}
