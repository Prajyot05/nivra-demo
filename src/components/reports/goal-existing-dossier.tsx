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

export type GoalExistingReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  goalAmount: number;
  tenureYears: number;
  returnPct: number;
  inflationPct: number;
  taxPct: number;
  stepUpPct: number;
  useInflAdj: boolean;
  currentMonthlySip: number;
  inflAdjGoal: number;
  targetGoal: number;
  shortfall: number;
  overfunded?: boolean;
  existing: {
    sipFv: number;
    sipInvested: number;
    totalInvested: number;
    netCredit: number;
  };
  lumpsum: {
    lumpsum: number;
    invested: number;
    maturity: number;
    gain: number;
    tax: number;
    netAfterTax: number;
  };
  standard: {
    monthlySip: number;
    invested: number;
    maturity: number;
    gain: number;
    tax: number;
    netAfterTax: number;
  };
  stepUp: {
    monthlySip: number;
    endMonthlySip?: number;
    invested: number;
    maturity: number;
    gain: number;
    tax: number;
    netAfterTax: number;
  };
  schedule: Array<{
    year: number;
    existingEnd: number;
    sipMonthly: number;
    sipYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
    combinedSipEnd: number;
  }>;
};

type GoalExistingDossierProps = {
  id?: string;
  data: GoalExistingReportData;
};

export const GOAL_EXISTING_REPORT_ID = "goal-existing-report";

/**
 * Goal with Existing SIP off-screen dossier (keep running SIP + additional paths).
 */
