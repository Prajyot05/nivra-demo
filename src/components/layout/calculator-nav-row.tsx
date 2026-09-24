"use client";

import Link from "next/link";
import {
  excelBasename,
  hrefFor,
  type NavItem,
} from "@/lib/calculator-nav";
import { cn } from "@/lib/utils";

/**
 * Sidebar row — Linear-style compact nav: quiet labels, soft active wash, optional UI-polish tick.
 */
export function CalculatorNavRow({
  item,
  active,
  showQaChecklist,
  checked,
  onToggle,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  showQaChecklist: boolean;
  checked?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const isUiLocked = item.uiPolished === true;
  const isChecked = isUiLocked || Boolean(checked);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
        active
          ? "bg-emerald-50 text-emerald-950"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
      )}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald-600"
          aria-hidden
        />
      ) : null}

      {showQaChecklist ? (
        <input
          type="checkbox"
          checked={isChecked}
          disabled={isUiLocked}
          onChange={isUiLocked ? undefined : onToggle}
          onClick={(event) => event.stopPropagation()}
          className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-emerald-600 disabled:cursor-default"
          aria-label={
            isUiLocked
              ? `${item.label} UI polished by Yash`
              : `Mark ${item.label} UI as done`
          }
          title={isUiLocked ? "UI polished (Yash)" : "Mark UI polish done"}
        />
      ) : null}

      <Link
        href={hrefFor(item)}
        onClick={onNavigate}
        className={cn(
          "min-w-0 flex-1 text-[13px] leading-snug",
          active ? "font-medium text-emerald-950" : "font-normal",
        )}
        title={showQaChecklist ? item.excelFile : item.description}
      >
        <span className="block truncate">{item.shortLabel}</span>
        {showQaChecklist ? (
          <span className="mt-0.5 block truncate text-[10px] font-normal leading-tight text-slate-400">
            {isUiLocked ? "Yash · UI done" : excelBasename(item.excelFile)}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
