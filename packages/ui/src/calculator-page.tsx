"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CalculatorPageHeader } from "./calculator-page-header";
import { Card, SectionTitle } from "./card";
import { Disclaimer } from "./disclaimer";
import { getColorTheme, type ColorThemeId } from "./color-themes";
import { STACK } from "./tokens";

/**
 * Shell for every calculator: title → assumptions → results → disclaimer.
 *
 * The order encodes the intended reading flow, so pages only supply content for
 * each slot and never re-declare page padding, card chrome or section spacing.
 */
export function CalculatorPage({
  title,
  description,
  formTitle = "Financial Assumptions",
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
  /** Heading above the input card. */
  formTitle?: string;
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
      className="flex flex-1 flex-col bg-[var(--app-bg)] pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] sm:px-5 md:px-6 lg:px-8"
      style={theme.vars as CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
        <CalculatorPageHeader
          title={title}
          description={description}
          leading={leading}
          actions={actions}
          themeId={themeId}
          onThemeChange={setThemeId}
        />

        {modes ? <div className="shrink-0">{modes}</div> : null}

        <Card variant="muted" className="shrink-0">
          <SectionTitle as="h2" className="mb-2.5">
            {formTitle}
          </SectionTitle>
          {header}
          {form}
        </Card>

        <div className={STACK}>{results}</div>
        <div className="shrink-0 pt-1 pb-4">{footer ?? <Disclaimer />}</div>
      </div>
    </div>
  );
}
