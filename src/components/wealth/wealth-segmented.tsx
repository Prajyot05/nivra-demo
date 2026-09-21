"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Polar / Canva segmented control — 40px track matches inputs.
 */
export function WealthSegmented<T extends string>({
  options,
  value,
  onChange,
  fullWidth,
  layoutId = "wealth-segment-pill",
  variant = "pill",
}: {
  options: Array<{ id: T; label: string; icon?: React.ReactNode }>;
  value: T;
  onChange: (id: T) => void;
  fullWidth?: boolean;
  layoutId?: string;
  variant?: "pill" | "underline";
}) {
  if (variant === "underline") {
    return (
      <div
        className="flex gap-1.5 overflow-x-auto border-b border-slate-200"
        role="tablist"
      >
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.id)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-1.5 px-3.5 pb-3.5 pt-2.5 text-sm transition-colors duration-150",
                active
                  ? "font-semibold text-slate-900"
                  : "font-medium text-slate-500 hover:text-slate-800",
              )}
            >
              {opt.icon}
              {opt.label}
              {active ? (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-emerald-500"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative inline-flex h-10 rounded-lg bg-slate-100 p-1",
        fullWidth && "flex w-full",
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-[13px] transition-colors duration-150",
              active
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-600 hover:text-slate-800",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
