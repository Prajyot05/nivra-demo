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
        className={`block text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-subtle)] sm:text-[11px] ${
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
  "flex h-9 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-sm tabular-nums text-[var(--app-text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10";

export const inputErrorClass =
  "border-[var(--app-danger)] focus-visible:ring-[var(--app-danger)]";

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
