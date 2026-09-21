"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatINRCurrency } from "@nivra/ui";
import { cn } from "@/lib/utils";

export type WealthRangePreset = { label: string; value: number };

const SLIDER_RES = 10_000;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Map value ↔ slider position. Log scale when the span is wide (money). */
function toPos(value: number, min: number, max: number, scale: "linear" | "log") {
  const v = clamp(value, min, max);
  if (scale === "linear" || min <= 0 || max <= min) {
    return ((v - min) / (max - min)) * SLIDER_RES;
  }
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  return ((Math.log(v) - logMin) / (logMax - logMin)) * SLIDER_RES;
}

function fromPos(pos: number, min: number, max: number, scale: "linear" | "log") {
  const t = clamp(pos, 0, SLIDER_RES) / SLIDER_RES;
  if (scale === "linear" || min <= 0 || max <= min) {
    return min + t * (max - min);
  }
  return Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
}

/** Round to a step that feels continuous at the current magnitude. */
function adaptiveRound(raw: number, baseStep: number, scale: "linear" | "log") {
  if (baseStep <= 0) return Math.round(raw);
  if (scale === "linear") {
    return Math.round(raw / baseStep) * baseStep;
  }
  const abs = Math.abs(raw);
  let step = baseStep;
  if (abs < 1_00_000) step = Math.max(1_000, Math.round(baseStep / 20));
  else if (abs < 10_00_000) step = Math.max(5_000, Math.round(baseStep / 10));
  else if (abs < 1_00_00_000) step = Math.max(25_000, Math.round(baseStep / 4));
  else if (abs < 10_00_00_000) step = Math.max(1_00_000, baseStep);
  else step = Math.max(5_00_000, baseStep * 5);
  return Math.round(raw / step) * step;
}

/**
 * Trulia / Airbnb range: continuous thumb while dragging,
 * adaptive snap for money, tinted preset chips.
 */
export function WealthRangeControl({
  value,
  onChange,
  min,
  max,
  step = 1,
  presets,
  formatBound = (v) => formatINRCurrency(v),
  scale = "linear",
  "aria-label": ariaLabel,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  presets?: WealthRangePreset[];
  formatBound?: (value: number) => string;
  /** Use log for wide money spans (e.g. ₹10k → ₹25Cr). */
  scale?: "linear" | "log";
  "aria-label"?: string;
  className?: string;
}) {
  const id = useId();
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const draggingRef = useRef(false);
  const posRef = useRef(toPos(value || safeMin, safeMin, safeMax, scale));
  const [pos, setPos] = useState(() => posRef.current);

  useEffect(() => {
    if (draggingRef.current) return;
    const next = toPos(value || safeMin, safeMin, safeMax, scale);
    posRef.current = next;
    setPos(next);
  }, [value, safeMin, safeMax, scale]);

  const pct = (pos / SLIDER_RES) * 100;

  const commitFromPos = (nextPos: number) => {
    const clamped = clamp(nextPos, 0, SLIDER_RES);
    posRef.current = clamped;
    setPos(clamped);
    const raw = fromPos(clamped, safeMin, safeMax, scale);
    const next = clamp(Math.round(raw), safeMin, safeMax);
    if (next !== value) onChange(next);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const raw = fromPos(posRef.current, safeMin, safeMax, scale);
    const snapped = clamp(adaptiveRound(raw, step, scale), safeMin, safeMax);
    const snappedPos = toPos(snapped, safeMin, safeMax, scale);
    posRef.current = snappedPos;
    setPos(snappedPos);
    if (snapped !== value) onChange(snapped);
  };

  return (
    <div className={cn("mt-2 w-full", className)}>
      <div className="relative flex h-5 items-center">
        <input
          id={id}
          type="range"
          min={0}
          max={SLIDER_RES}
          step={1}
          value={pos}
          aria-label={ariaLabel}
          aria-valuemin={safeMin}
          aria-valuemax={safeMax}
          aria-valuenow={clamp(value, safeMin, safeMax)}
          aria-valuetext={formatBound(clamp(value, safeMin, safeMax))}
          onPointerDown={() => {
            draggingRef.current = true;
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onBlur={endDrag}
          onChange={(e) => commitFromPos(Number(e.target.value))}
          className="wealth-range-slider w-full cursor-pointer"
          style={{ ["--wealth-slider-pct" as string]: `${pct}%` }}
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] leading-3 tabular-nums text-slate-400">
        <span>{formatBound(safeMin)}</span>
        <span>{formatBound(safeMax)}</span>
      </div>

      {presets && presets.length > 0 ? (
        <div
          className="mt-1.5 flex flex-wrap items-center gap-1"
          role="radiogroup"
          aria-label="Quick values"
        >
          {presets.map((preset) => {
            const active = value === preset.value;
            return (
              <button
                key={`${preset.label}-${preset.value}`}
                type="button"
                role="radio"
                aria-checked={active}
                aria-pressed={active}
                onClick={() => {
                  const next = clamp(preset.value, safeMin, safeMax);
                  draggingRef.current = false;
                  setPos(toPos(next, safeMin, safeMax, scale));
                  onChange(next);
                }}
                className={cn(
                  "inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-medium tabular-nums transition",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-500/20",
                  active
                    ? "border-emerald-500/35 bg-emerald-50 font-semibold text-emerald-700"
                    : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export const WEALTH_MONEY_PRESETS_DEFAULT: WealthRangePreset[] = [
  { label: "₹1L", value: 1_00_000 },
  { label: "₹10L", value: 10_00_000 },
  { label: "₹50L", value: 50_00_000 },
  { label: "₹1Cr", value: 1_00_00_000 },
];

export const WEALTH_GOAL_PRESETS_DEFAULT: WealthRangePreset[] = [
  { label: "₹50L", value: 50_00_000 },
  { label: "₹1Cr", value: 1_00_00_000 },
  { label: "₹2Cr", value: 2_00_00_000 },
  { label: "₹5Cr", value: 5_00_00_000 },
];

export const WEALTH_YEAR_PRESETS_DEFAULT: WealthRangePreset[] = [
  { label: "5Y", value: 5 },
  { label: "10Y", value: 10 },
  { label: "15Y", value: 15 },
  { label: "20Y", value: 20 },
  { label: "25Y", value: 25 },
];

export const WEALTH_DAY_PRESETS_DEFAULT: WealthRangePreset[] = [
  { label: "7D", value: 7 },
  { label: "15D", value: 15 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "1Y", value: 365 },
];
