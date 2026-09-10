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

export type SipCalculatorReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  monthlyInvestment: number;
  sipYears: number;
  investYears: number;
  returnPct: number;
  inflationPct: number;
  taxPct: number;
  delayMonths: number;
  maturity: number;
  totalInvested: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  inflationAdjusted: number;
  inflationAdjustedGain?: number;
  delayedMaturity: number | null;
  costOfDelay: number | null;
  schedule: Array<{
    year: number;
    monthly: number;
    investedToDate: number;
    yearEnd: number;
    inflationAdjusted?: number;
  }>;
};

type SipCalculatorDossierProps = {
  id?: string;
  data: SipCalculatorReportData;
};

export const SIP_CALCULATOR_REPORT_ID = "sip-calculator-report";

/**
 * SIP Calculator off-screen dossier for PDF download (/growth · SIP).
 * Matches Goal SIP / MF vs FD / One-Time executive report style.
 */
export function SipCalculatorDossier({
  id = SIP_CALCULATOR_REPORT_ID,
  data,
}: SipCalculatorDossierProps) {
  const endAge = data.age + data.investYears;
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };
  const hasDelay =
    data.delayMonths > 0 && data.costOfDelay != null && data.delayedMaturity != null;
  const inflGain =
    data.inflationAdjustedGain ?? data.inflationAdjusted - data.totalInvested;

  const playbook = getReportPlaybook("investment-growth").map((p) =>
    p.id === "01"
      ? {
          ...p,
          title: "Automate the Monthly Mandate",
          description: `Lock ${formatINRCurrency(data.monthlyInvestment)}/mo on ECS / OTM for ${data.sipYears} contribution years. Missed months permanently reduce the ${data.investYears}-year terminal corpus under the same return path.`,
        }
      : p.id === "02"
        ? {
            ...p,
            title: "Inflation Reality Check",
            description: `Headline maturity of ${formatINRCurrency(data.maturity)} is ${formatINRCurrency(data.inflationAdjusted)} in today rupees at ${formatPercent(data.inflationPct)} inflation. Frame client conversations on purchasing power, not nominal corpus alone.`,
          }
        : p.id === "03"
          ? {
              ...p,
              title: `Glidepath Before Year ${data.investYears}`,
              description: `Begin shifting equity exposure toward short-duration debt or hybrids via STP in the final 2 to 3 years so the planned redemption is not hostage to a late-cycle drawdown.`,
            }
          : p,
  );

  return (
    <ExecutiveDossierSheet
      id={id}
      title="SIP Calculator"
      subtitle="Institutional Wealth Advisory Desk • Systematic Investment Growth & Inflation Sensitivity"
      contact={contact}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Timeline Window",
          value: `Age ${data.age} to ${endAge} (${data.investYears} Yrs)`,
        },
        {
          label: "Monthly SIP",
          value: formatINRCurrency(data.monthlyInvestment),
          emphasize: "emerald",
        },
      ]}
    >
      <section className="space-y-4" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Corpus & Purchasing-Power Milestones"
          hint={`SIP ${data.sipYears} yrs · Horizon ${data.investYears} yrs · ${formatPercent(data.returnPct)} CAGR`}
        />

        <div className="flex gap-4">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
            <div className="border-b border-slate-800 pb-3">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Nominal Terminal Value
              </span>
              <h3 className="text-sm font-bold text-slate-100">Full Maturity Corpus</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-4">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white sm:text-4xl">
                {formatINRCurrency(data.maturity)}
              </span>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-3 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.totalInvested)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Pre-Tax Gain</span>
                <span className="block truncate font-medium tabular-nums text-emerald-300">
                  +{formatINRCurrency(data.gain)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Net After Tax</span>
                <span className="block truncate font-bold tabular-nums text-emerald-400">
                  {formatINRCurrency(data.netAfterTax)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="border-b border-emerald-200/60 pb-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Real Purchasing Power
              </span>
              <h3 className="text-sm font-bold text-emerald-950">Inflation-Adjusted Corpus</h3>
              <span className="mt-0.5 block text-[10px] font-semibold text-emerald-800">
                At {formatPercent(data.inflationPct, 2)} inflation
              </span>
            </div>
            <div className="flex items-baseline space-x-2 py-4">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950 sm:text-4xl">
                {formatINRCurrency(data.inflationAdjusted)}
              </span>
            </div>
            <div className="flex gap-2 border-t border-emerald-200/60 pt-3 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Real Gain</span>
                <span className="block truncate font-bold tabular-nums text-emerald-950">
                  +{formatINRCurrency(inflGain)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Tax Drag</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {formatINRCurrency(data.tax)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Monthly SIP</span>
                <span className="block truncate font-medium tabular-nums text-emerald-700">
                  {formatINRCurrency(data.monthlyInvestment)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              <strong>Key Advisory Insight:</strong>{" "}
              {formatINRCurrency(data.monthlyInvestment)}/mo for {data.sipYears} years grows to{" "}
              <strong>{formatINRCurrency(data.maturity)}</strong> nominally, but only{" "}
              <strong>{formatINRCurrency(data.inflationAdjusted)}</strong> in today rupees after{" "}
              {formatPercent(data.inflationPct)} inflation over the {data.investYears}-year horizon.
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            Horizon: {data.investYears} Yrs
          </span>
        </div>
      </section>

      <section className="space-y-3" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Actuarial & Financial Parameters Baseline" />
        <div className="grid grid-cols-8 gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param label="Monthly SIP" value={formatINRCurrency(data.monthlyInvestment)} />
          <Param label="SIP Years" value={`${data.sipYears} Yrs`} />
          <Param label="Horizon" value={`${data.investYears} Yrs`} />
          <Param
            label="Return CAGR"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Inflation" value={formatPercent(data.inflationPct)} />
          <Param label="Tax on Gains" value={formatPercent(data.taxPct)} />
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Delay
            </span>
            <span className="mt-1 inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-700">
              {data.delayMonths} MO
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4" data-purpose="corpus-visual-analytics">
        <ExecutiveSectionHeading
          title="Corpus Composition & Capital Gains Breakdown"
          hint="Invested · Pre-tax Gain · Tax · Net after tax"
        />
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Nominal Architecture"
              centerLabel="Maturity"
              centerValue={data.maturity}
              invested={data.totalInvested}
              gain={data.gain}
              tax={data.tax}
              taxLabel="Capital Tax"
            />
          </div>
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Real Purchasing Power"
              centerLabel="Today Rs"
              centerValue={data.inflationAdjusted}
              invested={data.totalInvested}
              gain={Math.max(0, inflGain)}
              tax={data.tax}
              taxLabel="Capital Tax"
              accent
            />
          </div>
        </div>
      </section>

      {hasDelay ? (
        <section
          className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/30 p-4"
          data-purpose="cost-of-delay"
          data-pdf-keep-together
        >
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                !
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Actuarial Cost of Inaction / SIP Delay
              </h3>
            </div>
            <span className="self-start rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 sm:self-auto">
              {data.delayMonths} Month Delay
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Delaying SIP inception by {data.delayMonths} months shortens the compounding window and
            reduces terminal wealth under identical return assumptions.
          </p>
          <div className="flex gap-3 pt-1">
            <div className="flex-1 rounded-lg border border-rose-100 bg-white p-3.5 shadow-sm">
              <div className="text-xs font-medium text-slate-500">On-time maturity</div>
              <div className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                {formatINRCurrency(data.maturity)}
              </div>
            </div>
            <div className="flex-1 rounded-lg border border-rose-100 bg-white p-3.5 shadow-sm">
              <div className="text-xs font-medium text-slate-500">Delayed maturity</div>
              <div className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                {formatINRCurrency(data.delayedMaturity!)}
              </div>
            </div>
            <div className="flex-1 rounded-lg border border-rose-200 bg-rose-50/20 p-3.5 shadow-sm">
              <div className="text-xs font-bold text-rose-800">Capital penalty</div>
              <div className="mt-1 text-sm font-black tabular-nums text-rose-900">
                +{formatINRCurrency(data.costOfDelay!)}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section
        className={`${hasDelay ? "mt-6" : ""} space-y-3`}
        data-purpose="yearly-schedule"
        data-pdf-keep-together
      >
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Yearly Accumulation & Inflation Schedule" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Full return
            </span>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Inflation-adjusted
            </span>
            <span className="text-slate-400">• {data.investYears} Cycles</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 text-center font-bold" scope="col">
                  Yr
                </th>
                <th className="px-3 py-2.5 font-semibold text-slate-300" scope="col">
                  SIP (Mo)
                </th>
                <th className="px-3 py-2.5 font-semibold text-slate-300" scope="col">
                  Invested
                </th>
                <th className="px-4 py-2.5 font-semibold text-slate-200" scope="col">
                  Full Return (End)
                </th>
                <th
                  className="bg-slate-800/80 px-4 py-2.5 font-semibold text-emerald-300"
                  scope="col"
                >
                  Inflation-Adjusted
                </th>
                <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                  Milestone
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.schedule.map((row, i) => {
                const isLast = row.year === data.investYears;
                const mid = Math.ceil(data.investYears / 2);
                const isMid = row.year === mid;
                const infl = row.inflationAdjusted ?? row.yearEnd;
                if (isLast) {
                  return (
                    <tr
                      key={row.year}
                      className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold"
                    >
                      <td className="px-3 py-3 text-center text-sm font-black text-emerald-950">
                        {row.year}
                      </td>
                      <td className="px-3 py-3 text-emerald-900">
                        {formatINRCurrency(row.monthly)}
                      </td>
                      <td className="px-3 py-3 text-emerald-900">
                        {formatINRCurrency(row.investedToDate)}
                      </td>
                      <td className="px-4 py-3 text-sm font-black text-emerald-950">
                        {formatINRCurrency(row.yearEnd)}
                      </td>
                      <td className="bg-emerald-200/60 px-4 py-3 text-sm font-black text-emerald-950">
                        {formatINRCurrency(infl)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-black text-emerald-800">
                        Horizon Close
                      </td>
                    </tr>
                  );
                }
                if (isMid) {
                  return (
                    <tr key={row.year} className="bg-amber-50/40">
                      <td className="px-3 py-2 text-center font-black text-amber-900">
                        {row.year}
                      </td>
                      <td className="px-3 py-2 font-medium">{formatINRCurrency(row.monthly)}</td>
                      <td className="px-3 py-2 font-medium">
                        {formatINRCurrency(row.investedToDate)}
                      </td>
                      <td className="px-4 py-2 font-black text-amber-950">
                        {formatINRCurrency(row.yearEnd)}
                      </td>
                      <td className="bg-emerald-50/40 px-4 py-2 font-semibold text-emerald-950">
                        {formatINRCurrency(infl)}
                      </td>
                      <td className="px-3 py-2 text-right text-[11px] font-bold text-amber-800">
                        Midpoint
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={row.year}>
                    <td className="px-3 py-2 text-center font-bold text-slate-900">{row.year}</td>
                    <td className="px-3 py-2">{formatINRCurrency(row.monthly)}</td>
                    <td className="px-3 py-2">{formatINRCurrency(row.investedToDate)}</td>
                    <td className="px-4 py-2 font-semibold text-slate-900">
                      {formatINRCurrency(row.yearEnd)}
                    </td>
                    <td className="bg-emerald-50/40 px-4 py-2 font-semibold text-emerald-950">
                      {formatINRCurrency(infl)}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-slate-400">
                      {i === 0 ? "Initiation" : "Compounding"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10" data-pdf-keep-together>
        <ExecutivePlaybook pillars={playbook} />
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
