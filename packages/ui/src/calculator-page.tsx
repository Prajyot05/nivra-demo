"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CalculatorPageHeader } from "./calculator-page-header";
import { getColorTheme, type ColorThemeId } from "./color-themes";
import { readStoredColorTheme, writeStoredColorTheme } from "./theme-storage";
import { STACK } from "./tokens";
import { ComplianceFootnote } from "./bento-components";

/**
 * Shell for every classic calculator, with the multi-color theme picker restored.
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
  contentClassName,
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
  /** Optional override for the centered content shell width. */
  contentClassName?: string;
}) {
  const [themeId, setThemeId] = useState<ColorThemeId>("classic");
  const theme = useMemo(() => getColorTheme(themeId), [themeId]);

  useEffect(() => {
    setThemeId(readStoredColorTheme());
  }, []);

  const handleThemeChange = (id: ColorThemeId) => {
    setThemeId(id);
    writeStoredColorTheme(id);
  };

  return (
    <div
      className="flex flex-1 flex-col text-slate-800 pt-[max(1.5rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 selection:bg-brand-100 selection:text-brand-900"
      style={
        {
          ...theme.vars,
          backgroundColor: "var(--app-bg)",
          color: "var(--app-text)",
        } as CSSProperties
      }
    >
      <div
        className={
          contentClassName ??
          "mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8"
        }
      >
        <CalculatorPageHeader
          title={title}
          description={description}
          leading={leading}
          actions={actions}
          themeId={themeId}
          onThemeChange={handleThemeChange}
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
