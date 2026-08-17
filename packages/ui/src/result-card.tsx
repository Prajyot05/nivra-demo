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
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <dl className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-right">
              <div className="font-medium tabular-nums text-foreground">
                {formatINRCurrency(item.value)}
              </div>
              {item.hint ? (
                <div className="text-[11px] text-muted-foreground">{item.hint}</div>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
