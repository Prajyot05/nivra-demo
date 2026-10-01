"use client";

import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/components/auth/clerk-appearance";

export function SignupForm({ redirectUrl }: { redirectUrl: string }) {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/login"
      fallbackRedirectUrl={redirectUrl}
      appearance={authAppearance}
    />
  );
}
