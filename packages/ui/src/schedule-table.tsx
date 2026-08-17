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
    <div className="rounded-xl border border-border bg-card">
      {caption ? (
        <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {caption}
        </div>
      ) : null}
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`sticky top-0 bg-card px-3 py-2 ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/60">
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
                      className={`px-3 py-1.5 tabular-nums ${col.align === "right" ? "text-right" : ""}`}
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
