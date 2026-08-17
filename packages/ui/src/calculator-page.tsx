import type { ReactNode } from "react";
import { Disclaimer } from "./disclaimer";

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
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {header}
      {modes}
      <div className="rounded-xl border border-border bg-card p-4">{form}</div>
      {results}
      {footer ?? <Disclaimer />}
    </div>
  );
}