export function GoalExistingDossier({
  id = GOAL_EXISTING_REPORT_ID,
  data,
}: GoalExistingDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const years = data.schedule.length || data.tenureYears;
  const endAge = data.age + data.tenureYears;
  const stepEnd = data.stepUp.endMonthlySip ?? data.stepUp.monthlySip;

  const playbook = getReportPlaybook("goal-existing").map((p) =>
    p.id === "01"
      ? {
          ...p,
          description: `Keep the existing SIP of ${formatINRCurrency(data.currentMonthlySip)}/mo running. Add ${formatINRCurrency(data.standard.monthlySip)}/mo flat (or ${formatINRCurrency(data.lumpsum.lumpsum)} lumpsum today) so the ${formatINRCurrency(data.shortfall)} shortfall closes by year ${years}.`,
        }
      : p.id === "02"
        ? {
            ...p,
            description: `Compare extra lumpsum (${formatINRCurrency(data.lumpsum.lumpsum)}), flat SIP (${formatINRCurrency(data.standard.monthlySip)}/mo), and step-up (${formatINRCurrency(data.stepUp.monthlySip)}/mo start, ending near ${formatINRCurrency(stepEnd)}/mo). Pick one path that fits cashflow.`,
          }
        : p,
  );

  const ageRows = data.schedule;
  const truncated = ageRows.length > 15;
  const shown = truncated
    ? [...ageRows.slice(0, 8), ...ageRows.slice(-7)]
    : ageRows;
  const midOmit = truncated ? Math.max(0, ageRows.length - 15) : 0;

  const fundingSteps = [
    { label: "Existing SIP credit", value: data.existing.netCredit, tone: "slate" as const },
    { label: "Additional needed", value: data.shortfall, tone: "amber" as const },
    { label: "Target goal", value: data.targetGoal, tone: "emerald" as const },
  ];

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Goal with Existing SIP"
      subtitle="Existing SIP + additional funding paths"
      contact={contact}
      disclaimer={false}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Timeline",
          value: `Age ${data.age} to ${endAge} (${data.tenureYears} Yrs)`,
        },
        {
          label: "Add. SIP",
          value: formatINRCurrency(data.standard.monthlySip),
          emphasize: "emerald",
        },
      ]}
    >
      {/* ── Page 1 ── */}
      <section className="space-y-4" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Goal Funding Snapshot"
          hint={`${formatPercent(data.returnPct)} CAGR · ${data.useInflAdj ? "Inflation-adjusted" : "Stated"} goal`}
        />

        <div className="flex gap-3">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
            <div className="border-b border-slate-800 pb-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Keep running
              </span>
              <h3 className="text-sm font-bold text-slate-100">Existing SIP</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white">
                {formatINRCurrency(data.currentMonthlySip)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
            <div className="flex gap-3 border-t border-slate-800 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.existing.sipInvested || data.existing.totalInvested)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">SIP FV</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.existing.sipFv)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Net credit</span>
                <span className="block truncate font-medium tabular-nums text-emerald-300">
                  {formatINRCurrency(data.existing.netCredit)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="border-b border-emerald-200/60 pb-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Additional path
              </span>
              <h3 className="text-sm font-bold text-emerald-950">Additional SIP</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950">
                {formatINRCurrency(data.standard.monthlySip)}
              </span>
              <span className="text-xs font-semibold text-emerald-800">/ month</span>
            </div>
            <div className="flex gap-3 border-t border-emerald-200/60 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Step-up start</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {formatINRCurrency(data.stepUp.monthlySip)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Lumpsum today</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {formatINRCurrency(data.lumpsum.lumpsum)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Add. tax</span>
                <span className="block truncate font-medium tabular-nums text-rose-600">
                  {formatINRCurrency(data.standard.tax)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex w-[26%] min-w-[10.5rem] flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Net target
              </span>
              <h3 className="text-sm font-bold text-slate-900">Target Goal</h3>
            </div>
            <div className="py-2.5">
              <span className="block text-2xl font-black tracking-tight tabular-nums text-emerald-700">
                {formatINRCurrency(data.targetGoal)}
              </span>
              <span className="mt-1 block text-[10px] text-slate-500">After capital gains tax</span>
            </div>
            <div className="border-t border-slate-100 pt-2.5 text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Shortfall</span>
                <span className="font-semibold tabular-nums text-amber-800">
                  {formatINRCurrency(data.shortfall)}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-800">
                  {data.overfunded ? "Overfunded" : "On track"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700">
          <strong>Note.</strong> Existing SIP credit of{" "}
          <strong>{formatINRCurrency(data.existing.netCredit)}</strong> is already priced in.
          Fund the remaining <strong>{formatINRCurrency(data.shortfall)}</strong> with one
          additional path over {years} years. Do not pause the current SIP.
        </p>
      </section>

      <section className="mt-5 space-y-2.5" data-purpose="assumptions">
        <ExecutiveSectionHeading title="Goal Basis & Assumptions" />
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stated
            </span>
            <span className="mt-1 block text-sm font-bold tabular-nums text-slate-900">
              {formatINRCurrency(data.goalAmount)}
            </span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Infl. Adj.
            </span>
            <span className="mt-1 block text-sm font-bold tabular-nums text-amber-950">
              {formatINRCurrency(data.inflAdjGoal)}
            </span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Active ({data.useInflAdj ? "Infl." : "Stated"})
            </span>
            <span className="mt-1 block text-sm font-bold tabular-nums text-emerald-900">
              {formatINRCurrency(data.targetGoal)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-center">
          <Param label="Age" value={`${data.age}y`} />
          <Param label="Tenure" value={`${data.tenureYears}y`} />
          <Param
            label="Return"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Inflation" value={formatPercent(data.inflationPct)} />
          <Param label="Tax" value={formatPercent(data.taxPct)} />
          <Param
            label="Step-Up"
            value={formatPercent(data.stepUpPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Current SIP" value={formatINRCurrency(data.currentMonthlySip)} />
        </div>
      </section>

      <section className="mt-5 space-y-2.5" data-purpose="funding-options" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Additional Funding Options"
          hint="Each path alone closes the residual shortfall"
        />
        <div className="grid grid-cols-3 gap-3">
          <OptionCard
            eyebrow="Option A"
            title="Extra Lumpsum"
            primary={formatINRCurrency(data.lumpsum.lumpsum)}
            primaryHint="one-time today"
            rows={[
              { label: "Invested", value: formatINRCurrency(data.lumpsum.invested) },
              { label: "Net after tax", value: formatINRCurrency(data.lumpsum.netAfterTax) },
            ]}
          />
          <OptionCard
            eyebrow="Option B"
            title="Extra SIP"
            primary={formatINRCurrency(data.standard.monthlySip)}
            primaryHint="/ month"
            accent
            rows={[
              { label: "Total invested", value: formatINRCurrency(data.standard.invested) },
              { label: "Net after tax", value: formatINRCurrency(data.standard.netAfterTax) },
            ]}
          />
          <OptionCard
            eyebrow="Option C"
            title="Extra Step-Up"
            primary={formatINRCurrency(data.stepUp.monthlySip)}
            primaryHint="/ mo start"
            rows={[
              { label: "End SIP", value: formatINRCurrency(stepEnd) },
              { label: "Total invested", value: formatINRCurrency(data.stepUp.invested) },
            ]}
          />
        </div>
      </section>

      {/* ── Page 2 ── */}
      <section
        className="mt-6 space-y-3"
        data-purpose="funding-composition"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="How the Goal Is Funded"
          hint="Existing credit · Additional shortfall · Target"
        />
        <div className="flex items-stretch gap-4">
          <div className="w-[36%] min-w-0 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Funding stack
            </span>
            <div className="mt-2.5 space-y-2">
              {fundingSteps.map((step, i) => (
                <div
                  key={step.label}
                  className={`rounded-lg border px-2.5 py-2 ${
                    step.tone === "emerald"
                      ? "border-emerald-200 bg-emerald-50/70"
                      : step.tone === "amber"
                        ? "border-amber-200 bg-amber-50/50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-semibold text-slate-600">
                      {String(i + 1).padStart(2, "0")} · {step.label}
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        step.tone === "emerald"
                          ? "text-emerald-900"
                          : step.tone === "amber"
                            ? "text-amber-900"
                            : "text-slate-900"
                      }`}
                    >
                      {formatINRCurrency(step.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
              <div className="flex justify-between gap-2">
                <span>Existing SIP FV</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatINRCurrency(data.existing.sipFv)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Current SIP / mo</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatINRCurrency(data.currentMonthlySip)}
                </span>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Additional SIP mix"
              centerLabel="Net After Tax"
              centerValue={data.standard.netAfterTax}
              invested={data.standard.invested}
              gain={data.standard.gain}
              tax={data.standard.tax}
              taxLabel="Capital Gains Tax"
              accent
            />
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-3" data-purpose="yearly-schedule">
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Yearly Accumulation Schedule" />
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Existing
            </span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Add. SIP / Step-Up
            </span>
          </div>
        </div>

        {truncated ? (
          <p className="text-xs text-slate-500">
            Showing the first 8 and last 7 years of {ageRows.length} modeled years ({midOmit}{" "}
            omitted).
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-2.5 py-2.5 text-center font-bold" scope="col">
                  Yr
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Existing
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Add. SIP
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  SIP End
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold text-emerald-300" scope="col">
                  Step SIP
                </th>
                <th
                  className="bg-slate-800/80 px-2.5 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Step End
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold" scope="col">
                  Combined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shown.map((row, i) => {
                const isLast = row.year === years;
                const mid = Math.ceil(years / 2);
                const isMid = row.year === mid;
                const showEllipsis = truncated && i === 8 && midOmit > 0;

                return (
                  <ScheduleRow
                    key={row.year}
                    row={row}
                    isLast={isLast}
                    isMid={isMid}
                    showEllipsisBefore={showEllipsis}
                    midOmit={midOmit}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 space-y-4" data-pdf-keep-together>
        <ExecutivePlaybook pillars={playbook} />
        <footer className="border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-slate-500">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Disclaimer
          </span>
          <p>
            This report is for illustrative planning only. Return and inflation assumptions are not
            guaranteed. Mutual fund investments are subject to market risks. Please read all
            scheme-related documents carefully before investing.
          </p>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            Powered by <span className="font-medium text-slate-600">Nivra</span>
          </p>
        </footer>
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
    <div className="min-w-[5rem] flex-1 border-r border-slate-100 pr-3 last:border-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className={`mt-1 block text-sm font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function OptionCard({
  eyebrow,
  title,
  primary,
  primaryHint,
  rows,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  primary: string;
  primaryHint: string;
  rows: Array<{ label: string; value: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 shadow-sm ${
        accent ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"
      }`}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${
          accent ? "text-emerald-800" : "text-slate-400"
        }`}
      >
        {eyebrow}
      </span>
      <h3 className={`mt-0.5 text-sm font-bold ${accent ? "text-emerald-950" : "text-slate-900"}`}>
        {title}
      </h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-xl font-black tabular-nums ${
            accent ? "text-emerald-950" : "text-slate-950"
          }`}
        >
          {primary}
        </span>
        <span className={`text-[10px] ${accent ? "text-emerald-700" : "text-slate-500"}`}>
          {primaryHint}
        </span>
      </div>
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px]">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-2">
            <span className="text-slate-500">{row.label}</span>
            <span className="font-semibold tabular-nums text-slate-800">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleRow({
  row,
  isLast,
  isMid,
  showEllipsisBefore,
  midOmit,
}: {
  row: GoalExistingReportData["schedule"][number];
  isLast: boolean;
  isMid: boolean;
  showEllipsisBefore: boolean;
  midOmit: number;
}) {
  return (
    <>
      {showEllipsisBefore ? (
        <tr className="bg-slate-50">
          <td
            colSpan={7}
            className="px-2.5 py-2 text-center text-[11px] font-medium text-slate-500"
          >
            … {midOmit} years omitted …
          </td>
        </tr>
      ) : null}
      {isLast ? (
        <tr className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold">
          <td className="px-2.5 py-2.5 text-center text-sm font-black text-emerald-950">
            {row.year}
          </td>
          <td className="px-2.5 py-2.5 text-right text-emerald-900">
            {formatINRCurrency(row.existingEnd)}
          </td>
          <td className="px-2.5 py-2.5 text-right text-emerald-900">
            {formatINRCurrency(row.sipMonthly)}
          </td>
          <td className="px-2.5 py-2.5 text-right font-black text-emerald-950">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="px-2.5 py-2.5 text-right text-emerald-900">
            {formatINRCurrency(row.stepMonthly)}
          </td>
          <td className="bg-emerald-200/60 px-2.5 py-2.5 text-right font-black text-emerald-950">
            {formatINRCurrency(row.stepYearEnd)}
          </td>
          <td className="px-2.5 py-2.5 text-right font-black text-emerald-950">
            {formatINRCurrency(row.combinedSipEnd)}
          </td>
        </tr>
      ) : isMid ? (
        <tr className="bg-amber-50/40">
          <td className="px-2.5 py-2 text-center font-black text-amber-900">{row.year}</td>
          <td className="px-2.5 py-2 text-right">{formatINRCurrency(row.existingEnd)}</td>
          <td className="px-2.5 py-2 text-right">{formatINRCurrency(row.sipMonthly)}</td>
          <td className="px-2.5 py-2 text-right font-black text-amber-950">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="px-2.5 py-2 text-right text-emerald-900">
            {formatINRCurrency(row.stepMonthly)}
          </td>
          <td className="bg-emerald-50/40 px-2.5 py-2 text-right font-semibold text-emerald-950">
            {formatINRCurrency(row.stepYearEnd)}
          </td>
          <td className="px-2.5 py-2 text-right font-semibold">
            {formatINRCurrency(row.combinedSipEnd)}
          </td>
        </tr>
      ) : (
        <tr>
          <td className="px-2.5 py-2 text-center font-bold text-slate-900">{row.year}</td>
          <td className="px-2.5 py-2 text-right">{formatINRCurrency(row.existingEnd)}</td>
          <td className="px-2.5 py-2 text-right">{formatINRCurrency(row.sipMonthly)}</td>
          <td className="px-2.5 py-2 text-right font-semibold text-slate-900">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="px-2.5 py-2 text-right text-emerald-900">
            {formatINRCurrency(row.stepMonthly)}
          </td>
          <td className="bg-emerald-50/40 px-2.5 py-2 text-right font-semibold text-emerald-950">
            {formatINRCurrency(row.stepYearEnd)}
          </td>
          <td className="px-2.5 py-2 text-right font-semibold">
            {formatINRCurrency(row.combinedSipEnd)}
          </td>
        </tr>
      )}
    </>
  );
}
