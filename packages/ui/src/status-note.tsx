import type { ReactNode } from "react";

export type StatusTone = "error" | "warn" | "info" | "pending";

/**
 * One treatment for every "we can't calculate yet" / "some rows are skipped"
 * message. Pages used to mix bare paragraphs with a hardcoded `bg-red-50`
 * banner, which also ignored the active color theme.
 */
const TONE: Record<StatusTone, string> = {
  error:
    "border-[var(--app-danger)]/35 bg-[var(--app-danger)]/8 text-[var(--app-danger)]",
  warn: "border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] text-[var(--app-warn-text)]",
  info: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]",
  pending: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]",
};

export function StatusNote({
  tone = "info",
  children,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      aria-live={tone === "pending" ? "polite" : undefined}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] leading-snug ${TONE[tone]} ${className ?? ""}`}
    >
      {tone === "pending" ? (
        <span
          className="size-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
