"use client";

import { cn } from "@/lib/utils";

/**
 * Mercury-style analytics chrome: clear space above the underline tabs,
 * then a distinct gap before the chart / panel body.
 */
export function WealthAnalyticsChrome({
  tabs,
  children,
  className,
}: {
  tabs: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="overflow-x-auto overflow-y-hidden pt-1">{tabs}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
