"use client";

import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/components/auth/clerk-appearance";
import { DEFAULT_APP_HOME } from "@/lib/route-flags";

export function SignupForm() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/login"
      forceRedirectUrl={DEFAULT_APP_HOME}
      signInForceRedirectUrl={DEFAULT_APP_HOME}
      appearance={authAppearance}
    />
  );
}
