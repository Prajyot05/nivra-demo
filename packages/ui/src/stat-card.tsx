import { formatINRCurrency } from "./format";

export function StatCard({
  title,
  value,
  hint,
  variant = "primary",
  size = "default",
}: {
  title: string;
  value: number;
  hint?: string;
  variant?: "primary" | "soft";
  size?: "default" | "lg";
}) {
  const box =
    variant === "primary"
      ? "bg-[var(--app-primary)]"
      : "bg-[var(--app-primary-soft)]";
  const isLg = size === "lg";
  return (
    <div
      className={`rounded-lg text-center ${box} ${
        isLg ? "px-3 py-3 sm:px-4 sm:py-3.5" : "px-2.5 py-2 sm:px-3 sm:py-2.5"
      }`}
    >
      <div
        className={`font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)] ${
          isLg ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px]"
        }`}
      >
        {title}
      </div>
      <div
        className={`truncate font-semibold tabular-nums text-[var(--app-primary-fg)] ${
          isLg
            ? "mt-1 text-lg sm:mt-1.5 sm:text-xl"
            : "mt-0.5 text-sm sm:mt-1 sm:text-base"
        }`}
      >
        {formatINRCurrency(value)}
      </div>
      {hint ? (
        <div
          className={`mt-0.5 text-[var(--app-primary-fg-muted)] ${
            isLg ? "text-[11px]" : "text-[10px]"
          }`}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
