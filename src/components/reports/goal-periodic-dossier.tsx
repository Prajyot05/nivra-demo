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

const FREQ_LABEL: Record<number, string> = {
  1: "Yearly",
  2: "Half-yearly",
  3: "Every 4 months",
  4: "Quarterly",
  6: "Every 2 months",
  12: "Monthly",
};

export type GoalPeriodicReportData = {
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
  periodicAmount: number;
  timesPerYear: number;
  inflAdjGoal: number;
  targetGoal: number;
  shortfall: number;
  overfunded?: boolean;
  periodic: {
    maturity: number;
    totalInvested: number;
    payments: number;
    gain: number;
    tax: number;
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
    periodicPaid: number;
    periodicInvestedYtd: number;
    periodicCorpusEnd?: number;
    sipMonthly: number;
    sipYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
  }>;
};

type GoalPeriodicDossierProps = {
  id?: string;
  data: GoalPeriodicReportData;
};

export const GOAL_PERIODIC_REPORT_ID = "goal-periodic-report";

/**
 * Goal with Periodic Lumpsum off-screen dossier (periodic credit + remaining paths).
 */
export function GoalPeriodicDossier({
  id = GOAL_PERIODIC_REPORT_ID,
  data,
}: GoalPeriodicDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const years = data.schedule.length || data.tenureYears;
  const freqLabel = FREQ_LABEL[data.timesPerYear] ?? `${data.timesPerYear}x / year`;
  const yearlyPeriodic = data.periodicAmount * data.timesPerYear;
  const periodicGain =
    data.periodic.gain > 0
      ? data.periodic.gain
      : Math.max(0, data.periodic.maturity - data.periodic.totalInvested);
  const periodicTax =
    data.periodic.tax > 0
      ? data.periodic.tax
      : Math.max(0, data.periodic.maturity - data.periodic.netCredit);

  const playbook = getReportPlaybook("goal-periodic").map((p) =>
    p.id === "01"
      ? {
          ...p,
          description: `Keep the planned ${formatINRCurrency(data.periodicAmount)} ${freqLabel.toLowerCase()} contributions running. They already credit ${formatINRCurrency(data.periodic.netCredit)} toward the goal.`,
        }
      : p.id === "02"
        ? {
            ...p,
            description: data.overfunded
              ? `Periodic investments already fund the ${formatINRCurrency(data.targetGoal)} target. Do not add SIP, step-up, or lumpsum unless the goal rises.`
              : `Close the ${formatINRCurrency(data.shortfall)} shortfall with flat SIP (${formatINRCurrency(data.standard.monthlySip)}/mo), step-up (${formatINRCurrency(data.stepUp.monthlySip)}/mo start), or lumpsum today (${formatINRCurrency(data.lumpsum.lumpsum)}). Pick one path that fits cashflow.`,
          }
        : p,
  );

  const ageRows = data.schedule;
  const truncated = ageRows.length > 20;
  const shown = truncated
    ? [...ageRows.slice(0, 10), ...ageRows.slice(-10)]
    : ageRows;
  const midOmit = truncated ? Math.max(0, ageRows.length - 20) : 0;

  const fundingSteps = [
    { label: "Periodic net credit", value: data.periodic.netCredit, tone: "slate" as const },
    { label: "Additional needed", value: data.shortfall, tone: "amber" as const },
    { label: "Target goal", value: data.targetGoal, tone: "emerald" as const },
  ];

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Goal with Periodic Lumpsum"
      subtitle="Goal funding · Periodic investments"
      contact={contact}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        { label: "Tenure", value: `${data.tenureYears} Years` },
        {
          label: "Add. SIP",
          value: formatINRCurrency(data.standard.monthlySip),
          emphasize: "emerald",
        },
      ]}
    >
      <section className="space-y-3" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Goal Funding Milestones"
          hint={`${formatPercent(data.returnPct)} CAGR · ${data.useInflAdj ? "Inflation-adjusted goal" : "Stated goal"}`}
        />

        <div className="flex gap-3">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
            <div className="border-b border-slate-800 pb-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Remaining Path
              </span>
              <h3 className="text-sm font-bold text-slate-100">Additional SIP / Month</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white">
                {formatINRCurrency(data.standard.monthlySip)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Step-Up Start</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.stepUp.monthlySip)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Lumpsum Today</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.lumpsum.lumpsum)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">SIP Tax</span>
                <span className="block truncate font-medium tabular-nums text-rose-300">
                  {formatINRCurrency(data.standard.tax)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="border-b border-emerald-200/60 pb-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Goal
              </span>
              <h3 className="text-sm font-bold text-emerald-950">Target Goal</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950">
                {formatINRCurrency(data.targetGoal)}
              </span>
            </div>
            <div className="flex gap-2 border-t border-emerald-200/60 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Shortfall</span>
                <span className="block truncate font-bold tabular-nums text-emerald-950">
                  {formatINRCurrency(data.shortfall)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Periodic Credit</span>
                <span className="block truncate font-medium tabular-nums text-emerald-700">
                  {formatINRCurrency(data.periodic.netCredit)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Status</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {data.overfunded ? "Overfunded" : "On Track"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              <strong>Note:</strong> Planned periodic investments of{" "}
              <strong>
                {formatINRCurrency(data.periodicAmount)} {freqLabel.toLowerCase()}
              </strong>{" "}
              ({formatINRCurrency(yearlyPeriodic)} / year) credit{" "}
              <strong>{formatINRCurrency(data.periodic.netCredit)}</strong> toward the goal
              {data.overfunded ? (
                <>
                  , so the target is already funded without additional SIP.
                </>
              ) : (
                <>
                  , leaving a shortfall of <strong>{formatINRCurrency(data.shortfall)}</strong>{" "}
                  to fund via lumpsum, SIP, or step-up over {years} years.
                </>
              )}
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            {years} Yrs
          </span>
        </div>
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center sm:grid-cols-8">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param label="Goal Amount" value={formatINRCurrency(data.goalAmount)} />
          <Param label="Tenure" value={`${data.tenureYears} Yrs`} />
          <Param
            label="Return CAGR"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Inflation" value={formatPercent(data.inflationPct)} />
          <Param label="Tax" value={formatPercent(data.taxPct)} />
          <Param label="Periodic Amt" value={formatINRCurrency(data.periodicAmount)} />
          <Param label="Frequency" value={freqLabel} />
        </div>
      </section>

      <section className="space-y-2" data-purpose="funding-options">
        <ExecutiveSectionHeading
          title="Ways to Cover the Shortfall · LS vs SIP vs Step-Up"
          hint="Each path alone closes the residual after periodic credit"
        />
        <div className="grid grid-cols-3 gap-3">
          <OptionCard
            eyebrow="Option A"
            title="Lumpsum Today"
            primary={formatINRCurrency(data.lumpsum.lumpsum)}
            primaryHint="one-time today"
            rows={[
              { label: "Invested", value: formatINRCurrency(data.lumpsum.invested) },
              { label: "Net after tax", value: formatINRCurrency(data.lumpsum.netAfterTax) },
            ]}
          />
          <OptionCard
            eyebrow="Option B"
            title="Additional SIP"
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
            title="Step-Up SIP"
            primary={formatINRCurrency(data.stepUp.monthlySip)}
            primaryHint="/ mo start"
            rows={[
              {
                label: "End SIP",
                value: formatINRCurrency(data.stepUp.endMonthlySip ?? data.stepUp.monthlySip),
              },
              { label: "Total invested", value: formatINRCurrency(data.stepUp.invested) },
            ]}
          />
        </div>
      </section>

      <section className="space-y-3" data-purpose="funding-composition" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="How the Goal Is Funded"
          hint="Periodic credit · Additional shortfall · Target"
        />
        <div className="flex items-stretch gap-3">
          <div className="w-[38%] min-w-0 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Funding Waterfall
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
                <span>Periodic invested</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatINRCurrency(data.periodic.totalInvested)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Periodic payments</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {data.periodic.payments}
                </span>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Periodic Mix"
              centerLabel="Maturity"
              centerValue={data.periodic.maturity}
              invested={data.periodic.totalInvested}
              gain={periodicGain}
              tax={periodicTax}
              taxLabel="Periodic Tax"
              accent
              layout="row"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3" data-purpose="leg-metrics" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Additional Path Leg Metrics" />
        <div className="grid grid-cols-3 gap-3">
          <LegCard
            title="Lumpsum Today"
            headline={formatINRCurrency(data.lumpsum.lumpsum)}
            headlineHint="today"
            invested={data.lumpsum.invested}
            gain={data.lumpsum.gain}
            tax={data.lumpsum.tax}
            maturity={data.lumpsum.maturity}
          />
          <LegCard
            title="Additional SIP"
            headline={formatINRCurrency(data.standard.monthlySip)}
            headlineHint="/ mo"
            invested={data.standard.invested}
            gain={data.standard.gain}
            tax={data.standard.tax}
            maturity={data.standard.maturity}
            accent
          />
          <LegCard
            title="Step-Up SIP"
            headline={formatINRCurrency(data.stepUp.monthlySip)}
            headlineHint="/ mo start"
            endMonthly={data.stepUp.endMonthlySip}
            invested={data.stepUp.invested}
            gain={data.stepUp.gain}
            tax={data.stepUp.tax}
            maturity={data.stepUp.maturity}
            stepHint={`${formatPercent(data.stepUpPct)} p.a.`}
          />
        </div>
      </section>

      <section className="space-y-3" data-purpose="yearly-schedule">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Yearly Accumulation & Portfolio Growth Schedule" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
              Periodic
            </span>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Add. SIP / Step-Up
            </span>
            <span className="text-slate-400">• {years} Cycles Validated</span>
          </div>
        </div>

        {truncated ? (
          <p className="text-xs text-slate-500">
            Showing the first 10 and last 10 years of {ageRows.length} modeled years (
            {midOmit} omitted).
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-2 py-2.5 text-center font-bold" scope="col">
                  Yr
                </th>
                <th className="px-2 py-2.5 text-right font-semibold text-amber-200" scope="col">
                  Periodic
                </th>
                <th className="px-2 py-2.5 text-right font-semibold text-amber-200" scope="col">
                  Per. YTD
                </th>
                <th className="px-2 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Add. SIP
                </th>
                <th className="px-2 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  SIP End
                </th>
                <th className="px-2 py-2.5 text-right font-semibold text-emerald-300" scope="col">
                  Step SIP
                </th>
                <th
                  className="bg-slate-800/80 px-2 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Step End
                </th>
                <th className="px-2 py-2.5 text-right font-semibold" scope="col">
                  Milestone
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shown.map((row, i) => {
                const isLast = row.year === ageRows[ageRows.length - 1]?.year;
                const midYear = Math.ceil(years / 2);
                const isMid = row.year === midYear && !isLast;
                const showEllipsisBefore = truncated && i === 10;
                return (
                  <ScheduleRows
                    key={row.year}
                    row={row}
                    index={i}
                    isLast={isLast}
                    isMid={isMid}
                    showEllipsisBefore={showEllipsisBefore}
                    midOmit={midOmit}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div data-pdf-keep-together>
        <ExecutivePlaybook pillars={playbook} />
      </div>
    </ExecutiveDossierSheet>
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
  if (accent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-sm">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          {eyebrow}
        </span>
        <h3 className="mt-0.5 text-sm font-bold text-emerald-950">{title}</h3>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black tabular-nums text-emerald-950">{primary}</span>
          <span className="text-[10px] font-medium text-emerald-700">{primaryHint}</span>
        </div>
        <div className="mt-2 space-y-1 border-t border-emerald-200/60 pt-2 text-[11px]">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-2">
              <span className="text-emerald-800">{r.label}</span>
              <span className="font-semibold tabular-nums text-emerald-950">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {eyebrow}
      </span>
      <h3 className="mt-0.5 text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-xl font-black tabular-nums text-slate-950">{primary}</span>
        <span className="text-[10px] font-medium text-slate-500">{primaryHint}</span>
      </div>
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px]">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-2">
            <span className="text-slate-500">{r.label}</span>
            <span className="font-semibold tabular-nums text-slate-900">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegCard({
  title,
  headline,
  headlineHint,
  endMonthly,
  invested,
  gain,
  tax,
  maturity,
  stepHint,
  accent = false,
}: {
  title: string;
  headline: string;
  headlineHint: string;
  endMonthly?: number;
  invested: number;
  gain: number;
  tax: number;
  maturity: number;
  stepHint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 shadow-sm ${
        accent ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-900">{title}</h3>
        {stepHint ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {stepHint}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-lg font-black tabular-nums text-slate-950">{headline}</span>
        <span className="text-[10px] text-slate-500">{headlineHint}</span>
        {endMonthly != null ? (
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-emerald-800">
            End {formatINRCurrency(endMonthly)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-100 pt-2 text-[11px]">
        <Metric label="Invested" value={formatINRCurrency(invested)} />
        <Metric label="Gain" value={formatINRCurrency(gain)} valueClass="text-emerald-700" />
        <Metric label="Tax" value={formatINRCurrency(tax)} valueClass="text-rose-600" />
        <Metric label="Maturity" value={formatINRCurrency(maturity)} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function ScheduleRows({
  row,
  index,
  isLast,
  isMid,
  showEllipsisBefore,
  midOmit,
}: {
  row: {
    year: number;
    periodicPaid: number;
    periodicInvestedYtd: number;
    sipMonthly: number;
    sipYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
  };
  index: number;
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
            colSpan={8}
            className="px-2 py-2 text-center text-[11px] font-medium text-slate-400"
          >
            … {midOmit} years omitted …
          </td>
        </tr>
      ) : null}
      {isLast ? (
        <tr className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold">
          <td className="px-2 py-3 text-center text-sm font-black text-emerald-950">{row.year}</td>
          <td className="px-2 py-3 text-right text-amber-900">
            {formatINRCurrency(row.periodicPaid)}
          </td>
          <td className="px-2 py-3 text-right text-amber-900">
            {formatINRCurrency(row.periodicInvestedYtd)}
          </td>
          <td className="px-2 py-3 text-right text-emerald-900">
            {formatINRCurrency(row.sipMonthly)}
          </td>
          <td className="px-2 py-3 text-right text-sm font-black text-emerald-950">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="px-2 py-3 text-right text-emerald-900">
            {formatINRCurrency(row.stepMonthly)}
          </td>
          <td className="bg-emerald-200/60 px-2 py-3 text-right text-sm font-black text-emerald-950">
            {formatINRCurrency(row.stepYearEnd)}
          </td>
          <td className="px-2 py-3 text-right text-xs font-black text-emerald-800">Final year</td>
        </tr>
      ) : isMid ? (
        <tr className="bg-amber-50/40">
          <td className="px-2 py-2 text-center font-black text-amber-900">{row.year}</td>
          <td className="px-2 py-2 text-right font-medium text-amber-950">
            {formatINRCurrency(row.periodicPaid)}
          </td>
          <td className="px-2 py-2 text-right font-medium text-amber-950">
            {formatINRCurrency(row.periodicInvestedYtd)}
          </td>
          <td className="px-2 py-2 text-right font-medium">
            {formatINRCurrency(row.sipMonthly)}
          </td>
          <td className="px-2 py-2 text-right font-black text-amber-950">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="px-2 py-2 text-right font-medium text-emerald-900">
            {formatINRCurrency(row.stepMonthly)}
          </td>
          <td className="bg-emerald-50/40 px-2 py-2 text-right font-semibold text-emerald-950">
            {formatINRCurrency(row.stepYearEnd)}
          </td>
          <td className="px-2 py-2 text-right text-[11px] font-bold text-amber-800">Midpoint</td>
        </tr>
      ) : (
        <tr>
          <td className="px-2 py-2 text-center font-bold text-slate-900">{row.year}</td>
          <td className="px-2 py-2 text-right text-amber-900">
            {formatINRCurrency(row.periodicPaid)}
          </td>
          <td className="px-2 py-2 text-right text-amber-900">
            {formatINRCurrency(row.periodicInvestedYtd)}
          </td>
          <td className="px-2 py-2 text-right">{formatINRCurrency(row.sipMonthly)}</td>
          <td className="px-2 py-2 text-right font-semibold text-slate-900">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="px-2 py-2 text-right text-emerald-900">
            {formatINRCurrency(row.stepMonthly)}
          </td>
          <td className="bg-emerald-50/40 px-2 py-2 text-right font-semibold text-emerald-950">
            {formatINRCurrency(row.stepYearEnd)}
          </td>
          <td className="px-2 py-2 text-right text-[11px] text-slate-400">
            {index === 0 ? "Initiation" : "Compounding"}
          </td>
        </tr>
      )}
    </>
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
