import { type ReactNode } from "react";

export function ReportSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between border-b border-[#e2e8f0] pb-2">
        <h2 className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-widest text-[#0f172a]">
          <span className="block h-2 w-2 rounded-sm bg-emerald-500" />
          {title}
        </h2>
        {subtitle ? (
          <div className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
            {subtitle}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ReportCard({
  title,
  value,
  hint,
  highlight = false,
  danger = false,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col justify-between gap-4 rounded-xl border p-5 ${
        highlight
          ? "border-[#152033] bg-[#152033] text-white shadow-md shadow-[#152033]/10"
          : danger
            ? "border-red-200 bg-white shadow-sm"
            : "border-[#e2e8f0] bg-white shadow-sm"
      }`}
    >
      <div
        className={`break-words text-[10px] font-bold uppercase leading-snug tracking-widest ${
          highlight ? "text-slate-300" : danger ? "text-red-500" : "text-[#64748b]"
        }`}
      >
        {title}
      </div>
      <div>
        <div
          className={`text-3xl font-bold tracking-tight ${
            danger && !highlight ? "text-red-600" : ""
          }`}
        >
          {value}
        </div>
        {hint ? (
          <div
            className={`mt-1.5 text-[11px] font-medium ${
              highlight ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ReportAssumptionCard({
  title,
  value,
  description,
}: {
  title: string;
  value: ReactNode;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">
        {title}
      </div>
      <div className="text-lg font-bold text-[#0f172a]">{value}</div>
      {description ? (
        <div className="text-[10px] font-medium text-[#64748b]">{description}</div>
      ) : null}
    </div>
  );
}

export function ReportChartContainer({
  title,
  subtitle,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[13px] font-bold tracking-wide text-[#0f172a]">{title}</h3>
          {subtitle ? (
            <div className="mt-1 max-w-[80%] text-[11px] font-medium leading-relaxed text-[#64748b]">
              {subtitle}
            </div>
          ) : null}
        </div>
        {badge ? (
          <div className="shrink-0 rounded-md border border-emerald-100/50 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-700">
            {badge}
          </div>
        ) : null}
      </div>
      <div className="relative min-h-[240px] w-full flex-1">{children}</div>
    </div>
  );
}

export function ReportPlaybook({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-600">
        {number}
      </div>
      <div className="text-sm font-bold tracking-wide text-[#0f172a]">{title}</div>
      <div className="mt-1 text-balance text-[11px] font-medium leading-relaxed text-[#64748b]">
        {description}
      </div>
    </div>
  );
}

export function ReportTable({
  columns,
  data,
  highlightRowIf,
}: {
  columns: { key: string; label: string; right?: boolean; badge?: boolean }[];
  data: Array<Record<string, unknown>>;
  highlightRowIf?: (row: Record<string, unknown>) => boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
      <table className="w-full border-collapse bg-white text-left">
        <thead>
          <tr className="bg-[#0f172a]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`border-r border-slate-800 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white last:border-r-0 ${
                  col.right ? "text-right" : ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isHighlighted = highlightRowIf?.(row);
            return (
              <tr
                key={i}
                className={`border-b border-[#f1f5f9] last:border-b-0 ${
                  isHighlighted ? "bg-emerald-50 font-bold" : "even:bg-slate-50/50"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 text-[11px] ${
                      isHighlighted
                        ? "border-y border-emerald-200 text-[#0f172a]"
                        : "border-r border-[#f1f5f9] text-[#64748b] last:border-r-0"
                    } ${col.right ? "text-right font-medium text-[#0f172a]" : ""}`}
                  >
                    {col.badge ? (
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          isHighlighted
                            ? "bg-emerald-500 text-white shadow shadow-emerald-500/20"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {String(row[col.key] ?? "")}
                      </span>
                    ) : (
                      String(row[col.key] ?? "")
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
