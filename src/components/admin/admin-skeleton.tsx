import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("admin-bone rounded-[4px]", className)} style={style} />;
}

function SkeletonRoot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-8">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2.5">
        <Bone className="h-7 w-48 sm:h-8" />
        <Bone className="h-3.5 w-80 max-w-full" />
      </div>
      {action ? <Bone className="h-8 w-28" /> : null}
    </div>
  );
}

function PanelHeadSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Bone className={cn("h-4", wide ? "w-40" : "w-32")} />
      <Bone className={cn("h-3", wide ? "w-60" : "w-48")} />
    </div>
  );
}

function StatsSkeleton({ count = 4 }: { count?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] sm:grid-cols-2",
        count === 4 && "lg:grid-cols-4",
        count === 3 && "sm:grid-cols-3",
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            "space-y-2.5 px-4 py-3.5",
            i > 0 && "border-t border-[var(--admin-line)] sm:border-t-0",
            i % 2 === 1 && "sm:border-l",
            i >= 2 && count === 4 && "lg:border-l",
            i === 2 && count === 3 && "sm:border-l",
          )}
        >
          <Bone className="h-2.5 w-20" />
          <Bone className="h-6 w-24" />
          <Bone className="h-2.5 w-28" />
        </div>
      ))}
    </div>
  );
}

function IdentitySkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] p-4">
      <Bone className="h-12 w-12 shrink-0 rounded-[var(--admin-radius-sm)]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Bone className="h-4 w-44" />
          <Bone className="h-5 w-16 rounded-full" />
        </div>
        <Bone className="h-3 w-64 max-w-full" />
      </div>
    </div>
  );
}

const BAR_HEIGHTS = [38, 54, 46, 70, 62, 84, 58, 76, 92, 68, 80, 96];

function ChartSkeleton({ height = "h-52" }: { height?: string }) {
  return (
    <section className="space-y-4">
      <PanelHeadSkeleton wide />
      <div className={cn("flex items-end gap-2 border-b border-[var(--admin-line)] pb-px", height)}>
        {BAR_HEIGHTS.map((h, i) => (
          <Bone key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
        ))}
      </div>
    </section>
  );
}

function ShareListSkeleton({ rows = 5 }: { rows?: number }) {
  const widths = [72, 58, 46, 34, 22, 16];
  return (
    <section className="space-y-4">
      <PanelHeadSkeleton />
      <div className="space-y-3.5">
        {widths.slice(0, rows).map((w, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Bone className="h-3 w-24" />
              <Bone className="h-3 w-10" />
            </div>
            <Bone className="h-1.5" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TableSkeleton({
  rows = 6,
  avatar = true,
  head = true,
  toolbar = false,
  tabs = false,
  pagination = false,
}: {
  rows?: number;
  avatar?: boolean;
  head?: boolean;
  toolbar?: boolean;
  tabs?: boolean;
  pagination?: boolean;
}) {
  return (
    <section className="space-y-4">
      {head ? <PanelHeadSkeleton /> : null}
      {tabs ? (
        <div className="flex gap-5 border-b border-[var(--admin-line)] pb-2.5">
          {["w-10", "w-14", "w-16", "w-14", "w-12"].map((w, i) => (
            <Bone key={i} className={cn("h-3", w)} />
          ))}
        </div>
      ) : null}
      {toolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Bone className="h-9 flex-1" />
          <Bone className="h-9 w-full sm:w-40" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)]">
        <div className="flex gap-6 border-b border-[var(--admin-line)] px-4 py-2.5">
          {["w-24", "w-16", "w-14", "w-20"].map((w, i) => (
            <Bone key={i} className={cn("h-2.5", w, i > 1 && "hidden sm:block")} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="flex items-center gap-6 border-b border-[var(--admin-line)] px-4 py-3 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              {avatar ? <Bone className="h-7 w-7 shrink-0 rounded-full" /> : null}
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-3 w-40 max-w-full" />
                <Bone className="h-2.5 w-24" />
              </div>
            </div>
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="hidden h-3 w-12 sm:block" />
            <Bone className="hidden h-3 w-20 sm:block" />
          </div>
        ))}
        {pagination ? (
          <div className="flex items-center justify-between border-t border-[var(--admin-line)] px-4 py-2.5">
            <Bone className="h-3 w-32" />
            <div className="flex gap-2">
              <Bone className="h-7 w-16" />
              <Bone className="h-7 w-7" />
              <Bone className="h-7 w-7" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <section className="space-y-4">
      <PanelHeadSkeleton />
      <div className="space-y-4">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Bone className="h-3 w-24" />
            <Bone className={cn(i === fields - 1 ? "h-28" : "h-9", "w-full")} />
          </div>
        ))}
        <Bone className="h-8 w-20" />
      </div>
    </section>
  );
}

/* Page presets */

export function OverviewSkeleton() {
  return (
    <SkeletonRoot label="Loading overview">
      <HeaderSkeleton action />
      <StatsSkeleton />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-2">
          <ShareListSkeleton />
        </div>
      </div>
      <TableSkeleton />
    </SkeletonRoot>
  );
}

export function AnalyticsSkeleton() {
  return (
    <SkeletonRoot label="Loading analytics">
      <HeaderSkeleton />
      <StatsSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <ChartSkeleton height="h-44" />
        <ChartSkeleton height="h-44" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <ShareListSkeleton />
        <ShareListSkeleton />
      </div>
      <TableSkeleton pagination />
    </SkeletonRoot>
  );
}

export function DirectorySkeleton() {
  return (
    <SkeletonRoot label="Loading companies">
      <HeaderSkeleton action />
      <TableSkeleton head={false} tabs toolbar pagination rows={10} />
    </SkeletonRoot>
  );
}

export function DetailSkeleton() {
  return (
    <SkeletonRoot label="Loading company">
      <HeaderSkeleton action />
      <IdentitySkeleton />
      <StatsSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <TableSkeleton rows={5} />
        <ShareListSkeleton />
      </div>
    </SkeletonRoot>
  );
}

export function ListSkeleton({ stats = 4 }: { stats?: 2 | 3 | 4 }) {
  return (
    <SkeletonRoot label="Loading">
      <HeaderSkeleton />
      <StatsSkeleton count={stats} />
      <TableSkeleton rows={8} />
    </SkeletonRoot>
  );
}

export function ReportsSkeleton() {
  return (
    <SkeletonRoot label="Loading reports">
      <HeaderSkeleton />
      <StatsSkeleton />
      <TableSkeleton avatar={false} pagination rows={10} />
    </SkeletonRoot>
  );
}

export function UsersSkeleton() {
  return (
    <SkeletonRoot label="Loading users">
      <HeaderSkeleton />
      <StatsSkeleton count={3} />
      <section className="space-y-4">
        <PanelHeadSkeleton />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <Bone className="h-3 w-16" />
              <Bone className="h-9 w-full" />
            </div>
          ))}
          <div className="flex items-end">
            <Bone className="h-9 w-full" />
          </div>
        </div>
      </section>
      <TableSkeleton rows={6} />
    </SkeletonRoot>
  );
}

