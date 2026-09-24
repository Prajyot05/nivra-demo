"use client";

import { SignIn } from "@clerk/nextjs";

export function LoginForm() {
  return (
    <div className="flex justify-center">
      <SignIn
        routing="hash"
        signUpUrl="/login"
        fallbackRedirectUrl="/"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-0 w-full",
          },
        }}
      />
    </div>
  );
}
