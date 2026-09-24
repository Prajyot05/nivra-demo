"use client";

import { formatAxisINR, formatINR, parseDigits } from "@nivra/ui";
import { WealthFieldShell, wealthInputClass, wealthInputEmphasizedClass } from "./wealth-field";
import {
  WealthRangeControl,
  type WealthRangePreset,
} from "./wealth-range";
import { cn } from "@/lib/utils";

export type WealthSliderConfig = {
  min: number;
  max: number;
  step?: number;
  presets?: WealthRangePreset[];
  scale?: "linear" | "log";
  formatBound?: (value: number) => string;
};

/** Drop-in wealth styled money field (API mirrors @nivra/ui MoneyInput). */
export function WealthMoneyField({
  label,
  value,
  onChange,
  hint,
  error,
  suffix = "₹",
  max,
  className,
  slider,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  /** Kept for API compat; ₹ renders as a leading prefix inside the input. */
  suffix?: string | null;
  max?: number;
  className?: string;
  /** When set, renders a filled range + optional presets under the input (Trulia pattern). */
  slider?: WealthSliderConfig;
}) {
  const showRupee = Boolean(suffix);
  const inputClass = slider ? wealthInputEmphasizedClass : wealthInputClass;
  const sliderValue = slider
    ? Math.min(Math.max(value, slider.min), slider.max)
    : value;
  return (
    <div className={cn("w-full min-w-0", className)}>
      <WealthFieldShell
        label={label}
        helper={hint}
        error={error}
        prefix={showRupee ? "₹" : undefined}
      >
        <input
          inputMode="numeric"
          value={formatINR(value)}
          onChange={(e) => {
            let next = parseDigits(e.target.value.replace(/,/g, ""));
            if (typeof max === "number" && next > max) next = max;
            onChange(next);
          }}
          className={cn(inputClass, showRupee && "!pl-1.5")}
        />
      </WealthFieldShell>
      {slider ? (
        <WealthRangeControl
          value={sliderValue}
          onChange={onChange}
          min={slider.min}
          max={slider.max}
          step={slider.step ?? 1_00_000}
          presets={slider.presets}
          scale={slider.scale ?? (slider.max / Math.max(slider.min, 1) >= 50 ? "log" : "linear")}
          formatBound={slider.formatBound ?? ((v) => formatAxisINR(v))}
          aria-label={`${label} slider`}
        />
      ) : null}
    </div>
  );
}

/** Drop-in wealth styled percent field (API mirrors @nivra/ui PercentInput). */
export function WealthPercentField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <WealthFieldShell
      label={label}
      helper={hint}
      error={error}
      suffix="%"
      className={cn("w-full min-w-0", className)}
    >
      <input
        inputMode="decimal"
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          if (e.target.value === "") {
            onChange(0);
            return;
          }
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(Math.min(100, Math.max(0, n)));
        }}
        className={cn(wealthInputClass, "!pr-1.5")}
      />
    </WealthFieldShell>
  );
}

/** Drop-in wealth styled year/number field (API mirrors @nivra/ui YearInput). */
export function WealthYearField({
  label = "Tenure (yrs)",
  value,
  onChange,
  min = 1,
  max = 100,
  suffix = "Years",
  hint,
  error,
  className,
  slider,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
  error?: string;
  className?: string;
  slider?: WealthSliderConfig;
}) {
  const inputClass = slider ? wealthInputEmphasizedClass : wealthInputClass;
  return (
    <div className={cn("w-full min-w-0", className)}>
      <WealthFieldShell label={label} helper={hint} error={error} suffix={suffix}>
        <input
          inputMode="numeric"
          value={Number.isFinite(value) ? String(value) : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(0);
              return;
            }
            const n = Math.round(Number(raw));
            if (!Number.isFinite(n)) return;
            onChange(Math.min(max, Math.max(min, n)));
          }}
          className={cn(inputClass, suffix && "!pr-1.5")}
        />
      </WealthFieldShell>
      {slider ? (
        <WealthRangeControl
          value={value}
          onChange={onChange}
          min={slider.min}
          max={slider.max}
          step={slider.step ?? 1}
          presets={slider.presets}
          scale={slider.scale ?? "linear"}
          formatBound={
            slider.formatBound ??
            ((v) => (suffix === "Days" ? `${v}D` : `${v}Y`))
          }
          aria-label={`${label} slider`}
        />
      ) : null}
    </div>
  );
}

export function WealthAgeField({
  value,
  onChange,
  error,
  className,
}: {
  value: number;
  onChange: (age: number) => void;
  error?: string;
  className?: string;
}) {
  return (
    <WealthYearField
      label="Age"
      value={value}
      onChange={onChange}
      min={0}
      max={120}
      suffix="Years"
      error={error}
      className={className}
    />
  );
}

export function WealthTextField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  type = "text",
  autoComplete,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  className?: string;
}) {
  return (
    <WealthFieldShell
      label={label}
      helper={hint}
      error={error}
      className={cn("w-full min-w-0", className)}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={wealthInputClass}
      />
    </WealthFieldShell>
  );
}

export {
  WealthRangeControl,
  WEALTH_DAY_PRESETS_DEFAULT,
  WEALTH_GOAL_PRESETS_DEFAULT,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
} from "./wealth-range";
export type { WealthRangePreset } from "./wealth-range";
