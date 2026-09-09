import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="admin-page-title text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ElementType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-stat flex flex-col justify-between border border-border bg-card p-5 transition-all",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <p
          className="text-[11px] font-semibold uppercase text-muted-foreground"
          style={{ letterSpacing: "var(--admin-label-tracking)" }}
        >
          {label}
        </p>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground/60" /> : null}
      </div>
      <div className="mt-3">
        <p className="admin-stat-value text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("admin-card border border-border bg-card", className)}>
      {title ? (
        <div className="admin-panel-head flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
