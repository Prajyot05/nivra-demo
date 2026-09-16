import type { ReactNode } from "react";

/**
 * Collapsible results band (Section 02 / 03) matching MF vs FD / One-Time layout.
 */
export function ResultsSection({
  sectionId,
  title,
  description,
  open,
  onToggle,
  meta,
  children,
}: {
  sectionId: string;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Section {sectionId}
            </span>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
              title={open ? "Hide section" : "Show section"}
            >
              <svg
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        {meta}
      </div>
      {open ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export function nameError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Client name is required.";
  if (trimmed.length < 2) return "Enter at least 2 characters.";
  if (trimmed.length > 80) return "Name is too long (max 80 characters).";
  return undefined;
}

export function ageError(value: number): string | undefined {
  if (!Number.isFinite(value)) return "Age must be a valid number.";
  if (value < 18) return "Age must be at least 18 years.";
  if (value > 100) return "Age cannot exceed 100 years.";
  return undefined;
}

export function emailError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  if (trimmed.length > 120) return "Email is too long.";
  return undefined;
}

export function phoneError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Phone number is required.";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a valid 10-digit phone number.";
  if (digits.length > 12) return "Phone number is too long.";
  return undefined;
}

export function rateError(value: number, label: string): string | undefined {
  if (!Number.isFinite(value)) return `${label} must be a valid number.`;
  if (value < 0) return `${label} cannot be negative.`;
  if (value > 100) return `${label} cannot exceed 100%.`;
  return undefined;
}

/** Chart pane shell used under SegmentedChartControl (pill). */
export function ChartPane({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sm:p-8">
      {children}
    </div>
  );
}
