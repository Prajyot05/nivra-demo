import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("admin-bone rounded-[4px]", className)} style={style} />;
}

const BAR_HEIGHTS = [38, 54, 46, 70, 62, 84, 58, 76, 92, 68, 80, 96];

/** Mirrors AdminPageHeader + StatStrip + chart panel + table so content does not jump. */
export function AdminPageSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-8">
      <span className="sr-only">Loading dashboard</span>

      <div className="space-y-2.5">
        <Bone className="h-7 w-48 sm:h-8" />
        <Bone className="h-3.5 w-80 max-w-full" />
      </div>

      <div className="grid overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)] sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "space-y-2.5 px-4 py-3.5",
              i > 0 && "border-t border-[var(--admin-line)] sm:border-t-0",
              i % 2 === 1 && "sm:border-l",
              i >= 2 && "lg:border-l",
            )}
          >
            <Bone className="h-2.5 w-20" />
            <Bone className="h-6 w-24" />
            <Bone className="h-2.5 w-28" />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="space-y-1.5">
            <Bone className="h-4 w-36" />
            <Bone className="h-3 w-52" />
          </div>
          <div className="flex h-52 items-end gap-2 border-b border-[var(--admin-line)] pb-px">
            {BAR_HEIGHTS.map((h, i) => (
              <Bone key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="space-y-1.5">
            <Bone className="h-4 w-28" />
            <Bone className="h-3 w-40" />
          </div>
          <div className="space-y-3.5">
            {[72, 58, 46, 34, 22].map((w, i) => (
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
      </div>

      <section className="space-y-4">
        <div className="space-y-1.5">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-56" />
        </div>
        <div className="overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-line)]">
          <div className="flex gap-6 border-b border-[var(--admin-line)] px-4 py-2.5">
            {["w-24", "w-16", "w-14", "w-20"].map((w, i) => (
              <Bone key={i} className={cn("h-2.5", w, i > 1 && "hidden sm:block")} />
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center gap-6 border-b border-[var(--admin-line)] px-4 py-3 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Bone className="h-7 w-7 shrink-0 rounded-full" />
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
        </div>
      </section>
    </div>
  );
}
