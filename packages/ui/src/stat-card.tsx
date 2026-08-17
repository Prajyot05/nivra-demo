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
    <div className={`rounded-lg ${box} px-3 py-2.5 text-center sm:px-4 sm:py-3`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)] sm:text-xs">
        {title}
      </div>
      <div className="mt-1 truncate text-lg font-semibold tabular-nums text-[var(--app-primary-fg)] sm:mt-1.5 sm:text-2xl">
        {formatINRCurrency(value)}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[10px] text-[var(--app-primary-fg-muted)]">{hint}</div>
      ) : null}
    </div>
  );
}
