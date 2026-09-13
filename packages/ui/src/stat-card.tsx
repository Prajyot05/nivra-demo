import type { ReactNode } from "react";
import { formatINRCurrency } from "./format";

/**
 * Headline metric in the band directly above the results.
 *
 * There is deliberately one size: the band plays the same role on every
 * calculator, so a target goal on `/goals` and a maturity on `/growth` read at
 * the same weight. `size` is kept for call-site compatibility and no longer
 * changes the rendering.
 */
export function StatCard({
  title,
  value,
  hint,
  footer,
  variant = "primary",
}: {
  title: string;
  value: number;
  hint?: string;
  /** Extra line under the hint (e.g. Step-Up ending SIP). */
  footer?: ReactNode;
  variant?: "primary" | "soft";
  /** @deprecated the stat band is a single scale. */
  size?: "default" | "lg";
}) {
  const box =
    variant === "primary" ? "bg-[var(--app-primary)]" : "bg-[var(--app-primary-soft)]";
  return (
    <div className={`flex min-w-0 flex-col justify-center rounded-xl px-3.5 py-3 ${box}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)] sm:text-[11px]">
        {title}
      </div>
      <div className="mt-1 text-lg font-semibold leading-tight tabular-nums text-[var(--app-primary-fg)] sm:text-xl">
        {formatINRCurrency(value)}
      </div>
      {hint ? (
        <div className="mt-1 text-[11px] leading-snug text-[var(--app-primary-fg-muted)]">
          {hint}
        </div>
      ) : null}
      {footer ? (
        <div className="mt-1.5 border-t border-[var(--app-primary-fg)]/15 pt-1.5 text-[11px] leading-snug text-[var(--app-primary-fg-muted)]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
