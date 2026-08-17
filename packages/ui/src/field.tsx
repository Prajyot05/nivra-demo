import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)]">
        {label}
      </span>
      {children}
      {hint ? <span className="text-xs text-[var(--app-text-muted)]">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "flex h-10 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-sm tabular-nums text-[var(--app-text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
