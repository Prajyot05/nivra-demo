"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";
import {
  ExecutiveDossierSheet,
  ExecutivePlaybook,
  ExecutiveSectionHeading,
} from "@/components/reports/executive-dossier";
import { getReportPlaybook } from "@/lib/report-playbooks";

export type GoalSipReportData = {
  clientName: string;
  age: number;
  goal: number;
  inflAdjGoal: number;
  useInflAdj: boolean;
  targetGoal: number;
  tenure: number;
  returnPct: number;
  inflation: number;
  tax: number;
  stepUp: number;
  standardSIP: number;
  stepUpSIP: number;
  stdInvested: number;
  stepInvested: number;
  stdGain: number;
  stepGain: number;
  stdTax: number;
  stepTax: number;
  stdCorpus: number;
  stepCorpus: number;
  stdSchedule: { year: number; monthly: number; yearEnd: number }[];
  stepSchedule: { year: number; monthly: number; yearEnd: number }[];
  delays: { mo: number; sip: number; extra: number }[];
};

type GoalSipDossierProps = {
  id?: string;
  data: GoalSipReportData;
};

export const GOAL_SIP_REPORT_ID = "goal-sip-report";

const CIRC = 2 * Math.PI * 38; // ≈ 238.76


function donutSegments(invested: number, gain: number, tax: number) {
  const total = Math.max(invested + gain + tax, 1);
  const investedLen = (invested / total) * CIRC;
  const gainLen = (gain / total) * CIRC;
  const taxLen = (tax / total) * CIRC;
  return {
    invested: { dash: investedLen, offset: 0 },
    gain: { dash: gainLen, offset: -investedLen },
    tax: { dash: taxLen, offset: -(investedLen + gainLen) },
  };
}

function milestoneForYear(
  year: number,
  tenure: number,
  stdCorpus: number,
  stepCorpus: number,
  targetGoal: number,
  prevStd: number,
  prevStep: number,
): { label: string; row: "normal" | "halfway" | "goal" } {
  if (year === tenure) {
    return { label: "Goal Achieved", row: "goal" };
  }
  const half = targetGoal * 0.5;
  if (stdCorpus >= half && prevStd < half) {
    return { label: `> ${formatINRCurrency(half)} (Halfway)`, row: "halfway" };
  }
  if (stepCorpus >= half && prevStep < half) {
    return { label: `> ${formatINRCurrency(half)} Step-Up`, row: "normal" };
  }
  if (stdCorpus >= 100_000 && prevStd < 100_000) {
    return { label: "> ₹1.0L Std", row: "normal" };
  }
  if (stepCorpus >= 100_000 && prevStep < 100_000) {
    return { label: "> ₹1.0L Step-Up", row: "normal" };
  }
  if (stdCorpus >= targetGoal * 0.8 && prevStd < targetGoal * 0.8) {
    return { label: `> ${formatINRCurrency(targetGoal * 0.8)} Std`, row: "normal" };
  }
  if (year === 1) return { label: "Initiation", row: "normal" };
  if (year === 2) return { label: "Foundation", row: "normal" };
  if (year === 3) return { label: "Accumulating", row: "normal" };
  if (year >= tenure - 1) return { label: "Final Approach", row: "normal" };
  if (year >= Math.floor(tenure * 0.75)) return { label: "Exponential phase", row: "normal" };
  return { label: "Compounding", row: "normal" };
}

