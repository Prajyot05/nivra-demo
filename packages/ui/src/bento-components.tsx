import type { ReactNode } from "react";

export function ClientProfileBar({
  name,
  age,
  goal = "Capital Growth",
  strategy = "Systematic Rupee Cost Averaging",
  kycVerified = false,
  riskProfile,
  email,
  phone,
  tabs,
}: {
  name: string;
  age: number;
  goal?: string;
  strategy?: string;
  kycVerified?: boolean;
  riskProfile?: string;
  email?: string;
  phone?: string;
  tabs?: ReactNode;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center">
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-sm font-bold text-slate-700">
          {initials || "??"}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{name || "Valued Client"}</h2>
            {kycVerified ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                KYC Verified
              </span>
            ) : null}
            {riskProfile ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {riskProfile}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Age: <span className="font-semibold text-slate-700">{age || 0} Years</span>
            {email ? (
              <>
                {" "}
                &bull; Email: <span className="font-semibold text-slate-700">{email}</span>
              </>
            ) : null}
            {phone ? (
              <>
                {" "}
                &bull; Phone: <span className="font-semibold text-slate-700">{phone}</span>
              </>
            ) : null}
            {" "}
            &bull; Strategy: {strategy} &bull; Goal: {goal}
          </p>
        </div>
      </div>
      {tabs ? (
        <div className="inline-flex self-start rounded-xl border border-slate-200/60 bg-slate-100 p-1 md:self-auto">
          {tabs}
        </div>
      ) : null}
    </section>
  );
}

export function BentoSection({
  title,
  description,
  sectionId = "01",
  actions,
  children,
  className = "",
  collapsible = false,
  open = true,
  onToggle,
}: {
  title: string;
  description: string;
  sectionId?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section
      className={`mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7 ${className}`}
    >
      <div className="mb-0 flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Section {sectionId}
            </span>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
            {collapsible ? (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
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
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        {actions ? <div className="flex items-center gap-2.5 text-xs">{actions}</div> : null}
      </div>
      {open ? (
        <div className="mt-6 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">{children}</div>
      ) : null}
    </section>
  );
}

export function BentoGroup({
  num,
  title,
  subtitle,
  children,
  footer,
  colSpan = 4,
}: {
  num: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  colSpan?: 3 | 4 | 5 | 8 | 9 | 12;
}) {
  const colSpanClass =
    colSpan === 3
      ? "lg:col-span-3"
      : colSpan === 5
        ? "lg:col-span-5"
        : colSpan === 8
          ? "lg:col-span-8"
          : colSpan === 9
            ? "lg:col-span-9"
            : colSpan === 12
              ? "lg:col-span-12"
              : "lg:col-span-4";

  const bgClass = ["02"].includes(num)
    ? "bg-white hover:border-emerald-300"
    : "bg-slate-50/60 hover:border-slate-300";
  const numBadgeColor = ["02"].includes(num)
    ? "bg-emerald-100 text-emerald-800"
    : "bg-slate-200 text-slate-700";

  return (
    <div
      className={`${colSpanClass} ${bgClass} flex flex-col justify-between rounded-2xl border border-slate-200 p-4 transition-all sm:p-5`}
    >
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-slate-200/70 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${numBadgeColor}`}
            >
              {num}
            </span>
            <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-700">
              {title}
            </h3>
          </div>
          {subtitle ? (
            <div className="shrink-0 whitespace-nowrap text-right text-[11px] font-medium text-slate-400">
              {subtitle}
            </div>
          ) : null}
        </div>
        {children}
      </div>
      {footer ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-[11px] text-slate-500">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function ComplianceFootnote({ children }: { children?: ReactNode }) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-100/70 p-4 text-[11px] leading-relaxed text-slate-500">
        <svg
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <div>
          <p className="font-semibold text-slate-700">Statutory Tax & Projection Disclaimer</p>
          <p className="mt-0.5">
            {children ||
              "Calculations shown are for illustration purposes and assume Section 112A LTCG threshold exemptions under the Finance Act 2024. Mutual Fund returns are compounded monthly. Fixed Deposit returns assume quarterly compounding taxed annually at the investor's marginal rate. Mutual fund investments are subject to market risks; read all scheme related documents carefully."}
          </p>
        </div>
      </div>
      <p className="pb-2 text-center text-[11px] font-medium tracking-wide text-slate-400">
        Powered by <span className="font-semibold text-emerald-700">Nivra</span>
      </p>
    </div>
  );
}
