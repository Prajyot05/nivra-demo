"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/** Legacy nav filter: platform admins see all tools; company users see completed suite. */
export type AuthProfileId = "dev" | "client";

export type AuthSession = {
  profileId: AuthProfileId | null;
  name: string | null;
  email: string | null;
  role: string | null;
  loading: boolean;
};

type Profile = Omit<AuthSession, "loading">;

const SIGNED_OUT: Profile = { profileId: null, name: null, email: null, role: null };

/** One /api/auth/me request per signed-in user per tab, shared by every shell. */
let cached: { userId: string; promise: Promise<Profile>; value?: Profile } | null = null;

function loadProfile(userId: string): Promise<Profile> {
  if (cached?.userId === userId) return cached.promise;
  const entry: NonNullable<typeof cached> = {
    userId,
    promise: fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          profileId?: AuthProfileId;
          name?: string;
          email?: string;
          role?: string;
        };
      })
      .then(
        (body): Profile => ({
          profileId: body?.profileId ?? "client",
          name: body?.name ?? null,
          email: body?.email ?? null,
          role: body?.role ?? null,
        }),
      )
      .catch((): Profile => {
        if (cached === entry) cached = null;
        return { ...SIGNED_OUT, profileId: "client" };
      }),
  };
  entry.promise.then((value) => {
    entry.value = value;
  });
  cached = entry;
  return entry.promise;
}

/**
 * Current login for nav filtering and admin chrome (name + email).
 */
export function useAuthProfile(): AuthSession {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const warm = userId && cached?.userId === userId ? cached.value : undefined;
  const [profile, setProfile] = useState<Profile>(warm ?? SIGNED_OUT);
  const [loading, setLoading] = useState(!warm);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      cached = null;
      setProfile(SIGNED_OUT);
      setLoading(false);
      return;
    }

    let cancelled = false;
    loadProfile(userId).then((value) => {
      if (cancelled) return;
      setProfile(value);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  return { ...profile, loading };
}

export function useSignOut() {
  const { signOut } = useClerk();
  return () => {
    cached = null;
    return signOut({ redirectUrl: "/login" });
  };
}
