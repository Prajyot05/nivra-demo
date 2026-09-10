import { Field, TextInput, inputErrorClass } from "./field";

export function PercentInput({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="relative">
        <TextInput
          type="number"
          step="0.01"
          min={0}
          max={100}
          className={`pr-6 ${error ? inputErrorClass : ""}`}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--app-text-muted)]">
          %
        </span>
      </div>
    </Field>
  );
}
