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

export type SipStepUpCalculatorReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  startMonthly: number;
  endMonthly: number;
  sipYears: number;
  returnPct: number;
  stepUpPct: number;
  inflationPct: number;
  taxPct: number;
  maturity: number;
  totalInvested: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  inflationAdjusted: number;
  schedule: Array<{
    year: number;
    monthly: number;
    investedToDate: number;
    yearEnd: number;
    inflationAdjusted?: number;
  }>;
};

type SipStepUpCalculatorDossierProps = {
  id?: string;
  data: SipStepUpCalculatorReportData;
};

export const SIP_STEPUP_CALCULATOR_REPORT_ID = "sip-stepup-calculator-report";

/**
 * SIP Step-Up Calculator off-screen dossier for PDF download (/growth · Step-up).
 * Matches Goal SIP / MF vs FD / SIP Calculator executive report style.
 */
export function SipStepUpCalculatorDossier({
  id = SIP_STEPUP_CALCULATOR_REPORT_ID,
  data,
}: SipStepUpCalculatorDossierProps) {
  const endAge = data.age + data.sipYears;
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };
  const inflGain = data.inflationAdjusted - data.totalInvested;
  const sipLift =
    data.startMonthly > 0
      ? ((data.endMonthly - data.startMonthly) / data.startMonthly) * 100
      : 0;

  const playbook = getReportPlaybook("investment-growth").map((p) =>
    p.id === "01"
      ? {
          ...p,
          title: "Start SIP at Comfortable Base",
          description: `Begin at ${formatINRCurrency(data.startMonthly)}/mo so the mandate clears without lifestyle strain. The modeled +${formatPercent(data.stepUpPct, 0)} annual step-up scales commitment to ${formatINRCurrency(data.endMonthly)}/mo by year ${data.sipYears}.`,
        }
      : p.id === "02"
        ? {
            ...p,
            title: "Sync Step-Up With Appraisal",
            description: `Automate the +${formatPercent(data.stepUpPct, 0)} top-up on the salary revision date each year so contribution growth compounds without a second behavioral decision.`,
          }
        : p.id === "03"
          ? {
              ...p,
              title: `Glidepath Before Year ${data.sipYears}`,
              description: `Begin shifting equity exposure toward short-duration debt or hybrids via STP in the final 2 to 3 years so the planned redemption is not hostage to a late-cycle drawdown.`,
            }
          : p,
  );

  return (
    <ExecutiveDossierSheet
      id={id}
      title="SIP Step-Up Calculator"
      subtitle="Institutional Wealth Advisory Desk • Escalating SIP Growth & Inflation Sensitivity"
      contact={contact}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Timeline Window",
          value: `Age ${data.age} to ${endAge} (${data.sipYears} Yrs)`,
        },
        {
          label: "Start SIP",
          value: formatINRCurrency(data.startMonthly),
          emphasize: "emerald",
        },
      ]}
    >
      <section className="space-y-4" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Corpus & Step-Up Path Milestones"
          hint={`${data.sipYears} yrs · +${formatPercent(data.stepUpPct, 0)} p.a. · ${formatPercent(data.returnPct)} CAGR`}
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
                Escalating Outlay Path
              </span>
              <h3 className="text-sm font-bold text-emerald-950">
                Step-Up SIP (+{formatPercent(data.stepUpPct, 0)} p.a.)
              </h3>
            </div>
            <div className="flex items-baseline space-x-2 py-4">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950 sm:text-4xl">
                {formatINRCurrency(data.startMonthly)}
              </span>
              <span className="text-xs font-semibold text-emerald-800">/ mo initial</span>
            </div>
            <div className="flex gap-2 border-t border-emerald-200/60 pt-3 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">End SIP</span>
                <span className="block truncate font-bold tabular-nums text-emerald-950">
                  {formatINRCurrency(data.endMonthly)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">SIP Lift</span>
                <span className="block truncate font-medium tabular-nums text-emerald-700">
                  +{formatPercent(sipLift, 0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Infl.-Adj.</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {formatINRCurrency(data.inflationAdjusted)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              <strong>Key Advisory Insight:</strong> Starting at{" "}
              {formatINRCurrency(data.startMonthly)}/mo with +{formatPercent(data.stepUpPct, 0)}{" "}
              annual escalation reaches {formatINRCurrency(data.endMonthly)}/mo by year{" "}
              {data.sipYears}, delivering <strong>{formatINRCurrency(data.maturity)}</strong>{" "}
              nominally and <strong>{formatINRCurrency(data.inflationAdjusted)}</strong> in today
              rupees.
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            Horizon: {data.sipYears} Yrs
          </span>
        </div>
      </section>

      <section className="space-y-3" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Actuarial & Financial Parameters Baseline" />
        <div className="grid grid-cols-8 gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param label="Start SIP" value={formatINRCurrency(data.startMonthly)} />
          <Param label="End SIP" value={formatINRCurrency(data.endMonthly)} />
          <Param label="Tenure" value={`${data.sipYears} Yrs`} />
          <Param
            label="Return CAGR"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param
            label="Annual Step-Up"
            value={formatPercent(data.stepUpPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Inflation" value={formatPercent(data.inflationPct)} />
          <Param label="Tax on Gains" value={formatPercent(data.taxPct)} />
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

      <section className="space-y-3" data-purpose="yearly-schedule" data-pdf-keep-together>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Yearly Accumulation & Step-Up Schedule" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Step-Up: +{formatPercent(data.stepUpPct, 0)} p.a.
            </span>
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Inflation-adjusted
            </span>
            <span className="text-slate-400">• {data.sipYears} Cycles</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 text-center font-bold" scope="col">
                  Yr
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 font-semibold text-emerald-300"
                  scope="col"
                >
                  Step-Up SIP (Mo)
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
                const isLast = row.year === data.sipYears;
                const mid = Math.ceil(data.sipYears / 2);
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
                      <td className="bg-emerald-200/60 px-3 py-3 font-bold text-emerald-950">
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
                      <td className="bg-emerald-50/40 px-3 py-2 font-medium text-emerald-900">
                        {formatINRCurrency(row.monthly)}
                      </td>
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
                    <td className="bg-emerald-50/40 px-3 py-2 text-emerald-900">
                      {formatINRCurrency(row.monthly)}
                    </td>
                    <td className="px-3 py-2">{formatINRCurrency(row.investedToDate)}</td>
                    <td className="px-4 py-2 font-semibold text-slate-900">
                      {formatINRCurrency(row.yearEnd)}
                    </td>
                    <td className="bg-emerald-50/40 px-4 py-2 font-semibold text-emerald-950">
                      {formatINRCurrency(infl)}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-slate-400">
                      {i === 0 ? "Initiation" : "Escalating"}
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
