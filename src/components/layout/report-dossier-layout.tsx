import { type ReactNode, useEffect, useState } from "react";

interface ReportDossierLayoutProps {
  id: string;
  title: string;
  subtitle?: string;
  clientName: string;
  horizon?: string;
  risk?: string;
  status?: string;
  children: ReactNode;
}

/** Off-screen executive dossier — classic Nivra theme, no website navbar */
export function ReportDossierLayout({
  id,
  title,
  subtitle = "Institutional Wealth Advisory Desk · Comprehensive Architecture",
  clientName,
  horizon = "Standard Long-Term",
  risk = "Balanced Growth",
  status = "Validated Model",
  children,
}: ReportDossierLayoutProps) {
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(Math.random().toString(36).substring(2, 12).toUpperCase());
  }, []);

  return (
    <div
      id={id}
      className="pointer-events-none fixed top-0 z-[-1] w-[1100px] bg-[#faf9f6] p-12 text-[#0f172a] flex flex-col gap-10"
      style={{
        left: "-120%",
        isolation: "isolate",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        // Classic theme chart tokens for nested Recharts
        ["--app-chart-invested" as string]: "#152033",
        ["--app-chart-gain" as string]: "#34d399",
        ["--app-chart-tax" as string]: "#f87171",
        ["--app-text" as string]: "#0f172a",
        ["--app-text-muted" as string]: "#64748b",
        ["--app-border" as string]: "#e2e8f0",
        ["--app-surface" as string]: "#ffffff",
        ["--app-primary" as string]: "#0f172a",
      }}
      aria-hidden
    >
      <div className="flex items-start justify-between border-b-[3px] border-[#e2e8f0] pb-6">
        <div className="flex gap-4 items-center">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-xl bg-[#152033] text-4xl font-bold text-white shadow-lg">
            N
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-1 text-[13px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              Nivra Private Wealth
            </div>
            <h1 className="text-[30px] font-black uppercase leading-none tracking-tight text-[#0f172a]">
              {title}
            </h1>
            <div className="mt-2 text-[14px] font-medium text-[#64748b]">{subtitle}</div>
          </div>
        </div>

        <div className="grid min-w-[280px] grid-cols-2 gap-x-10 gap-y-4 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 text-sm shadow-sm">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
              Client Name
            </div>
            <div className="text-[15px] font-bold text-[#0f172a]">{clientName}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
              Risk Classification
            </div>
            <div className="text-[15px] font-bold text-emerald-700">{risk}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
              Time Horizon
            </div>
            <div className="text-[15px] font-bold text-[#0f172a]">{horizon}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
              Status
            </div>
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-emerald-700">
              <span className="block h-2 w-2 rounded-full bg-emerald-500" />
              {status}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-10">{children}</div>

      <div className="mt-4 flex items-end justify-between border-t-[3px] border-[#e2e8f0] pt-8 pb-2">
        <div className="max-w-[70%]">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#94a3b8]">
            Statutory & Regulatory Disclosures
          </div>
          <p className="text-justify text-[10.5px] font-medium leading-relaxed text-[#94a3b8]">
            This advisory planning dossier is prepared by Nivra Private Advisory for private
            client review only. Return assumptions are as shown. Projections represent
            illustrative benchmarks and do not constitute a guaranteed return. Mutual fund
            investments are subject to market risks. Please read all scheme related documents
            carefully before investing.
          </p>
          <div className="mt-4 font-mono text-[9.5px] tracking-tight text-[#94a3b8]/80">
            SEBI REG. INVESTMENT ADVISOR · AMFI REGISTERED MFD
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <div className="text-sm font-bold text-[#0f172a]">Advisory Desk Lead</div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Private Client Practice
          </div>
          <div className="text-sm font-medium italic text-emerald-700/80">
            Digitally signed & validated
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase text-[#94a3b8]">Hash: {hash}</div>
        </div>
      </div>
    </div>
  );
}
