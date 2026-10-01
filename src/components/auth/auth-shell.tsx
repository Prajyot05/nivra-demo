import Link from "next/link";
import type { ReactNode } from "react";
import { NivraMark } from "@/components/admin/branding";
import { SignedInRedirect } from "@/components/auth/signed-in-redirect";

type AuthShellProps = {
  title: string;
  description: string;
  switchPrompt: string;
  switchLabel: string;
  switchHref: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  switchPrompt,
  switchLabel,
  switchHref,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white px-5 py-6 text-[#0a0a0a] sm:px-10">
      <SignedInRedirect />
      <header className="flex items-center justify-between gap-4">
        <Link href="/" prefetch={false} aria-label="Nivra home">
          <NivraMark />
        </Link>
        <p className="text-[13px] text-[#737373]">
          <span className="hidden sm:inline">{switchPrompt} </span>
          <Link
            href={switchHref}
            className="font-medium text-[#0a0a0a] underline-offset-4 hover:underline"
          >
            {switchLabel}
          </Link>
        </p>
      </header>

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full min-w-0 max-w-[24rem]">
          <h1 className="text-center text-[26px] font-semibold leading-tight tracking-[-0.02em] text-balance">
            {title}
          </h1>
          <p className="mt-2 text-center text-[14px] leading-6 text-[#737373] text-balance">
            {description}
          </p>
          <div className="nivra-auth mt-8">{children}</div>
          <p className="mt-8 text-center text-[13px] text-[#737373]">
            {switchPrompt}{" "}
            <Link
              href={switchHref}
              className="font-medium text-[#0a0a0a] underline-offset-4 hover:underline"
            >
              {switchLabel}
            </Link>
          </p>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#a3a3a3]">
        <span>© {new Date().getFullYear()} Nivra Fintech</span>
        <span>
          Powered by <span className="font-medium text-[#737373]">Nivra</span>
        </span>
      </footer>
    </div>
  );
}
