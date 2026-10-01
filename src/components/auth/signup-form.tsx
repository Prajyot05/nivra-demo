"use client";

import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/components/auth/clerk-appearance";

export function SignupForm() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/login"
      forceRedirectUrl="/"
      signInForceRedirectUrl="/"
      appearance={authAppearance}
    />
  );
}
