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
    <label className="flex min-w-0 flex-col gap-1.5">
      <span
        className="block h-4 truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
        title={label}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span className="truncate text-[11px] leading-4 text-[var(--app-text-muted)]" title={hint}>
          {hint}
        </span>
      ) : null}
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
