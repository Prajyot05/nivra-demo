"use client";

import { useLinkStatus } from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Must render inside a next/link `<Link>`; swaps the icon for a spinner while navigating. */
export function LinkPendingIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  const { pending } = useLinkStatus();
  if (pending) {
    return <Loader2 aria-hidden className={cn("animate-spin", className)} />;
  }
  return <Icon aria-hidden className={className} />;
}
