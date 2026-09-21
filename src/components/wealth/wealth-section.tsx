"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IconChevron } from "./wealth-icons";
import { cn } from "@/lib/utils";

export function WealthSection({
  badge,
  title,
  subtitle,
  open,
  onToggle,
  actions,
  children,
  id,
  mark,
  className,
  contentClassName,
}: {
  badge: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  mark?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-6 py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {mark}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex shrink-0 items-center rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium tabular-nums text-slate-600">
                {badge}
              </span>
              <h3 className="truncate text-[16px] font-semibold leading-6 tracking-tight text-slate-900">
                {title}
              </h3>
            </div>
            <p className="mt-0.5 text-[13px] leading-[18px] text-slate-500">{subtitle}</p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "Collapse section" : "Expand section"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-500/20",
              open && "rotate-180",
            )}
          >
            <IconChevron className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mx-6 border-t border-slate-200" />
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className={cn("px-6 pb-6 pt-5", contentClassName)}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
