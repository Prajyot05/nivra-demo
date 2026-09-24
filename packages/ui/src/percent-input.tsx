import { Field, TextInput, inputErrorClass } from "./field";

export function PercentInput({
  label,
  value,
  onChange,
  hint,
  error,
  wrapLabel = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  wrapLabel?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error} wrapLabel={wrapLabel}>
      <div className="relative">
        <TextInput
          type="number"
          step="0.01"
          min={0}
          max={100}
          className={`pr-6 ${error ? inputErrorClass : ""}`}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            if (e.target.value === "") {
              onChange(0);
              return;
            }
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(Math.min(100, Math.max(0, n)));
          }}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--app-text-muted)]">
          %
        </span>
      </div>
    </Field>
  );
}
