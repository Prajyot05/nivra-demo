"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CALCULATOR_ROUTES,
  getFirstEnabledRoute,
  isCalculatorAccessAllowed,
} from "@/lib/calculator-nav";
import type { AuthProfileId } from "@/lib/auth";

function resolvePostLoginDestination(
  from: string | null,
  profileId: AuthProfileId,
): string {
  const fallback = getFirstEnabledRoute(profileId);
  if (!from || from === "/login") return fallback;

  try {
    const url = new URL(from, "http://local");
    const path = url.pathname;
    const mode = url.searchParams.get("mode");
    const isCalc = CALCULATOR_ROUTES.includes(
      path as (typeof CALCULATOR_ROUTES)[number],
    );
    if (isCalc && !isCalculatorAccessAllowed(path, mode, profileId)) {
      return fallback;
    }
    return `${path}${url.search}`;
  } catch {
    return fallback;
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Invalid username or password");
        return;
      }

      const body = (await res.json()) as { profileId?: AuthProfileId };
      const profileId = body.profileId ?? "dev";
      const destination = resolvePostLoginDestination(
        searchParams.get("from"),
        profileId,
      );
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
