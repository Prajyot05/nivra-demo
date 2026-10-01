"use client";

import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "@/components/auth/clerk-appearance";

export function LoginForm() {
  return (
    <SignIn
      routing="path"
      path="/login"
      signUpUrl="/sign-up"
      forceRedirectUrl="/"
      signUpForceRedirectUrl="/"
      appearance={authAppearance}
    />
  );
}
