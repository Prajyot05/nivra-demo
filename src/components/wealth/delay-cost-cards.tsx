"use client";

import { motion } from "framer-motion";
import { formatINRCurrency } from "@nivra/ui";
import { IconAlert } from "./wealth-icons";
import { cn } from "@/lib/utils";

export type DelayRow = { mo: number; sip: number; extra: number };

export function DelayCostCards({
  delays,
  baselineSip,
}: {
  delays: DelayRow[];
  baselineSip: number;
}) {
  const maxExtra = Math.max(...delays.map((d) => d.extra), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {delays.map((d, i) => {
          const lift = baselineSip > 0 ? ((d.sip - baselineSip) / baselineSip) * 100 : 0;
          const pct = Math.min(100, (d.extra / maxExtra) * 100);
          return (
            <motion.div
              key={d.mo}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              whileHover={{ y: -2 }}
              className="rounded-[24px] border border-slate-900/[0.05] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {d.mo} Months
                </span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                  +{lift.toFixed(1)}% SIP
                </span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Required SIP</div>
              <div className="mt-1 text-2xl font-medium tabular-nums text-slate-900">
                {formatINRCurrency(d.sip)}
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-wider text-slate-400">Extra Cost</div>
              <div className="mt-1 text-lg font-medium tabular-nums text-rose-600">
                {formatINRCurrency(d.extra)}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div
        className={cn(
          "flex gap-3 rounded-[20px] border border-amber-200/80 bg-amber-50/80 p-4 text-sm text-amber-950",
        )}
      >
        <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <div className="font-medium text-amber-900">Cost of waiting compounds</div>
          <p className="mt-1 text-amber-800/80">
            Every delayed quarter raises the SIP needed to hit the same target. Starting on time
            protects monthly cash flow and reduces total capital outlay.
          </p>
        </div>
      </div>
    </div>
  );
}
