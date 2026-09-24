"use client";

import { cn } from "@/lib/utils";

/** Shared content width for wealth-styled calculator pages. */
export const WEALTH_CONTENT_CLASS =
  "mx-auto flex w-full max-w-[94rem] flex-col gap-5 sm:gap-6";

/** Soft status / validation note used inside wealth pages. */
export function WealthStatusNote({
  tone = "error",
  children,
  className,
}: {
  tone?: "error" | "info" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    error: "border-rose-200 bg-rose-50/80 text-rose-800",
    info: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50/80 text-emerald-800",
  } as const;
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
