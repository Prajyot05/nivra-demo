"use client";

import { cn } from "@/lib/utils";

/**
 * Wealthsimple / Mercury pattern: quiet notes card under results, then a soft legal line.
 * Not a collapsible WealthSection.
 */
export function WealthDisclaimer({
  title = "Important notes",
  notes,
  children,
  className,
}: {
  title?: string;
  /** Advisor-facing caveats shown in the card. */
  notes?: React.ReactNode[];
  /** Legal / illustration disclaimer under the card. */
  children?: React.ReactNode;
  className?: string;
}) {
  const hasNotes = notes != null && notes.length > 0;

  return (
    <aside className={cn("space-y-3", className)}>
      {hasNotes ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {title}
          </div>
          <ol
            className={cn(
              "mt-3.5 grid gap-3",
              notes.length > 1 ? "sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3.5" : undefined,
            )}
          >
            {notes.map((note, i) => (
              <li
                key={i}
                className="flex gap-3 text-[13px] leading-[18px] text-slate-600"
              >
                <span
                  className="mt-px shrink-0 font-mono text-[11px] font-medium tabular-nums text-emerald-700/80"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {children ? (
        <p
          className={cn(
            "text-[12px] leading-[1.55] text-slate-400",
            hasNotes
              ? "px-0.5"
              : "rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-3.5 text-slate-500",
          )}
        >
          {children}
        </p>
      ) : null}
    </aside>
  );
}
