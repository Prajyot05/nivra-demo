"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CalculatorPageHeader } from "./calculator-page-header";
import { Disclaimer } from "./disclaimer";
import { getColorTheme, type ColorThemeId } from "./color-themes";

export function CalculatorPage({
  title,
  description,
  header,
  leading,
  modes,
  form,
  results,
  footer,
}: {
  title: string;
  description?: string;
  header?: ReactNode;
  leading?: ReactNode;
  modes?: ReactNode;
  form: ReactNode;
  results: ReactNode;
  footer?: ReactNode;
}) {
  const [themeId, setThemeId] = useState<ColorThemeId>("classic");
  const theme = useMemo(() => getColorTheme(themeId), [themeId]);

  return (
    <div
      className="flex flex-1 flex-col bg-[var(--app-bg)] pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] sm:px-5 md:px-6 lg:px-8"
      style={theme.vars as CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
        <CalculatorPageHeader
          title={title}
          description={description}
          leading={leading}
          themeId={themeId}
          onThemeChange={setThemeId}
        />

        {modes ? <div className="shrink-0">{modes}</div> : null}

        <div className="flex shrink-0 flex-col justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5">
          <div className="mb-2 sm:mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
              Financial Assumptions
            </span>
          </div>
          {header}
          {form}
        </div>

        <div className="flex flex-col">{results}</div>
        <div className="shrink-0 pb-3">{footer ?? <Disclaimer />}</div>
      </div>
    </div>
  );
}
