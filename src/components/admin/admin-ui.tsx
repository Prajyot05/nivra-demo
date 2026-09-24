import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page title — Acctual / Stripe: bold title, quiet description, right actions. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** @deprecated unused — kept for call-site compatibility */
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="admin-page-title text-[1.5rem] font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-[13px] leading-relaxed text-[var(--admin-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * Fingerprint-style status / KPI strip — hairline dividers, no card chrome.
 */
export function StatStrip({
  items,
  className,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    tone?: "neutral" | "positive" | "warn";
  }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-0 overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col gap-1 px-4 py-3.5",
            i > 0 && "border-t border-[var(--admin-line)] sm:border-t-0",
            i % 2 === 1 && "sm:border-l",
            i >= 2 && "lg:border-l",
          )}
        >
          <p className="text-[11px] font-medium text-[var(--admin-faint)]">
            {item.label}
          </p>
          <p
            className={cn(
              "text-[1.25rem] font-semibold tabular-nums tracking-tight",
              item.tone === "positive" && "text-[var(--admin-brand)]",
              item.tone === "warn" && "text-amber-700",
              !item.tone || item.tone === "neutral"
                ? "text-[var(--admin-ink)]"
                : undefined,
            )}
          >
            {item.value}
          </p>
          {item.hint ? (
            <div className="text-[12px] text-[var(--admin-muted)]">{item.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Legacy tile — maps to strip cell look when used alone. Prefer StatStrip. */
export function StatTile({
  label,
  value,
  hint,
  className,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ElementType;
  className?: string;
  tone?: "neutral" | "positive" | "warn";
}) {
  return (
    <div
      className={cn(
        "admin-stat rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] px-4 py-3.5",
        className,
      )}
    >
      <p className="text-[11px] font-medium text-[var(--admin-faint)]">{label}</p>
      <p
        className={cn(
          "mt-1 text-[1.25rem] font-semibold tabular-nums tracking-tight",
          tone === "positive" && "text-[var(--admin-brand)]",
          tone === "warn" && "text-amber-700",
          tone === "neutral" && "text-[var(--admin-ink)]",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[12px] text-[var(--admin-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

/** Section block — title + optional actions, then content. No nested white card. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  flush,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("admin-card space-y-4", className)}>
      {title ? (
        <div className="admin-panel-head flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--admin-ink)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div
        className={cn(
          flush
            ? "overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)]"
            : undefined,
        )}
      >
        {flush ? children : children}
      </div>
    </section>
  );
}

/** Identity / tenant header row inside the sheet. */
export function AdminIdentityCard({
  mark,
  title,
  meta,
  badges,
  className,
}: {
  mark: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-[var(--admin-line)] pb-6 sm:flex-row sm:items-center",
        className,
      )}
    >
      {mark}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-[var(--admin-ink)]">
            {title}
          </h2>
          {badges}
        </div>
        {meta ? (
          <div className="text-[13px] text-[var(--admin-muted)]">{meta}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Acctual-style status tabs with counts. */
export function FilterTabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: Array<{ id: T; label: string; count?: number }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-[var(--admin-line)]">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative -mb-px flex items-center gap-1.5 pb-2.5 text-[13px] transition-colors",
              active
                ? "font-medium text-[var(--admin-ink)]"
                : "font-normal text-[var(--admin-faint)] hover:text-[var(--admin-muted)]",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-medium tabular-nums",
                  active
                    ? "bg-[var(--admin-ink)] text-white"
                    : "bg-[var(--admin-soft)] text-[var(--admin-muted)]",
                )}
              >
                {tab.count}
              </span>
            ) : null}
            {active ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--admin-ink)]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Lovable / Copy.ai style pagination footer for large tables (500–1000+ rows). */
export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--admin-line)] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-[var(--admin-muted)]">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing{" "}
            <span className="font-medium tabular-nums text-[var(--admin-ink)]">
              {from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")}
            </span>{" "}
            of{" "}
            <span className="font-medium tabular-nums text-[var(--admin-ink)]">
              {total.toLocaleString("en-IN")}
            </span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--admin-muted)]">
            Rows
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-md border border-[var(--admin-line)] bg-white px-1.5 text-[12px] text-[var(--admin-ink)] outline-none"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex h-7 items-center rounded-md border border-[var(--admin-line)] px-2 text-[12px] text-[var(--admin-ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-1.5 text-[12px] tabular-nums text-[var(--admin-muted)]">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex h-7 items-center rounded-md border border-[var(--admin-line)] px-2 text-[12px] text-[var(--admin-ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
