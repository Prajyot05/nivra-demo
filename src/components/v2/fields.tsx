"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { formatAxisINR, formatINR, parseDigits } from "@nivra/ui";
import { cn } from "@/lib/utils";
import { V2_MONEY_INPUT_MAX, v2FieldWidth } from "./tokens";

const labelClass =
  "flex h-4 items-center text-[12px] font-medium leading-none text-[var(--v2-ink)]";
const hintClass = "mt-1 text-[11px] leading-snug text-[var(--v2-faint)]";
const errorClass = "mt-1 text-[11px] leading-snug text-[var(--v2-danger)]";

const V2FormResetContext = createContext(0);

/** Bump `resetKey` on Reset so every field returns to the blue ready state. */
export function V2FormScope({
  resetKey,
  children,
}: {
  resetKey: number;
  children: ReactNode;
}) {
  return (
    <V2FormResetContext.Provider value={resetKey}>{children}</V2FormResetContext.Provider>
  );
}

const SLIDER_RES = 10_000;
const TRANSITION =
  "transition-[border-color,background-color,box-shadow] duration-150 ease-out";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toPos(value: number, min: number, max: number, scale: "linear" | "log") {
  const v = clamp(value, min, max);
  if (scale === "linear" || min <= 0 || max <= min) {
    return ((v - min) / (max - min)) * SLIDER_RES;
  }
  return ((Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))) * SLIDER_RES;
}

function fromPos(pos: number, min: number, max: number, scale: "linear" | "log") {
  const t = clamp(pos, 0, SLIDER_RES) / SLIDER_RES;
  if (scale === "linear" || min <= 0 || max <= min) {
    return min + t * (max - min);
  }
  return Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
}

function adaptiveRound(raw: number, baseStep: number, scale: "linear" | "log") {
  if (baseStep <= 0) return Math.round(raw);
  if (scale === "linear") return Math.round(raw / baseStep) * baseStep;
  const abs = Math.abs(raw);
  let step = baseStep;
  if (abs < 1_00_000) step = Math.max(1_000, Math.round(baseStep / 20));
  else if (abs < 10_00_000) step = Math.max(5_000, Math.round(baseStep / 10));
  else if (abs < 1_00_00_000) step = Math.max(25_000, Math.round(baseStep / 4));
  else if (abs < 10_00_00_000) step = Math.max(1_00_000, baseStep);
  else if (abs < 100_00_00_000) step = Math.max(10_00_000, baseStep * 10);
  else step = Math.max(1_00_00_000, baseStep * 50);
  return Math.round(raw / step) * step;
}

/**
 * Interaction flow:
 * - untouched → blue (ready), even if a default value is present
 * - focused → stronger blue
 * - touched + valid → green
 * - touched + invalid → red (errors only after interaction)
 */
type FieldVisual = "ready" | "focus" | "filled" | "error";

function resolveVisual(opts: {
  focused: boolean;
  touched: boolean;
  valid: boolean;
  error?: string;
}): FieldVisual {
  if (opts.focused) return "focus";
  if (opts.touched && opts.error) return "error";
  if (opts.touched && opts.valid) return "filled";
  return "ready";
}

function inputVisualClass(visual: FieldVisual) {
  switch (visual) {
    case "focus":
      return "border-[var(--v2-input-blue)] bg-[var(--v2-surface)] shadow-[0_0_0_3px_var(--v2-input-blue-ring)]";
    case "filled":
      return "border-[var(--v2-accent)] bg-[var(--v2-accent-soft)]";
    case "error":
      return "border-[var(--v2-danger)] bg-[var(--v2-danger-soft)]";
    default:
      return "border-[var(--v2-input-ready)] bg-[var(--v2-surface)]";
  }
}

const inputBaseClass = cn(
  "h-8 w-full rounded-[var(--v2-radius)] border bg-[var(--v2-surface)] px-2 text-[13px] tabular-nums text-[var(--v2-ink)] outline-none",
  "placeholder:text-[var(--v2-faint)]",
  TRANSITION,
);

