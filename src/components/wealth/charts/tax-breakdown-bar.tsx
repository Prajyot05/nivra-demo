"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";

export function TaxBreakdownBar({
  invested,
  gain,
  tax,
  net,
  title,
}: {
  invested: number;
  gain: number;
  tax: number;
  net: number;
  title: string;
}) {
  const preTax = invested + gain;
  const rows = [
    {
      key: "Invested",
      value: invested,
      pct: preTax > 0 ? (invested / preTax) * 100 : 0,
      color: "#64748B",
      note: "Capital you put in",
    },
    {
      key: "Gain",
      value: gain,
      pct: preTax > 0 ? (gain / preTax) * 100 : 0,
      color: "#059669",
      note: "Market growth before tax",
    },
    {
      key: "Tax",
      value: tax,
      pct: preTax > 0 ? (tax / preTax) * 100 : 0,
      color: "#B45309",
      note: "Estimated LTCG on gains",
    },
  ];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>
          <p className="mt-1.5 text-sm font-normal text-slate-500">
            Pre-tax corpus{" "}
            <span className="tabular-nums text-slate-700">{formatINRCurrency(preTax)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-emerald-700/80">
            Net after tax
          </p>
          <p className="mt-1 text-[28px] font-medium leading-none tracking-tight tabular-nums text-emerald-900 sm:text-[32px]">
            {formatINRCurrency(net)}
          </p>
        </div>
      </header>

      <div className="px-5 py-4 sm:px-6">
        <div className="flex h-3.5 overflow-hidden rounded-full bg-slate-100">
          {rows.map((row) => (
            <div
              key={row.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${Math.max(row.pct, row.value > 0 ? 2 : 0)}%`,
                backgroundColor: row.color,
              }}
              title={`${row.key}: ${formatINRCurrency(row.value)}`}
            />
          ))}
        </div>

        <ul className="mt-1 divide-y divide-slate-100">
          {rows.map((row) => (
            <li
              key={row.key}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)_auto]"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: row.color }}
                />
                <div>
                  <div className="text-[14px] font-medium text-slate-800">{row.key}</div>
                  <div className="text-xs font-normal text-slate-400 sm:hidden">{row.note}</div>
                </div>
              </div>
              <div className="hidden text-sm font-normal text-slate-500 sm:block">{row.note}</div>
              <div className="text-right">
                <div className="text-[16px] font-medium tabular-nums text-slate-900 sm:text-[17px]">
                  {formatINRCurrency(row.value)}
                </div>
                <div className="mt-0.5 text-xs font-normal tabular-nums text-slate-400">
                  {formatPercent(row.pct, 1)} of pre-tax
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50/70 px-4 py-3">
          <div>
            <div className="text-[13px] font-medium text-emerald-900">Net wealth</div>
            <div className="text-xs font-normal text-emerald-700/70">
              What remains after estimated tax
            </div>
          </div>
          <div className="text-[20px] font-medium tabular-nums text-emerald-900 sm:text-[22px]">
            {formatINRCurrency(net)}
          </div>
        </div>
      </div>
    </article>
  );
}
