"use client";

import { cn } from "@/lib/utils";

/**
 * Charts from @nivra/ui size their plot with absolute inset + flex-1.
 * They need an explicit height on the chart root (not only a parent wrapper).
 */
export function V2ChartFrame({
  children,
  className,
  heightClass = "min-h-[280px] h-[280px]",
}: {
  children: React.ReactNode;
  className?: string;
  heightClass?: string;
}) {
  return (
    <div className={cn("w-full overflow-hidden", heightClass, className)}>
      {children}
    </div>
  );
}

export const V2_CHART_CLASS =
  "h-full min-h-[280px] !border-0 !bg-transparent !p-0 !shadow-none !rounded-none";