function FieldFrame({
  label,
  hint,
  error,
  showError,
  className,
  widthClass,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  showError: boolean;
  className?: string;
  widthClass?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex shrink-0 flex-col", widthClass, className)}>
      <label htmlFor={htmlFor} className={labelClass} title={label}>
        <span className="truncate">{label}</span>
      </label>
      <div className="mt-1">{children}</div>
      {(showError && error) || hint ? (
        <div className="mt-1">
          {showError && error ? (
            <p className={cn(errorClass, "!mt-0")}>{error}</p>
          ) : hint ? (
            <p className={cn(hintClass, "!mt-0")}>{hint}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function useFieldInteraction() {
  const resetKey = useContext(V2FormResetContext);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setFocused(false);
    setTouched(false);
  }, [resetKey]);

  return {
    focused,
    touched,
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false);
      setTouched(true);
    },
    markTouched: () => setTouched(true),
  };
}

export function V2TextField({
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  placeholder,
  autoComplete,
  className,
  width = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  width?: keyof typeof v2FieldWidth;
}) {
  const id = useId();
  const ix = useFieldInteraction();
  const valid = value.trim().length > 0 && !error;
  const visual = resolveVisual({
    focused: ix.focused,
    touched: ix.touched,
    valid,
    error,
  });

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      showError={ix.touched && Boolean(error)}
      className={className}
      widthClass={v2FieldWidth[width]}
      htmlFor={id}
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          ix.markTouched();
          onChange(e.target.value);
        }}
        onFocus={ix.onFocus}
        onBlur={ix.onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(inputBaseClass, inputVisualClass(visual))}
        style={{ fontVariantNumeric: "normal" }}
      />
    </FieldFrame>
  );
}

export function V2MoneyField({
  label,
  value,
  onChange,
  hint,
  error,
  max = V2_MONEY_INPUT_MAX,
  className,
  wide = false,
  slider,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  max?: number;
  className?: string;
  wide?: boolean;
  slider?: {
    min: number;
    max: number;
    step?: number;
    scale?: "linear" | "log";
  };
}) {
  const id = useId();
  const ix = useFieldInteraction();
  const [draft, setDraft] = useState<string | null>(null);
  const valid = Number.isFinite(value) && value > 0 && !error;
  const visual = resolveVisual({
    focused: ix.focused,
    touched: ix.touched,
    valid,
    error,
  });

  const display =
    draft != null
      ? draft
      : ix.focused
        ? value === 0
          ? ""
          : String(Math.round(value))
        : formatINR(value);

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      showError={ix.touched && Boolean(error)}
      className={className}
      widthClass={wide ? v2FieldWidth.moneyWide : v2FieldWidth.money}
      htmlFor={id}
    >
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[13px] text-[var(--v2-muted)]">
          ₹
        </span>
        <input
          id={id}
          inputMode="numeric"
          value={display}
          onFocus={() => {
            ix.onFocus();
            setDraft(value === 0 ? "" : String(Math.round(value)));
          }}
          onBlur={() => {
            ix.onBlur();
            setDraft(null);
          }}
          onChange={(e) => {
            ix.markTouched();
            const raw = e.target.value.replace(/[^0-9]/g, "");
            setDraft(raw);
            let next = raw === "" ? 0 : Number(raw);
            if (!Number.isFinite(next)) return;
            if (typeof max === "number" && next > max) next = max;
            onChange(next);
          }}
          className={cn(inputBaseClass, inputVisualClass(visual), "pl-6")}
        />
      </div>
      {slider ? (
        <V2Range
          value={value}
          onChange={(next) => {
            ix.markTouched();
            onChange(next);
          }}
          min={slider.min}
          max={slider.max}
          step={slider.step ?? 1_000}
          scale={slider.scale ?? (slider.max / Math.max(slider.min, 1) >= 50 ? "log" : "linear")}
          formatBound={(v) => formatAxisINR(v)}
          ariaLabel={`${label} slider`}
          active={ix.touched || ix.focused}
        />
      ) : null}
    </FieldFrame>
  );
}

export function V2PercentField({
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
  const id = useId();
  const ix = useFieldInteraction();
  const [draft, setDraft] = useState<string | null>(null);
  const valid = Number.isFinite(value) && value >= 0 && value <= 100 && !error;
  const visual = resolveVisual({
    focused: ix.focused,
    touched: ix.touched,
    valid,
    error,
  });

  const display =
    draft != null
      ? draft
      : Number.isFinite(value)
        ? String(value)
        : "";

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      showError={ix.touched && Boolean(error)}
      className={className}
      widthClass={v2FieldWidth.percent}
      htmlFor={id}
    >
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          value={display}
          onFocus={() => {
            ix.onFocus();
            setDraft(Number.isFinite(value) ? String(value) : "");
          }}
          onBlur={() => {
            ix.onBlur();
            setDraft(null);
          }}
          onChange={(e) => {
            ix.markTouched();
            const raw = e.target.value;
            if (raw === "" || raw === ".") {
              setDraft(raw);
              onChange(0);
              return;
            }
            if (!/^\d*\.?\d*$/.test(raw)) return;
            setDraft(raw);
            const next = Number(raw);
            if (Number.isFinite(next)) onChange(next);
          }}
          className={cn(inputBaseClass, inputVisualClass(visual), "pr-7")}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[var(--v2-muted)]">
          %
        </span>
      </div>
    </FieldFrame>
  );
}

