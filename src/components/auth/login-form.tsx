"use client";

import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "@/components/auth/clerk-appearance";
import { DEFAULT_APP_HOME } from "@/lib/route-flags";

export function LoginForm() {
  return (
    <SignIn
      routing="path"
      path="/login"
      signUpUrl="/sign-up"
      forceRedirectUrl={DEFAULT_APP_HOME}
      signUpForceRedirectUrl={DEFAULT_APP_HOME}
      appearance={authAppearance}
    />
  );
}
