"use client";

import type { ReactNode } from "react";
import { COLOR_THEMES, type ColorThemeId } from "./color-themes";

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
    <header className="flex shrink-0 flex-col gap-2.5 border-b border-[var(--app-border)] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-[var(--app-text)] sm:text-[1.0625rem]">
            {title}
          </h1>
          {meta}
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--app-text-muted)] sm:line-clamp-1 sm:text-xs">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
        {actions}
        <label htmlFor="calc-theme" className="sr-only">
          Color theme
        </label>
        <select
          id="calc-theme"
          className="h-8 min-w-[6.5rem] rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 text-xs font-semibold text-[var(--app-text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--app-primary)]"
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
    </header>
  );
}
