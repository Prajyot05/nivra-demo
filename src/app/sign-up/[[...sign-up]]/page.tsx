import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeRedirect } from "@/components/auth/clerk-appearance";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from } = await searchParams;
  return (
    <AuthShell
      title="Create your account"
      description="Use your work email. Your company admin will add you to your workspace."
      switchPrompt="Already have an account?"
      switchLabel="Sign in"
      switchHref="/login"
    >
      <SignupForm redirectUrl={safeRedirect(from)} />
    </AuthShell>
  );
}
