import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  wrapLabel = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  /** Allow multi-line labels instead of truncating. */
  wrapLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span
        className={`block text-[11px] font-bold uppercase tracking-wider text-slate-500 ${
          wrapLabel ? "whitespace-normal leading-snug" : "truncate"
        }`}
        title={label}
      >
        {label}
      </span>
      {children}
      {error ? (
        <span
          className="text-[11px] leading-snug font-medium text-[var(--app-danger)]"
          title={error}
        >
          {error}
        </span>
      ) : hint ? (
        <span
          className={`${wrapLabel ? "whitespace-normal" : "truncate"} text-[11px] leading-snug text-[var(--app-text-muted)]`}
          title={hint}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold tabular-nums text-slate-800 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm";

export const inputErrorClass =
  "border-[var(--app-danger)] focus-visible:ring-[var(--app-danger)]/30 focus-visible:border-[var(--app-danger)]";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={className ? `${inputClass} ${className}` : inputClass} />;
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  hint,
  error,
  wrapLabel = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  error?: string;
  wrapLabel?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} wrapLabel={wrapLabel}>
      <select
        className={className ? `${inputClass} ${className}` : inputClass}
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
