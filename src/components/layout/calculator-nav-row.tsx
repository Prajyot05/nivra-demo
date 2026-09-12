"use client";

import Link from "next/link";
import {
  excelBasename,
  hrefFor,
  type NavItem,
} from "@/lib/calculator-nav";
import { cn } from "@/lib/utils";

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
  const isDone = item.completed === true;
  const isChecked = isDone || Boolean(checked);

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md px-2 py-1.5",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
      )}
    >
      {showQaChecklist ? (
        <input
          type="checkbox"
          checked={isChecked}
          disabled={isDone}
          onChange={isDone ? undefined : onToggle}
          onClick={(event) => event.stopPropagation()}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary disabled:cursor-default"
          aria-label={
            isDone
              ? `${item.label} completed`
              : `Mark ${item.label} as Excel-tested`
          }
          title={isDone ? "Completed" : "Mark as Excel-tested"}
        />
      ) : null}
      <Link
        href={hrefFor(item)}
        onClick={onNavigate}
        className={cn(
          "min-w-0 flex-1 text-[13px] leading-snug",
          active && "font-medium",
        )}
        title={showQaChecklist ? item.excelFile : undefined}
      >
        <span className="block">{item.label}</span>
        {showQaChecklist ? (
          <span className="mt-0.5 block truncate text-[10px] font-normal leading-tight text-muted-foreground">
            {excelBasename(item.excelFile)}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
