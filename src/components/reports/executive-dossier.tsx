"use client";

import { type ReactNode } from "react";

export type ExecutiveMetaCell = {
  label: string;
  value: ReactNode;
  emphasize?: "emerald" | "status";
};

export type ExecutiveContact = {
  email?: string;
  phone?: string;
};

/** Dummy client contact until CRM / client profile is wired. */
export const DUMMY_REPORT_CONTACT: Required<ExecutiveContact> = {
  email: "client@email.com",
  phone: "+91 98765 43210",
};

type ExecutiveDossierSheetProps = {
  /** DOM id used by `generatePdfFromElement` */
  id: string;
  title: string;
  brandLine?: string;
  subtitle?: string;
  meta: ExecutiveMetaCell[];
  /** Client email / phone shown in the header meta card */
  contact?: ExecutiveContact;
  children: ReactNode;
  disclaimer?: string;
};

const DEFAULT_DISCLAIMER =
  "This report is for illustrative planning only. Return and inflation assumptions are not guaranteed. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.";

/**
 * Off-screen executive white dossier sheet, captured to PDF via html-to-image.
 */
export function ExecutiveDossierSheet({
  id,
  title,
  brandLine = "Finoptic Capital Services",
  subtitle = "Financial planning report",
  meta,
  contact = DUMMY_REPORT_CONTACT,
  children,
  disclaimer = DEFAULT_DISCLAIMER,
}: ExecutiveDossierSheetProps) {
  const email = contact.email?.trim() || DUMMY_REPORT_CONTACT.email;
  const phone = contact.phone?.trim() || DUMMY_REPORT_CONTACT.phone;

  const metaWithContact: ExecutiveMetaCell[] = [
    ...meta,
    { label: "Email", value: email },
    { label: "Phone", value: phone },
  ];

  return (
    <div
      id={id}
      className="pointer-events-none fixed flex w-[900px] flex-col bg-white p-10 text-slate-900"
      style={{
        // Fully off-screen (no transform) so it never intercepts selection/clicks
        left: "-10000px",
        top: 0,
        zIndex: -1,
        isolation: "isolate",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
      aria-hidden
    >
      <div className="flex flex-col gap-6">
        <header className="border-b border-slate-200 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/finoptic-logo.jpeg"
                alt="Finoptic Capital Services"
                className="h-14 w-auto max-w-[160px] shrink-0 object-contain object-left"
                crossOrigin="anonymous"
              />
              <div className="space-y-1.5">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-700">
                    {brandLine}
                  </span>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                    {title}
                  </h1>
                </div>
                <p className="text-xs font-medium text-slate-500">{subtitle}</p>
              </div>
            </div>

            {metaWithContact.length > 0 ? (
              <div className="flex max-w-[420px] flex-wrap gap-x-5 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                {metaWithContact.map((cell) => (
                  <div key={cell.label} className="min-w-[110px]">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {cell.label}
                    </span>
                    {cell.emphasize === "status" ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {cell.value}
                      </span>
                    ) : cell.emphasize === "emerald" ? (
                      <span className="font-semibold text-emerald-800">{cell.value}</span>
                    ) : (
                      <span className="break-all font-bold text-slate-900">{cell.value}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        {children}

        <footer className="border-t border-slate-200 pt-5 text-[11px] leading-relaxed text-slate-500">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Disclaimer
          </span>
          <p>{disclaimer}</p>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            Powered by <span className="font-medium text-slate-600">Nivra</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export function ExecutiveSectionHeading({
  title,
  hint,
  variant = "bar",
}: {
  title: string;
  hint?: ReactNode;
  variant?: "square" | "bar";
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {variant === "square" ? (
          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#059669" }} />
        ) : (
          <div className="h-3 w-1.5 rounded-sm" style={{ backgroundColor: "#0f172a" }} />
        )}
        <h2
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#0f172a" }}
        >
          {title}
        </h2>
      </div>
      {hint ? (
        <span className="text-[11px] font-medium" style={{ color: "#64748b" }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function ExecutivePlaybook({
  pillars,
}: {
  pillars: { id: string; title: string; description: string; accent?: boolean }[];
}) {
  return (
    <section className="flex flex-col gap-3" data-purpose="execution-playbook">
      <ExecutiveSectionHeading title="Next steps" />
      <div className="flex gap-4">
        {pillars.map((p) => (
          <div
            key={p.id}
            className="relative flex-1 rounded-xl border border-[#e2e8f0] bg-white p-4"
          >
            <span
              className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold"
              style={
                p.accent
                  ? { backgroundColor: "#d1fae5", color: "#065f46" }
                  : { backgroundColor: "#f1f5f9", color: "#334155" }
              }
            >
              {p.id}
            </span>
            <h4 className="text-xs font-bold" style={{ color: "#020617" }}>
              {p.title}
            </h4>
            <p
              className="mt-1 text-[11px] leading-relaxed"
              style={{ color: "#475569" }}
            >
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
