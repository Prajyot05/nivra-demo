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
    <div className="flex shrink-0 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 sm:p-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </h3>
      <dl className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-2 border-b border-[var(--app-border)] border-dashed pb-1 last:border-0 last:pb-0">
            <dt className="text-xs font-medium text-[var(--app-text-muted)]">{item.label}</dt>
            <dd className="text-right">
              <div className="text-xs font-semibold tabular-nums text-[var(--app-text)] sm:text-sm">
                {formatINRCurrency(item.value)}
              </div>
              {item.hint ? (
                <div className="text-[10px] text-[var(--app-text-subtle)]">{item.hint}</div>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
