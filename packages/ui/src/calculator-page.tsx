"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Palette } from "lucide-react";
import { Disclaimer } from "./disclaimer";
import { COLOR_THEMES, getColorTheme, type ColorThemeId } from "./color-themes";

export function CalculatorPage({
  title,
  description,
  header,
  modes,
  form,
  results,
  footer,
}: {
  title: string;
  description?: string;
  header?: ReactNode;
  modes?: ReactNode;
  form: ReactNode;
  results: ReactNode;
  footer?: ReactNode;
}) {
  const [themeId, setThemeId] = useState<ColorThemeId>("classic");
  const theme = useMemo(() => getColorTheme(themeId), [themeId]);

  return (
    <div
      className="flex flex-1 flex-col bg-[var(--app-bg)] pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:px-6 md:px-8 lg:px-10"
      style={theme.vars as CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[var(--app-text)] sm:text-2xl lg:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 text-xs text-[var(--app-text-muted)] sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:w-auto">
            <Palette className="hidden h-4 w-4 shrink-0 text-[var(--app-text-muted)] sm:block" />
            <select
              className="h-10 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--app-primary)] sm:w-36"
              value={themeId}
              onChange={(e) => setThemeId(e.target.value as ColorThemeId)}
            >
              {COLOR_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--app-border)]" />

        {modes ? <div className="shrink-0">{modes}</div> : null}

        <div className="flex shrink-0 flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
          <div className="mb-2.5 sm:mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
              Financial Assumptions
            </span>
          </div>
          {header}
          {form}
        </div>

        <div className="flex flex-col">{results}</div>
        <div className="shrink-0 pb-4">{footer ?? <Disclaimer />}</div>
      </div>
    </div>
  );
}
