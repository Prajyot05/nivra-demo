import { Field, TextInput, inputErrorClass } from "./field";

export function YearInput({
  label = "Tenure (yrs)",
  value,
  onChange,
  min = 1,
  max = 100,
  suffix,
  hint,
  error,
  wrapLabel = false,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
  error?: string;
  wrapLabel?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error} wrapLabel={wrapLabel}>
      <div className="relative">
        <TextInput
          type="number"
          min={min}
          max={max}
          className={`${suffix ? "pr-10" : ""} ${error ? inputErrorClass : ""}`.trim()}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? 0 : Number(raw));
          }}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--app-text-muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

export function AgeInput({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (age: number) => void;
  error?: string;
}) {
  return (
    <YearInput
      label="Age"
      value={value}
      onChange={onChange}
      min={0}
      max={120}
      suffix="Years"
      error={error}
    />
  );
}
