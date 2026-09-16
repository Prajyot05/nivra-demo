import { Field, TextInput, inputErrorClass } from "./field";
import { formatINR, parseDigits } from "./format";

export function MoneyInput({
  label,
  value,
  onChange,
  hint,
  error,
  align = "left",
  wrapLabel = false,
  /** Trailing unit like YearInput ("Years") / PercentInput ("%"). Defaults to ₹. */
  suffix = "₹",
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  align?: "left" | "right";
  wrapLabel?: boolean;
  suffix?: string | null;
  max?: number;
}) {
  const showSuffix = Boolean(suffix);

  return (
    <Field label={label} hint={hint} error={error} wrapLabel={wrapLabel}>
      <div className="relative">
        <TextInput
          inputMode="numeric"
          className={`${showSuffix ? "pr-10" : ""} ${error ? inputErrorClass : ""} ${
            align === "right" ? "text-right" : ""
          }`.trim()}
          value={formatINR(value)}
          onChange={(e) => {
            let next = parseDigits(e.target.value.replace(/,/g, ""));
            if (typeof max === "number" && next > max) next = max;
            onChange(next);
          }}
        />
        {showSuffix ? (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--app-text-muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}