export function V2NumberField({
  label,
  value,
  onChange,
  hint,
  error,
  min,
  max,
  suffix,
  width = "years",
  className,
  slider,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  min?: number;
  max?: number;
  suffix?: string;
  width?: "age" | "years" | "months" | "days";
  className?: string;
  slider?: { min: number; max: number; step?: number };
}) {
  const id = useId();
  const ix = useFieldInteraction();
  const [draft, setDraft] = useState<string | null>(null);
  const valid =
    Number.isFinite(value) &&
    !error &&
    (min == null || value >= min) &&
    (max == null || value <= max);
  const visual = resolveVisual({
    focused: ix.focused,
    touched: ix.touched,
    valid,
    error,
  });

  const display =
    draft != null ? draft : Number.isFinite(value) ? String(value) : "";

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      showError={ix.touched && Boolean(error)}
      className={className}
      widthClass={v2FieldWidth[width]}
      htmlFor={id}
    >
      <div className="relative">
        <input
          id={id}
          inputMode="numeric"
          value={display}
          onFocus={() => {
            ix.onFocus();
            setDraft(Number.isFinite(value) ? String(value) : "");
          }}
          onBlur={() => {
            ix.onBlur();
            setDraft(null);
          }}
          onChange={(e) => {
            ix.markTouched();
            const raw = e.target.value.replace(/[^0-9]/g, "");
            setDraft(raw);
            if (raw === "") {
              onChange(typeof min === "number" ? min : 0);
              return;
            }
            let next = Number(raw);
            if (!Number.isFinite(next)) return;
            next = Math.round(next);
            if (typeof max === "number") next = Math.min(max, next);
            onChange(next);
          }}
          className={cn(inputBaseClass, inputVisualClass(visual), suffix && "pr-10")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--v2-faint)]">
            {suffix}
          </span>
        ) : null}
      </div>
      {slider ? (
        <V2Range
          value={value}
          onChange={(next) => {
            ix.markTouched();
            onChange(next);
          }}
          min={slider.min}
          max={slider.max}
          step={slider.step ?? 1}
          scale="linear"
          formatBound={(v) => String(v)}
          ariaLabel={`${label} slider`}
          active={ix.touched || ix.focused}
        />
      ) : null}
    </FieldFrame>
  );
}

function V2Range({
  value,
  onChange,
  min,
  max,
  step,
  scale = "linear",
  formatBound,
  ariaLabel,
  active = false,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  scale?: "linear" | "log";
  formatBound: (value: number) => string;
  ariaLabel: string;
  active?: boolean;
}) {
  const clamped = clamp(value, min, max);
  const pos = toPos(clamped, min, max, scale);
  const pct = (pos / SLIDER_RES) * 100;
  const fill = active ? "var(--v2-accent)" : "var(--v2-input-blue)";

  return (
    <div className="mt-1.5 w-full">
      <input
        type="range"
        min={0}
        max={SLIDER_RES}
        step={1}
        value={pos}
        aria-label={ariaLabel}
        onChange={(e) => {
          const raw = fromPos(Number(e.target.value), min, max, scale);
          const rounded = adaptiveRound(raw, step, scale);
          onChange(clamp(rounded, min, max));
        }}
        className="v2-range h-1 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, ${fill} ${pct}%, var(--v2-border) ${pct}%)`,
        }}
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-[var(--v2-faint)]">
        <span>{formatBound(min)}</span>
        <span>{formatBound(max)}</span>
      </div>
    </div>
  );
}

export function V2FieldRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start gap-x-3 gap-y-2", className)}>
      {children}
    </div>
  );
}

export function V2ViewToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-bg)] p-0.5">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-[var(--v2-radius-sm)] px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
              active
                ? "bg-[var(--v2-navy)] text-[var(--v2-navy-fg)]"
                : "text-[var(--v2-muted)] hover:text-[var(--v2-ink)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
