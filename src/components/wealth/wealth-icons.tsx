"use client";

import { cn } from "@/lib/utils";

/** Custom thin geometric marks — linear / angular, no circular tiles. Not Lucide. */
type IconProps = { className?: string; strokeWidth?: number };

const base = "h-4 w-4 shrink-0";

export function IconPerson({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M8.5 8.25a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M5.5 19.25c.9-3.2 3.2-4.75 6.5-4.75s5.6 1.55 6.5 4.75"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Goal / corpus — mountain peak.
 * Locked to Monarch Money Goals nav language (Refero: /objectives, dashboard Goals).
 * Avoids bullseye, flag, diamond, and focus-frame metaphors.
 */
export function IconTarget({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M3.5 18.5 9 9.5l3.2 4.2L15.5 7.5 20.5 18.5H3.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M12.2 13.7 15.5 7.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSip({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M4.5 8.5h11.5l-2.5-2.5M19.5 15.5H8l2.5 2.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 8.5v2.5c0 1.5 1.2 3 3.5 3h4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M19.5 15.5v-2.5c0-1.5-1.2-3-3.5-3h-4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconStepUp({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M4.5 17h4v-4h4V9h4V5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 5H19.5V10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChart({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M5 19V10M10.5 19V6M16 19v-7M21 19V9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDonut({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M12 4.5a7.5 7.5 0 1 1-6.5 3.75"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path d="M12 4.5V12l5 3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTimeline({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M4 16c2.5-5.5 5-8 8-8s5.5 2.5 8 8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path d="M12 8v0" stroke="currentColor" strokeWidth={strokeWidth + 1.5} strokeLinecap="round" />
      <path d="M4 16h16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.35} />
    </svg>
  );
}

export function IconTax({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M7 4.5h10v15H7z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M9.5 9h5M9.5 12.5h5M9.5 16h3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconInflation({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M4.5 16.5 9 10l3.5 4 7-9.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 5h3.5v3.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDelay({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M5.5 6.5h13v12h-13z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M9 4.5v4M15 4.5v4M5.5 10.5h13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 13v3.5l2.5 1.25" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCalendar({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M5 7.5h14v12H5z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M8.5 4.5v4M15.5 4.5v4M5 11h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M8.5 14.5h2M13.5 14.5h2M8.5 17.5h2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconRates({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path d="M5 7.5h14M5 12h10M5 16.5h7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M17 10.5v3M15.5 12h3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconRefresh({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M19 12a7 7 0 1 1-2-4.9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M19 4.5V9h-4.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMail({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="m5.5 8.5 6.5 4.5 6.5-4.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPhone({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M8 4.5h3.2l1.3 3.2-1.8 1.2a10 10 0 0 0 4.4 4.4l1.2-1.8 3.2 1.3V16a2 2 0 0 1-2 2A12.5 12.5 0 0 1 5.5 6.5a2 2 0 0 1 2.5-2Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSearch({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path d="M10.5 5.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="m15.5 15.5 3.5 3.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconAlert({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M12 5 20 18.5H4L12 5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M12 10.5v4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 16.75v.5" stroke="currentColor" strokeWidth={strokeWidth + 1} strokeLinecap="round" />
    </svg>
  );
}

export function IconEdit({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="m14 6 4 4M6 18l1-4.5L15.5 5a1.5 1.5 0 0 1 2.1 0L19 6.4a1.5 1.5 0 0 1 0 2.1L10.5 17 6 18Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevron({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBook({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M5 5.5h6.5v13H5.75A.75.75 0 0 1 5 17.75V5.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M19 5.5h-6.5v13H18.25a.75.75 0 0 0 .75-.75V5.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M11.5 5.5v13" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconGrad({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="M3.5 9.5 12 5.5l8.5 4L12 13.5 3.5 9.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M7 11.5v4.5c0 1.5 2.2 2.75 5 2.75s5-1.25 5-2.75v-4.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20.5 9.5v5.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path
        d="m5.5 12.5 4.5 4.5 8.5-9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFlag({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} aria-hidden>
      <path d="M6 4.5v15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path
        d="M6 5.5h10.5l-2 3.25 2 3.25H6"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Minimal icon slot — thin square frame (not filled circular tiles).
 * Matches Mercury/Compound quiet mark language.
 */
export function WealthIconMark({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: "slate" | "emerald" | "amber";
  className?: string;
}) {
  const tones = {
    slate: "border-slate-200 text-slate-500",
    emerald: "border-emerald-200 text-emerald-700",
    amber: "border-amber-200 text-amber-700",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md border bg-white",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
