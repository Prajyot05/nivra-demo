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

/**
 * Current login for nav filtering and admin chrome (name + email).
 */
export function useAuthProfile(): AuthSession {
  const { isLoaded, isSignedIn } = useAuth();
  const [profileId, setProfileId] = useState<AuthProfileId | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setProfileId(null);
      setName(null);
      setEmail(null);
      setRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          profileId?: AuthProfileId;
          name?: string;
          email?: string;
          role?: string;
        };
      })
      .then((body) => {
        if (cancelled) return;
        setProfileId(body?.profileId ?? "client");
        setName(body?.name ?? null);
        setEmail(body?.email ?? null);
        setRole(body?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setProfileId("client");
          setName(null);
          setEmail(null);
          setRole(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return { profileId, name, email, role, loading };
}

export function useSignOut() {
  const { signOut } = useClerk();
  return () => signOut({ redirectUrl: "/login" });
}
