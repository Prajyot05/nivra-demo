import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Use your work email. Your company admin will add you to your workspace."
      switchPrompt="Already have an account?"
      switchLabel="Sign in"
      switchHref="/login"
    >
      <SignupForm />
    </AuthShell>
  );
}
