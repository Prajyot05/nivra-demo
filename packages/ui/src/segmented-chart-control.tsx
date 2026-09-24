"use client";

import { type ReactNode, useState } from "react";

export type ChartTab = {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
};

/**
 * Chart tab switcher — one chart at a time.
 * `pill` matches the dual-view Comparison / Allocation control in the design system.
 */
export function SegmentedChartControl({
  tabs,
  variant = "track",
}: {
  tabs: ChartTab[];
  variant?: "track" | "pill";
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  const isPill = variant === "pill";

  return (
    <div className={`flex w-full flex-col ${isPill ? "items-center gap-5" : "gap-5"}`}>
      <div className={`flex w-full ${isPill ? "justify-center" : "justify-start sm:justify-center"}`}>
        <div
          className={
            isPill
              ? "inline-flex max-w-full flex-wrap gap-0 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
              : "inline-flex max-w-full flex-wrap gap-1.5 rounded-xl border border-slate-200/70 bg-slate-100/80 p-1"
          }
          role="tablist"
        >
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  isPill
                    ? `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs transition-all ${
                        active
                          ? "bg-[#00875a] font-bold text-white shadow-sm"
                          : "font-semibold text-slate-600 hover:text-slate-900"
                      }`
                    : `inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-emerald-600 font-bold text-white shadow-sm"
                          : "bg-transparent text-slate-600 hover:text-slate-900"
                      }`
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon ? <span className="opacity-90">{tab.icon}</span> : null}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className={
          isPill
            ? "w-full"
            : "w-full rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 sm:p-4"
        }
      >
        {activeContent}
      </div>
    </div>
  );
}
