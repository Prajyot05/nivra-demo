"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/** Legacy nav filter: platform admins see all tools; company users see completed suite. */
export type AuthProfileId = "dev" | "client";

/**
 * Current login profile for nav filtering.
 * Maps Clerk + Neon role → legacy "dev" | "client" nav profile.
 */
export function useAuthProfile(): {
  profileId: AuthProfileId | null;
  loading: boolean;
} {
  const { isLoaded, isSignedIn } = useAuth();
  const [profileId, setProfileId] = useState<AuthProfileId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setProfileId(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        const body = (await res.json()) as { profileId?: AuthProfileId };
        return body.profileId ?? null;
      })
      .then((id) => {
        if (!cancelled) setProfileId(id);
      })
      .catch(() => {
        if (!cancelled) setProfileId("client");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return { profileId, loading };
}

export function useSignOut() {
  const { signOut } = useClerk();
  return () => signOut({ redirectUrl: "/login" });
}
