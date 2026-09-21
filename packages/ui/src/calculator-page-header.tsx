"use client";

import type { ReactNode } from "react";
import { COLOR_THEMES, type ColorThemeId } from "./color-themes";

/**
 * Calculator page title — same Geist family as body (Brex / shadcn / Composer pattern).
 * Hierarchy comes from size, weight, and tracking, not a mismatched display face.
 */
export function CalculatorPageHeader({
  title,
  description,
  meta,
  leading,
  themeId,
  onThemeChange,
  actions,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  leading?: ReactNode;
  themeId: ColorThemeId;
  onThemeChange: (id: ColorThemeId) => void;
  actions?: ReactNode;
}) {
  return (
    <header className="shrink-0 pb-1 pt-1 sm:pb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {leading ? (
              <div className="mt-1 shrink-0 sm:mt-2">{leading}</div>
            ) : null}
            <div className="min-w-0 space-y-2">
              <h1 className="text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.035em] text-slate-950 sm:text-[2rem] md:text-[2.25rem]">
                {title}
              </h1>
              {meta}
              {description ? (
                <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-[0.9375rem]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1.5">
          {actions}
          <label htmlFor="calc-theme" className="sr-only">
            Color theme
          </label>
          <select
            id="calc-theme"
            className="h-9 min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
            value={themeId}
            onChange={(e) => onThemeChange(e.target.value as ColorThemeId)}
          >
            {COLOR_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
