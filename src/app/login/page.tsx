import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NivraMark, PoweredByNivra } from "@/components/admin/branding";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <NivraMark />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Sign in with Clerk</p>
        </div>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-md bg-muted" />}>
          <LoginForm />
        </Suspense>
        <div className="mt-6 space-y-2 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p>Demo dashboards (after sign-in)</p>
          <div className="flex justify-center gap-3">
            <Link href="/admin" className="underline-offset-4 hover:underline">
              Nivra admin
            </Link>
            <Link href="/company" className="underline-offset-4 hover:underline">
              Company admin
            </Link>
          </div>
        </div>
      </div>
      <PoweredByNivra className="mt-6" />
    </div>
  );
}
