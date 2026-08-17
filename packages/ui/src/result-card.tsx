import { formatINRCurrency } from "./format";

export type ResultItem = {
  label: string;
  value: number;
  hint?: string;
};

export function ResultCard({
  title,
  items,
}: {
  title: string;
  items: ResultItem[];
}) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 sm:p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </h3>
      <dl className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-[var(--app-border)] border-dashed pb-2 last:border-0 last:pb-0">
            <dt className="text-sm font-medium text-[var(--app-text-muted)]">{item.label}</dt>
            <dd className="text-right">
              <div className="font-semibold tabular-nums text-[var(--app-text)] sm:text-lg">
                {formatINRCurrency(item.value)}
              </div>
              {item.hint ? (
                <div className="text-[11px] text-[var(--app-text-subtle)]">{item.hint}</div>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
