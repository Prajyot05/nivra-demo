"use client";

import { useEffect, useId, useRef, useState } from "react";
import { COLOR_THEMES, type ColorThemeId } from "./color-themes";

/**
 * Color theme control: button + dropdown list of named themes.
 * Uses --app-* tokens so classic CalculatorPage and /2 V2Shell both theme it.
 */
export function ThemePicker({
  themeId,
  onThemeChange,
  className,
  buttonClassName,
}: {
  themeId: ColorThemeId;
  onThemeChange: (id: ColorThemeId) => void;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const active = COLOR_THEMES.find((t) => t.id === themeId) ?? COLOR_THEMES[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={className ? `relative ${className}` : "relative"}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ??
          "inline-flex h-9 min-w-[8.5rem] items-center justify-between gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 text-xs font-medium text-[var(--app-text)] shadow-sm transition hover:bg-[var(--app-bg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--app-primary)]"
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: active.chart.a }}
          />
          <span className="truncate">{active.label}</span>
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 text-[var(--app-text-subtle)] transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Color theme"
          className="absolute right-0 z-40 mt-1 max-h-64 min-w-[11rem] overflow-auto rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] py-1 shadow-lg"
        >
          {COLOR_THEMES.map((theme) => {
            const selected = theme.id === themeId;
            return (
              <li key={theme.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition ${
                    selected
                      ? "bg-[var(--app-primary-fg-muted)] text-[var(--app-text)]"
                      : "text-[var(--app-text-muted)] hover:bg-[var(--app-bg)] hover:text-[var(--app-text)]"
                  }`}
                  onClick={() => {
                    onThemeChange(theme.id);
                    setOpen(false);
                  }}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: theme.chart.a }}
                  />
                  {theme.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
