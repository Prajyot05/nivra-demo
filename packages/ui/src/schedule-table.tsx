import { formatINRCurrency } from "./format";

export type ScheduleColumn<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "right";
  format?: "inr" | "text" | "number";
};

export function ScheduleTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
}: {
  columns: ScheduleColumn<T>[];
  rows: T[];
  caption?: string;
}) {
  return (
    <div className="flex h-full min-h-[300px] flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
      {caption ? (
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
          {caption}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-[var(--app-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--app-border)] text-left text-[10px] uppercase tracking-widest text-[var(--app-text-subtle)]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`sticky top-0 z-10 bg-[var(--app-surface-muted)] px-3 py-2 ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[var(--app-border)]/60 hover:bg-[var(--app-surface-muted)] transition-colors">
                {columns.map((col) => {
                  const raw = row[col.key as keyof T];
                  let text: string;
                  if (col.format === "inr" && typeof raw === "number") {
                    text = formatINRCurrency(raw);
                  } else if (typeof raw === "number") {
                    text = String(raw);
                  } else {
                    text = raw == null ? "" : String(raw);
                  }
                  return (
                    <td
                      key={String(col.key)}
                      className={`px-3 py-2 tabular-nums text-[var(--app-text)] ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