function CorpusDonutCard({
  title,
  invested,
  gain,
  tax,
  corpus,
}: {
  title: string;
  invested: number;
  gain: number;
  tax: number;
  corpus: number;
}) {
  const gross = invested + gain;
  const segs = donutSegments(invested, gain, tax);
  const multiplier = invested > 0 ? corpus / invested : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">{title}</h4>
        <span className="text-[11px] font-bold tabular-nums text-slate-700">
          Gross: {formatINRCurrency(gross)}
        </span>
      </div>
      <div className="flex flex-col items-center justify-around gap-6 py-5 sm:flex-row">
        <div className="relative h-44 w-44 flex-shrink-0">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="38"
              stroke="#f1f5f9"
              strokeWidth="15"
            />
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="38"
              stroke="#1E293B"
              strokeDasharray={`${segs.invested.dash} ${CIRC}`}
              strokeDashoffset={segs.invested.offset}
              strokeWidth="15"
            />
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="38"
              stroke="#10B981"
              strokeDasharray={`${segs.gain.dash} ${CIRC}`}
              strokeDashoffset={segs.gain.offset}
              strokeWidth="15"
            />
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="38"
              stroke="#EF4444"
              strokeDasharray={`${segs.tax.dash} ${CIRC}`}
              strokeDashoffset={segs.tax.offset}
              strokeWidth="15"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Net Corpus
            </span>
            <span className="text-sm font-black tabular-nums text-slate-900">
              {formatINRCurrency(corpus)}
            </span>
          </div>
        </div>
        <div className="w-full max-w-[200px] space-y-2.5 text-xs">
          <LegendRow color="#1E293B" label="Invested" value={formatINRCurrency(invested)} />
          <LegendRow
            color="#10B981"
            label="Gain (Pre-tax)"
            value={formatINRCurrency(gain)}
            valueClass="text-emerald-600"
          />
          <LegendRow
            color="#EF4444"
            label="Capital Tax"
            value={formatINRCurrency(tax)}
            valueClass="text-rose-600"
          />
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[11px] font-bold">
            <span className="text-slate-500">Wealth Multiplier:</span>
            <span className="text-slate-900">{multiplier.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
  valueClass = "text-slate-900",
}: {
  color: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center space-x-2 text-slate-600">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </span>
      <span className={`font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

/**
 * Goal SIP Investment Planner — off-screen dossier for direct PDF download.
 */
export function GoalSipDossier({ id = GOAL_SIP_REPORT_ID, data }: GoalSipDossierProps) {
  const endAge = data.age + data.tenure;
  const savingsPct =
    data.standardSIP > 0
      ? ((data.standardSIP - data.stepUpSIP) / data.standardSIP) * 100
      : 0;
  const playbook = getReportPlaybook("goal-sip").map((p) =>
    p.id === "02"
      ? {
          ...p,
          title: `Annual +${formatPercent(data.stepUp, 0)} Escalation Review`,
          description: `For the Step-Up path, sync the +${formatPercent(data.stepUp, 0)} automated top-up with annual appraisal cycle. This allows ${formatINRCurrency(data.stepUpSIP)}/mo to naturally scale in Yr 2 without noticeable impact on lifestyle expenses.`,
        }
      : p.id === "03"
        ? {
            ...p,
            title: `Glidepath De-risking at Yr ${Math.max(1, data.tenure - 2)}`,
            description: `Transition accumulated equity exposure to short-duration debt or ultra-short hybrid instruments via Systematic Transfer Plan (STP) during years ${Math.max(1, data.tenure - 2)}–${data.tenure} to lock in the target corpus safely.`,
          }
        : p,
  );

  const scheduleRows = data.stdSchedule.map((std, i) => {
    const step = data.stepSchedule[i] ?? { year: std.year, monthly: 0, yearEnd: 0 };
    const prevStd = i > 0 ? data.stdSchedule[i - 1]!.yearEnd : 0;
    const prevStep = i > 0 ? (data.stepSchedule[i - 1]?.yearEnd ?? 0) : 0;
    const milestone = milestoneForYear(
      std.year,
      data.tenure,
      std.yearEnd,
      step.yearEnd,
      data.targetGoal,
      prevStd,
      prevStep,
    );
    return { std, step, milestone };
  });

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Goal SIP Investment Planner"
      subtitle="Institutional Wealth Advisory Desk • Goal Wealth Modeling & Sensitivity Architecture"
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Timeline Window",
          value: `Age ${data.age} → ${endAge} (${data.tenure} Yrs)`,
        },
        { label: "Target Goal", value: formatINRCurrency(data.targetGoal) },
      ]}
    >
      {/* Primary milestones */}
      <section className="space-y-4" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Goal & Accumulation Milestones"
          hint={`All figures modeled over ${data.tenure}-year accumulation horizon (${formatPercent(data.returnPct)} CAGR baseline)`}
        />

        <div className="flex gap-4">
          {/* Standard */}
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Fixed Monthly Allocation
                </span>
                <h3 className="text-sm font-bold text-slate-100">Standard Systematic Plan</h3>
              </div>
              <span className="inline-flex shrink-0 items-center self-start whitespace-nowrap rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-semibold leading-none text-slate-300">
                Flat SIP
              </span>
            </div>
            <div className="flex items-baseline space-x-2 py-4">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white sm:text-4xl">
                {formatINRCurrency(data.standardSIP)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-3 text-[11px]">
              <div className="flex-1">
                <span className="block text-[10px] text-slate-400">Net Final Corpus</span>
                <span className="font-bold tabular-nums text-emerald-400">
                  {formatINRCurrency(data.stdCorpus)}
                </span>
              </div>
              <div className="flex-1">
                <span className="block text-[10px] text-slate-400">Total Invested</span>
                <span className="font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.stdInvested)}
                </span>
              </div>
              <div className="flex-1">
                <span className="block text-[10px] text-slate-400">Pre-Tax Gain</span>
                <span className="font-medium tabular-nums text-emerald-300">
                  +{formatINRCurrency(data.stdGain)}
                </span>
              </div>
            </div>
          </div>

          {/* Step-up */}
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-200/60 pb-3">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Accelerated Outlay Route
                </span>
                <h3 className="text-sm font-bold text-emerald-950">
                  Step-Up SIP (+{formatPercent(data.stepUp, 0)} Annual Escalation)
                </h3>
              </div>
              <span className="inline-flex shrink-0 items-center self-start whitespace-nowrap rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold leading-none text-white">
                Step-Up SIP
              </span>
            </div>
            <div className="flex items-baseline space-x-2 py-4">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950 sm:text-4xl">
                {formatINRCurrency(data.stepUpSIP)}
              </span>
              <span className="text-xs font-semibold text-emerald-800">/ month (Initial)</span>
            </div>
            <div className="flex gap-2 border-t border-emerald-200/60 pt-3 text-[11px]">
              <div className="flex-1">
                <span className="block text-[10px] text-emerald-800">Net Final Corpus</span>
                <span className="font-bold tabular-nums text-emerald-950">
                  {formatINRCurrency(data.stepCorpus)}
                </span>
              </div>
              <div className="flex-1">
                <span className="block text-[10px] text-emerald-800">Total Invested</span>
                <span className="font-medium tabular-nums text-slate-700">
                  {formatINRCurrency(data.stepInvested)}
                </span>
              </div>
              <div className="flex-1">
                <span className="block text-[10px] text-emerald-800">Pre-Tax Gain</span>
                <span className="font-medium tabular-nums text-emerald-700">
                  +{formatINRCurrency(data.stepGain)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              <strong>Key Advisory Insight:</strong> Step-Up SIP initiates at a{" "}
              <strong>{savingsPct.toFixed(1)}% lower commitment</strong> (
              {formatINRCurrency(data.stepUpSIP)} vs. {formatINRCurrency(data.standardSIP)}/mo),
              substantially reducing initial liquidity strain while fully delivering the required
              goal post.
            </span>
          </div>
          <span className="whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            Target: {formatINRCurrency(data.targetGoal)}
          </span>
        </div>
      </section>

      {/* Assumptions */}
      <section className="space-y-3" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Actuarial & Financial Parameters Baseline" />
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4 text-center">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param label="Goal Amount" value={formatINRCurrency(data.goal)} />
          <Param label="Tenure" value={`${data.tenure} Yrs`} />
          <Param
            label="Return CAGR"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Inflation" value={formatPercent(data.inflation)} />
          <Param label="Tax on Gains" value={formatPercent(data.tax)} />
          <Param
            label="Annual Step-Up"
            value={formatPercent(data.stepUp)}
            valueClass="text-emerald-700"
          />
          <div className="flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Infl. Adjusted
            </span>
            <span
              className={`mt-1 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                data.useInflAdj
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {data.useInflAdj ? "ENABLED" : "OFF"}
            </span>
          </div>
        </div>
      </section>

      {/* Donuts */}
      <section className="space-y-4" data-purpose="corpus-visual-analytics">
        <ExecutiveSectionHeading
          title="Corpus Composition & Capital Gains Breakdown"
          hint="Net Final Valuation after LTCG Tax Deduction"
        />
        <div className="flex gap-4">
          <div className="flex-1">
            <CorpusDonutCard
              title="Standard SIP Architecture"
              invested={data.stdInvested}
              gain={data.stdGain}
              tax={data.stdTax}
              corpus={data.stdCorpus}
            />
          </div>
          <div className="flex-1">
            <CorpusDonutCard
              title="Step-Up SIP Architecture"
              invested={data.stepInvested}
              gain={data.stepGain}
              tax={data.stepTax}
              corpus={data.stepCorpus}
            />
          </div>
        </div>
      </section>

      {/* Cost of delay — slight pull-up so the block doesn't orphan across PDF pages */}
      <section
        className="-mt-1 space-y-3 rounded-xl border border-rose-200 bg-rose-50/30 p-4"
        data-purpose="cost-of-delay"
      >
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
              !
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
              Actuarial Cost of Inaction / Procrastination Delay
            </h3>
          </div>
          <span className="self-start rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 sm:self-auto">
            Friction Penalty Analysis
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Delaying SIP inception compresses compounding runway, forcing higher recurring monthly
          commitments to bridge the exact same {formatINRCurrency(data.targetGoal)} corpus.
        </p>
        <div className="flex gap-3 pt-1">
          {data.delays.map((d) => {
            const severe = d.mo >= 12;
            return (
              <div
                key={d.mo}
                className={`flex-1 rounded-lg border p-3.5 shadow-sm ${
                  severe
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-rose-100 bg-white"
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs font-medium ${
                    severe ? "font-bold text-rose-800" : "text-slate-500"
                  }`}
                >
                  <span>Delay Horizon</span>
                  <span className={severe ? "text-rose-950" : "font-bold text-slate-800"}>
                    {d.mo} Months
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-600">SIP Needed:</span>
                  <span
                    className={`tabular-nums ${
                      severe
                        ? "text-sm font-black text-rose-900"
                        : "text-sm font-bold text-slate-900"
                    }`}
                  >
                    {formatINRCurrency(d.sip)}/mo
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <span className={`font-medium ${severe ? "font-bold text-rose-700" : "text-rose-600"}`}>
                    Capital Penalty:
                  </span>
                  <span
                    className={`tabular-nums ${
                      severe ? "font-black text-rose-700" : "font-bold text-rose-600"
                    }`}
                  >
                    +{formatINRCurrency(d.extra)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Schedule — slight push-down so it doesn't sit tight against the delay block */}
      <section className="mt-9 space-y-3" data-purpose="yearly-schedule">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Yearly Accumulation & Portfolio Growth Schedule" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Standard: Flat SIP
            </span>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Step-Up: +{formatPercent(data.stepUp, 0)} p.a.
            </span>
            <span className="text-slate-400">• {data.tenure} Cycles Validated</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="px-3 py-2.5 text-center font-bold" scope="col">
                    Yr
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-slate-300" scope="col">
                    Std SIP (Mo)
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-slate-200" scope="col">
                    Standard Corpus (End)
                  </th>
                  <th
                    className="bg-slate-800/80 px-3 py-2.5 font-semibold text-emerald-300"
                    scope="col"
                  >
                    Step-Up SIP (Mo)
                  </th>
                  <th
                    className="bg-slate-800/80 px-4 py-2.5 font-semibold text-emerald-300"
                    scope="col"
                  >
                    Step-Up Corpus (End)
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                    Milestone Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scheduleRows.map(({ std, step, milestone }) => {
                  if (milestone.row === "goal") {
                    return (
                      <tr
                        key={std.year}
                        className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold"
                      >
                        <td className="px-3 py-3 text-center text-sm font-black text-emerald-950">
                          {std.year}
                        </td>
                        <td className="px-3 py-3 text-emerald-900">
                          {formatINRCurrency(std.monthly)}
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-emerald-950">
                          {formatINRCurrency(std.yearEnd)}
                        </td>
                        <td className="bg-emerald-200/60 px-3 py-3 font-bold text-emerald-950">
                          {formatINRCurrency(step.monthly)}
                        </td>
                        <td className="bg-emerald-200/60 px-4 py-3 text-sm font-black text-emerald-950">
                          {formatINRCurrency(step.yearEnd)}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-black text-emerald-800">
                          <span className="inline-flex items-center gap-1">
                            <CheckIcon />
                            Goal Achieved
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  if (milestone.row === "halfway") {
                    return (
                      <tr key={std.year} className="bg-amber-50/40">
                        <td className="px-3 py-2 text-center font-black text-amber-900">
                          {std.year}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {formatINRCurrency(std.monthly)}
                        </td>
                        <td className="px-4 py-2 font-black text-amber-950">
                          {formatINRCurrency(std.yearEnd)}
                        </td>
                        <td className="bg-emerald-50/40 px-3 py-2 font-medium text-emerald-900">
                          {formatINRCurrency(step.monthly)}
                        </td>
                        <td className="bg-emerald-50/40 px-4 py-2 font-semibold text-emerald-950">
                          {formatINRCurrency(step.yearEnd)}
                        </td>
                        <td className="px-3 py-2 text-right text-[11px] font-bold text-amber-800">
                          {milestone.label}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={std.year} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center font-bold text-slate-900">
                        {std.year}
                      </td>
                      <td className="px-3 py-2">{formatINRCurrency(std.monthly)}</td>
                      <td className="px-4 py-2 font-semibold text-slate-900">
                        {formatINRCurrency(std.yearEnd)}
                      </td>
                      <td className="bg-emerald-50/40 px-3 py-2 text-emerald-900">
                        {formatINRCurrency(step.monthly)}
                      </td>
                      <td className="bg-emerald-50/40 px-4 py-2 font-semibold text-emerald-950">
                        {formatINRCurrency(step.yearEnd)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-[11px] ${
                          milestone.label.includes("Step-Up")
                            ? "font-medium text-emerald-700"
                            : "text-slate-400"
                        }`}
                      >
                        {milestone.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ExecutivePlaybook pillars={playbook} />
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
    <div className="flex-1 border-r border-slate-100 pr-2 last:border-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className={`mt-1 block text-sm font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      />
    </svg>
  );
}
