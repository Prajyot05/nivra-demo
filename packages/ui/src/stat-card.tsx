import { formatINRCurrency } from "./format";

export function StatCard({
  title,
  value,
  hint,
  variant = "primary",
}: {
  title: string;
  value: number;
  hint?: string;
  variant?: "primary" | "soft";
}) {
  const box =
    variant === "primary"
      ? "bg-[var(--app-primary)]"
      : "bg-[var(--app-primary-soft)]";
  return (
    <div className={`rounded-lg ${box} px-2.5 py-2 text-center sm:px-3 sm:py-2.5`}>
      <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)] sm:text-[10px]">
        {title}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[var(--app-primary-fg)] sm:mt-1 sm:text-base">
        {formatINRCurrency(value)}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[10px] text-[var(--app-primary-fg-muted)]">{hint}</div>
      ) : null}
    </div>
  );
}
