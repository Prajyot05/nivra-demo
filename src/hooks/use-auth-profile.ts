"use client";

import { useEffect, useState } from "react";
import type { AuthProfileId } from "@/lib/auth";

/**
 * Current login profile for nav filtering. Defaults to `dev` until /api/auth/me resolves
 * so SSR and first paint stay dense for the engineering team.
 */
export function useAuthProfile(): {
  profileId: AuthProfileId | null;
  loading: boolean;
} {
  const [profileId, setProfileId] = useState<AuthProfileId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled) setProfileId(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { profileId, loading };
}
