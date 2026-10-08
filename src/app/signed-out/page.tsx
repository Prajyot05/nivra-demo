import type { Metadata } from "next";
import Link from "next/link";
import { NivraMark } from "@/components/admin/branding";
import { ClearStaleSession } from "@/components/auth/clear-stale-session";

export const metadata: Metadata = {
  title: "Signed out",
};

export default function SignedOutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white px-5 py-6 text-[#0a0a0a] sm:px-10">
      <ClearStaleSession />
      <header>
        <Link href="/login" prefetch={false} aria-label="Nivra sign in">
          <NivraMark />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-[24rem] text-center">
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-balance">
            You were signed out
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[#737373] text-balance">
            This account signed in on another device. Only one active session is allowed per
            account.
          </p>
          <Link
            href="/login"
            prefetch={false}
            className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-[#0a0a0a] px-5 text-[14px] font-medium text-white"
          >
            Sign in again
          </Link>
        </div>
      </main>
      <footer className="text-right text-[12px] text-[#a3a3a3]">
        Powered by <span className="font-medium text-[#737373]">Nivra</span>
      </footer>
    </div>
  );
}