export function BrandingSkeleton() {
  return (
    <SkeletonRoot label="Loading branding">
      <HeaderSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <FormSkeleton />
        <section className="space-y-4">
          <PanelHeadSkeleton />
          <div className="space-y-4 rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] p-5">
            <div className="flex items-center gap-3 border-b border-[var(--admin-line)] pb-4">
              <Bone className="h-9 w-9 rounded-[var(--admin-radius-sm)]" />
              <div className="space-y-1.5">
                <Bone className="h-3.5 w-36" />
                <Bone className="h-2.5 w-48" />
              </div>
            </div>
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-11/12" />
            <Bone className="h-3 w-4/5" />
          </div>
        </section>
      </div>
    </SkeletonRoot>
  );
}

export function CalculatorsSkeleton() {
  return (
    <SkeletonRoot label="Loading calculators">
      <HeaderSkeleton />
      <StatsSkeleton count={3} />
      <section className="space-y-4">
        <PanelHeadSkeleton />
        <div className="divide-y divide-[var(--admin-line)] rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)]">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-3 w-40 max-w-full" />
                <Bone className="h-2.5 w-24" />
              </div>
              <Bone className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonRoot>
  );
}

export function BillingSkeleton() {
  return (
    <SkeletonRoot label="Loading plan and billing">
      <HeaderSkeleton action />
      <div className="overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-line)]">
        <div className="flex items-start justify-between gap-4 px-5 py-5">
          <div className="space-y-2">
            <Bone className="h-2.5 w-20" />
            <Bone className="h-6 w-32" />
            <Bone className="h-3 w-72 max-w-full" />
          </div>
          <Bone className="h-8 w-28" />
        </div>
        <div className="grid border-t border-[var(--admin-line)] sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn("space-y-2.5 px-4 py-4", i > 0 && "border-t border-[var(--admin-line)] sm:border-l sm:border-t-0")}
            >
              <Bone className="h-2.5 w-28" />
              <Bone className="h-5 w-32" />
              <Bone className="h-1.5 w-full rounded-full" />
              <Bone className="h-2.5 w-36" />
            </div>
          ))}
        </div>
      </div>
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <PanelHeadSkeleton wide />
          <Bone className="h-8 w-44" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-5 rounded-[var(--admin-radius)] border border-[var(--admin-line)] p-5">
              <div className="space-y-2">
                <Bone className="h-4 w-20" />
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-3/4" />
              </div>
              <Bone className="h-7 w-28" />
              <Bone className="h-9 w-full" />
              <div className="space-y-2.5 border-t border-[var(--admin-line)] pt-4">
                {[0, 1, 2, 3].map((j) => (
                  <Bone key={j} className="h-3 w-5/6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SkeletonRoot>
  );
}

/** Sidebar account card while the signed-in profile loads. */
export function AccountCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5" aria-hidden>
      <Bone className="h-8 w-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Bone className="h-3 w-24" />
        <Bone className="h-2.5 w-32 max-w-full" />
      </div>
    </div>
  );
}
