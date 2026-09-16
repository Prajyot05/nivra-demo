"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";
import {
  DUMMY_REPORT_CONTACT,
  ExecutiveDossierSheet,
  ExecutivePlaybook,
  ExecutiveSectionHeading,
  type ExecutiveContact,
} from "@/components/reports/executive-dossier";
import { ReportCompositionDonut } from "@/components/reports/report-composition-donut";
import { getReportPlaybook } from "@/lib/report-playbooks";

export type InsuranceIrrReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  premium: number;
  payTerm: number;
  corpusAtPayEnd: number;
  policyTerm: number;
  returnPct: number;
  taxPct: number;
  totalPremium: number;
  maturity: number;
  gain: number;
  tax: number;
  net: number;
  /** Decimal from engine (0.12 = 12%). */
  xirr: number;
  /** Decimal from engine (0.12 = 12%). */
  payTermRate: number;
};

type InsuranceIrrDossierProps = {
  id?: string;
  data: InsuranceIrrReportData;
};

export const INSURANCE_IRR_REPORT_ID = "insurance-irr-report";

/**
 * Insurance Policy IRR off-screen dossier.
 */
export function InsuranceIrrDossier({
  id = INSURANCE_IRR_REPORT_ID,
  data,
}: InsuranceIrrDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const xirrPct = Number.isFinite(data.xirr) ? data.xirr * 100 : null;
  const payTermRatePct = Number.isFinite(data.payTermRate)
    ? data.payTermRate * 100
    : null;
  const growthYears = Math.max(0, data.policyTerm - data.payTerm);
  const xirrGap =
    xirrPct == null ? null : Math.abs(data.returnPct - xirrPct);
  const multiplier =
    data.totalPremium > 0 ? data.net / data.totalPremium : 0;

  const playbook = getReportPlaybook("insurance").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: `Confirm life cover needs separately from this return path. The modeled net after tax is ${formatINRCurrency(data.net)} over ${data.policyTerm} years.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: `Annual premium of ${formatINRCurrency(data.premium)} for ${data.payTerm} years totals ${formatINRCurrency(data.totalPremium)}. Confirm this cashflow stays affordable for the full pay term.`,
          }
        : {
            ...pillar,
            description:
              xirrPct == null
                ? `Gross maturity is ${formatINRCurrency(data.maturity)} at the assumed ${formatPercent(data.returnPct)}. Treat the savings component as distinct from pure term cover.`
                : `Policy XIRR is ${formatPercent(xirrPct, 2)} versus assumed ${formatPercent(data.returnPct)}. Use a dedicated goal SIP when the need is pure wealth creation without cover.`,
          },
  );

  const moneySteps = [
    { label: "Premiums paid", value: data.totalPremium, tone: "slate" as const },
    { label: "Investment gain", value: data.gain, tone: "emerald" as const },
    { label: "Gross maturity", value: data.maturity, tone: "slate" as const },
    { label: "Capital gains tax", value: data.tax, tone: "rose" as const },
    { label: "Net after tax", value: data.net, tone: "emerald" as const },
  ];

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Insurance Policy IRR"
      subtitle="Maturity, tax, and effective policy return"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        {
          label: "Premium",
          value: formatINRCurrency(data.premium),
          emphasize: "emerald",
        },
        { label: "Pay term", value: `${data.payTerm} yrs` },
        { label: "Policy term", value: `${data.policyTerm} yrs` },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Gross outcome
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">Maturity value</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.maturity)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Premiums paid</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.totalPremium)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Pre-tax gain</span>
              <span className="font-semibold tabular-nums text-emerald-300">
                {formatINRCurrency(data.gain)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Assumed return</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatPercent(data.returnPct)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Growth years</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {growthYears} yrs
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            After tax
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">Net proceeds</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {formatINRCurrency(data.net)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">Capital gains tax</span>
              <span className="font-semibold tabular-nums text-rose-700">
                {formatINRCurrency(data.tax)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Tax rate</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatPercent(data.taxPct)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Policy XIRR</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {xirrPct == null ? "n/a" : formatPercent(xirrPct, 2)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Net / premiums</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {multiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-1" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Return snapshot
          </span>
          {xirrPct == null
            ? `XIRR could not be calculated for this cash-flow pattern. Assumed investment return is ${formatPercent(data.returnPct)}.`
            : xirrPct < data.returnPct
              ? `Policy XIRR ${formatPercent(xirrPct, 2)} is ${formatPercent(xirrGap ?? 0, 2)} below the assumed ${formatPercent(data.returnPct)}. Premium timing and tax pull the effective return down.`
              : `Policy XIRR ${formatPercent(xirrPct, 2)} meets or exceeds the assumed ${formatPercent(data.returnPct)}${xirrGap != null && xirrGap > 0.005 ? ` by ${formatPercent(xirrGap, 2)}` : ""}.`}
        </div>
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Annual Premium" value={formatINRCurrency(data.premium)} />
          <Param label="Pay Term" value={`${data.payTerm} Yrs`} />
          <Param label="Policy Term" value={`${data.policyTerm} Yrs`} />
          <Param
            label="Corpus at Pay End"
            value={formatINRCurrency(data.corpusAtPayEnd)}
          />
          <Param
            label="Expected Return"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="CG Tax" value={formatPercent(data.taxPct)} />
        </div>
      </section>

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Policy Timeline"
          hint={`${formatINRCurrency(data.premium)}/year for ${data.payTerm}y · matures in year ${data.policyTerm}`}
        />
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold" scope="col">
                  Phase
                </th>
                <th className="px-3 py-2.5 font-semibold" scope="col">
                  Years
                </th>
                <th
                  className="px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-3 py-2 font-semibold text-slate-900">Pay premiums</td>
                <td className="px-3 py-2 text-slate-700">
                  1 to {data.payTerm}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">
                  {formatINRCurrency(data.totalPremium)}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-900">Growth (no premiums)</td>
                <td className="px-3 py-2 text-slate-700">
                  {growthYears > 0
                    ? `${data.payTerm + 1} to ${data.policyTerm}`
                    : "None"}
                </td>
                <td className="px-3 py-2 text-right text-slate-500">
                  Corpus compounds
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-semibold text-slate-900">Gross maturity</td>
                <td className="px-3 py-2 text-slate-700">Year {data.policyTerm}</td>
                <td className="px-3 py-2 text-right font-semibold text-emerald-900">
                  {formatINRCurrency(data.maturity)}
                </td>
              </tr>
              <tr className="bg-emerald-50 font-semibold text-emerald-950">
                <td className="px-3 py-2">Net after tax</td>
                <td className="px-3 py-2">Year {data.policyTerm}</td>
                <td className="px-3 py-2 text-right">{formatINRCurrency(data.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="corpus-visual-analytics"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Maturity Composition"
          hint="Premiums / gain / tax"
        />
        <div className="flex items-stretch gap-3">
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Gross Maturity Mix"
              centerLabel="Gross"
              centerValue={data.maturity}
              invested={data.totalPremium}
              gain={data.gain}
              tax={data.tax}
              taxLabel="Capital Gains Tax"
              accent
              layout="row"
              compact
            />
          </div>
          <div className="w-[42%] min-w-0 shrink-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              How money moves
            </span>
            <div className="mt-3 space-y-2 text-[12px]">
              {moneySteps.map((step) => (
                <div key={step.label} className="flex items-center justify-between gap-3">
                  <span
                    className={
                      step.tone === "rose"
                        ? "text-rose-700"
                        : step.tone === "emerald"
                          ? "text-emerald-800"
                          : "text-slate-600"
                    }
                  >
                    {step.label}
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      step.tone === "rose"
                        ? "text-rose-700"
                        : step.tone === "emerald"
                          ? "text-emerald-950"
                          : "text-slate-900"
                    }`}
                  >
                    {formatINRCurrency(step.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="return-compare"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading title="Return Comparison" />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Assumed return"
            value={formatPercent(data.returnPct)}
            hint="Investment rate used for FV"
            tone="slate"
          />
          <SnapshotCard
            label="Policy XIRR"
            value={xirrPct == null ? "n/a" : formatPercent(xirrPct, 2)}
            hint="Full premium to maturity cashflows"
            tone="emerald"
          />
          <SnapshotCard
            label="Pay-term rate"
            value={
              payTermRatePct == null ? "n/a" : formatPercent(payTermRatePct, 2)
            }
            hint={`Over ${data.payTerm} premium years`}
            tone="slate"
          />
        </div>
      </section>

      <div className="mt-2" data-pdf-keep-together>
        <ExecutivePlaybook pillars={playbook} compact />
      </div>
    </ExecutiveDossierSheet>
  );
}

function Param({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0 border-r border-slate-100 pr-2 last:border-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span
        className={`mt-1 block truncate text-sm font-bold tabular-nums ${valueClass}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "slate" | "emerald" | "rose";
}) {
  const styles =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/50"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50/60"
        : "border-slate-200 bg-white";
  const labelCls =
    tone === "emerald"
      ? "text-emerald-800"
      : tone === "rose"
        ? "text-rose-800"
        : "text-slate-400";
  const valueCls =
    tone === "emerald"
      ? "text-emerald-950"
      : tone === "rose"
        ? "text-rose-950"
        : "text-slate-950";

  return (
    <div className={`rounded-xl border p-3.5 shadow-sm ${styles}`}>
      <span className={`block text-[10px] font-semibold uppercase tracking-wider ${labelCls}`}>
        {label}
      </span>
      <span className={`mt-1.5 block text-lg font-black tabular-nums ${valueCls}`}>{value}</span>
      <span className="mt-1 block text-[10px] font-medium text-slate-500">{hint}</span>
    </div>
  );
}
