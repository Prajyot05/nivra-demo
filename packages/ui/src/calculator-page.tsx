"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CalculatorPageHeader } from "./calculator-page-header";
import { getColorTheme, type ColorThemeId } from "./color-themes";
import { STACK } from "./tokens";
import { ComplianceFootnote } from "./bento-components";

/**
 * Shell for every calculator
 */
export function CalculatorPage({
  title,
  description,
  header,
  leading,
  actions,
  modes,
  form,
  results,
  footer,
}: {
  title: string;
  description?: string;
  header?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  modes?: ReactNode;
  form: ReactNode;
  results: ReactNode;
  footer?: ReactNode;
}) {
  const [themeId, setThemeId] = useState<ColorThemeId>("classic");
  const theme = useMemo(() => getColorTheme(themeId), [themeId]);

  return (
    <div
      className="flex flex-1 flex-col bg-[#f8fafc] text-slate-800 pt-[max(1.5rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 selection:bg-brand-100 selection:text-brand-900"
      style={theme.vars as CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8">
        <CalculatorPageHeader
          title={title}
          description={description}
          leading={leading}
          actions={actions}
          themeId={themeId}
          onThemeChange={setThemeId}
        />

        {header}

        {modes ? <div className="shrink-0">{modes}</div> : null}

        {form}

        <div className={STACK}>{results}</div>
        <div className="shrink-0 pt-1 pb-8">{footer ?? <ComplianceFootnote />}</div>
      </div>
    </div>
  );
}
