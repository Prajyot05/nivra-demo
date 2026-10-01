import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeRedirect } from "@/components/auth/clerk-appearance";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from } = await searchParams;
  return (
    <AuthShell
      title="Sign in to Nivra"
      description="Welcome back. Sign in to continue to your workspace."
      switchPrompt="New to Nivra?"
      switchLabel="Create an account"
      switchHref="/sign-up"
    >
      <LoginForm redirectUrl={safeRedirect(from)} />
    </AuthShell>
  );
}
