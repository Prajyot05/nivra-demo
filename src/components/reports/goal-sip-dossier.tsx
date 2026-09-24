"use client";

import { Fragment } from "react";
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

export type GoalSipReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
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
  stepUpEndSIP?: number;
  stdInvested: number;
  stepInvested: number;
  stdGain: number;
  stepGain: number;
  stdTax: number;
  stepTax: number;
  stdCorpus: number;
  stepCorpus: number;
  stdNet?: number;
  stepNet?: number;
  stdSchedule: { year: number; monthly: number; yearEnd: number }[];
  stepSchedule: { year: number; monthly: number; yearEnd: number }[];
  delays: { mo: number; sip: number; extra: number }[];
};

type GoalSipDossierProps = {
  id?: string;
  data: GoalSipReportData;
};

export const GOAL_SIP_REPORT_ID = "goal-sip-report";

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
    return { label: "> Rs.1.0L Std", row: "normal" };
  }
  if (stepCorpus >= 100_000 && prevStep < 100_000) {
    return { label: "> Rs.1.0L Step-Up", row: "normal" };
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

/**
 * Goal SIP Investment Planner off-screen dossier for direct PDF download.
 */
export function GoalSipDossier({ id = GOAL_SIP_REPORT_ID, data }: GoalSipDossierProps) {
  const endAge = data.age + data.tenure;
  const stdNet = data.stdNet ?? data.targetGoal;
  const stepNet = data.stepNet ?? data.targetGoal;
  const stepEnd = data.stepUpEndSIP ?? 0;
  const savingsPct =
    data.standardSIP > 0
      ? ((data.standardSIP - data.stepUpSIP) / data.standardSIP) * 100
      : 0;

  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const playbook = getReportPlaybook("goal-sip").map((p) =>
    p.id === "01"
      ? {
          ...p,
          description: `Start the chosen SIP path immediately (${formatINRCurrency(data.standardSIP)}/mo flat, or ${formatINRCurrency(data.stepUpSIP)}/mo step-up). Use ECS / OTM on the 1st business day each month so compounding is not delayed.`,
        }
      : p.id === "02"
        ? {
            ...p,
            title: `Annual +${formatPercent(data.stepUp, 0)} Step-Up Review`,
            description: `If using Step-Up, sync the +${formatPercent(data.stepUp, 0)} increase with the appraisal cycle so the starting SIP of ${formatINRCurrency(data.stepUpSIP)}/mo scales to about ${formatINRCurrency(stepEnd)}/mo by year ${data.tenure} without a sudden cashflow shock.`,
          }
        : p.id === "03"
          ? {
              ...p,
              title: `Glidepath De-risking at Yr ${Math.max(1, data.tenure - 2)}`,
              description: `Shift equity exposure toward short-duration debt via STP during years ${Math.max(1, data.tenure - 2)} to ${data.tenure} so the ${formatINRCurrency(data.targetGoal)} net target is locked in before the goal date.`,
            }
          : p,
  );

  const midYear = Math.max(1, Math.floor(data.tenure / 2));
  const midStep = data.stepSchedule.find((r) => r.year === midYear)?.monthly ?? data.stepUpSIP;

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

  const truncated = scheduleRows.length > 15;
  const shown = truncated
    ? [...scheduleRows.slice(0, 8), ...scheduleRows.slice(-7)]
    : scheduleRows;
  const midOmit = truncated ? Math.max(0, scheduleRows.length - 15) : 0;

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Goal SIP Investment Planner"
      subtitle="Standard SIP vs Step-Up SIP"
      contact={contact}
      disclaimer={false}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Timeline",
          value: `Age ${data.age} to ${endAge} (${data.tenure} Yrs)`,
        },
        {
          label: "Net Target",
          value: formatINRCurrency(data.targetGoal),
          emphasize: "emerald",
        },
      ]}
    >
      {/* ── Page 1: decision summary + delay friction ── */}
      <section className="space-y-4" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Goal Funding Paths"
          hint={`${formatPercent(data.returnPct)} CAGR · ${data.useInflAdj ? "Inflation-adjusted" : "Stated"} goal`}
        />

        <div className="flex gap-3">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
            <div className="border-b border-slate-800 pb-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Flat Monthly Path
              </span>
              <h3 className="text-sm font-bold text-slate-100">Standard SIP</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white">
                {formatINRCurrency(data.standardSIP)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
            <div className="flex gap-3 border-t border-slate-800 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.stdInvested)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Pre-Tax</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.stdCorpus)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Tax</span>
                <span className="block truncate font-medium tabular-nums text-rose-300">
                  {formatINRCurrency(data.stdTax)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="border-b border-emerald-200/60 pb-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Step-Up (+{formatPercent(data.stepUp, 0)} p.a.)
              </span>
              <h3 className="text-sm font-bold text-emerald-950">Step-Up SIP</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-2.5">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950">
                {formatINRCurrency(data.stepUpSIP)}
              </span>
              <span className="text-xs font-semibold text-emerald-800">starting /mo</span>
            </div>
            <div className="mb-2 rounded-md border border-emerald-200/80 bg-white/70 px-2.5 py-1.5 text-[11px]">
              <span className="text-emerald-800">Ends at</span>
              <span className="ml-1.5 font-bold tabular-nums text-emerald-950">
                {formatINRCurrency(stepEnd)}/mo
              </span>
            </div>
            <div className="flex gap-3 border-t border-emerald-200/60 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {formatINRCurrency(data.stepInvested)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Pre-Tax</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {formatINRCurrency(data.stepCorpus)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Tax</span>
                <span className="block truncate font-medium tabular-nums text-rose-600">
                  {formatINRCurrency(data.stepTax)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex w-[26%] min-w-[10.5rem] flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="border-b border-slate-100 pb-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Net Target
              </span>
              <h3 className="text-sm font-bold text-slate-900">Target Corpus</h3>
            </div>
            <div className="py-2.5">
              <span className="block text-2xl font-black tracking-tight tabular-nums text-emerald-700">
                {formatINRCurrency(data.targetGoal)}
              </span>
              <span className="mt-1 block text-[10px] text-slate-500">
                After capital gains tax
              </span>
            </div>
            <div className="border-t border-slate-100 pt-2.5 text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Std net</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatINRCurrency(stdNet)}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <span className="text-slate-500">Step-Up net</span>
                <span className="font-semibold tabular-nums text-emerald-800">
                  {formatINRCurrency(stepNet)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700">
          <strong>Cashflow.</strong> Step-Up starts{" "}
          <strong>{savingsPct.toFixed(1)}% lower</strong> (
          {formatINRCurrency(data.stepUpSIP)} vs {formatINRCurrency(data.standardSIP)}
          /mo) with the same net target.
        </p>
      </section>

      <section
        className="mt-5 grid grid-cols-[1.15fr_0.85fr] gap-4"
        data-purpose="page1-secondary"
      >
        <div className="space-y-4">
          <div className="space-y-2.5">
            <ExecutiveSectionHeading title="Goal Basis & Assumptions" />
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Stated
                </span>
                <span className="mt-1 block text-sm font-bold tabular-nums text-slate-900">
                  {formatINRCurrency(data.goal)}
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
              <Param label="Tenure" value={`${data.tenure}y`} />
              <Param
                label="Return"
                value={formatPercent(data.returnPct)}
                valueClass="text-emerald-700"
              />
              <Param label="Inflation" value={formatPercent(data.inflation)} />
              <Param label="Tax" value={formatPercent(data.tax)} />
              <Param
                label="Step-Up"
                value={formatPercent(data.stepUp)}
                valueClass="text-emerald-700"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <ExecutiveSectionHeading
              title="Step-Up Timeline"
              hint={`+${formatPercent(data.stepUp, 0)} p.a.`}
            />
            <div className="flex gap-3">
              {[
                { label: "Yr 1", value: data.stepUpSIP },
                { label: `Yr ${midYear}`, value: midStep },
                { label: `Yr ${data.tenure}`, value: stepEnd },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-1 flex-col rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                    {item.label}
                  </span>
                  <span className="mt-1 text-base font-black tabular-nums text-emerald-950">
                    {formatINRCurrency(item.value)}
                    <span className="ml-1 text-[11px] font-semibold text-emerald-700">/mo</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex flex-col rounded-xl border border-rose-200 bg-rose-50/30 p-4"
          data-purpose="cost-of-delay"
          data-pdf-keep-together
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                !
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Cost of Delay
              </h3>
            </div>
            <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
              vs flat SIP
            </span>
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-slate-600">
            Waiting to start raises the flat SIP needed to still hit the same net target.
          </p>
          <div className="flex flex-1 flex-col gap-2">
            {data.delays.map((d) => {
              const severe = d.mo >= 12;
              return (
                <div
                  key={d.mo}
                  className={`rounded-lg border px-3 py-2.5 ${
                    severe ? "border-rose-200 bg-rose-50/50" : "border-rose-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`font-semibold ${severe ? "text-rose-900" : "text-slate-700"}`}
                    >
                      {d.mo} Mo delay
                    </span>
                    <span
                      className={`whitespace-nowrap font-bold tabular-nums ${
                        severe ? "text-rose-800" : "text-slate-900"
                      }`}
                    >
                      {formatINRCurrency(d.sip)}/mo
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                    <span className={severe ? "text-rose-700" : "text-rose-600"}>
                      Additional cost
                    </span>
                    <span
                      className={`whitespace-nowrap font-bold tabular-nums ${
                        severe ? "text-rose-800" : "text-rose-600"
                      }`}
                    >
                      +{formatINRCurrency(d.extra)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Page 2: composition + schedule + close ── */}
      <section
        className="mt-6 space-y-3"
        data-purpose="corpus-visual-analytics"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Corpus Composition"
          hint="Net corpus after capital gains tax"
        />
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Standard SIP mix"
              centerLabel="Net Corpus"
              centerValue={stdNet}
              invested={data.stdInvested}
              gain={data.stdGain}
              tax={data.stdTax}
              taxLabel="Capital Gains Tax"
            />
          </div>
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Step-Up SIP mix"
              centerLabel="Net Corpus"
              centerValue={stepNet}
              invested={data.stepInvested}
              gain={data.stepGain}
              tax={data.stepTax}
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
              Flat SIP
            </span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Step-Up +{formatPercent(data.stepUp, 0)}
            </span>
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
                  Std SIP
                </th>
                <th className="px-3.5 py-2.5 font-semibold text-slate-200" scope="col">
                  Std End
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 font-semibold text-emerald-300"
                  scope="col"
                >
                  Step SIP
                </th>
                <th
                  className="bg-slate-800/80 px-3.5 py-2.5 font-semibold text-emerald-300"
                  scope="col"
                >
                  Step End
                </th>
                <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shown.map(({ std, step, milestone }, idx) => {
                const omitRow =
                  truncated && idx === 8 && midOmit > 0 ? (
                    <tr key={`omit-${std.year}`} className="bg-slate-50">
                      <td
                        colSpan={6}
                        className="px-3 py-2 text-center text-[11px] font-medium text-slate-500"
                      >
                        … {midOmit} years omitted …
                      </td>
                    </tr>
                  ) : null;

                if (milestone.row === "goal") {
                  return (
                    <Fragment key={std.year}>
                      {omitRow}
                      <tr className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold">
                        <td className="px-3 py-2.5 text-center text-sm font-black text-emerald-950">
                          {std.year}
                        </td>
                        <td className="px-3 py-2.5 text-emerald-900">
                          {formatINRCurrency(std.monthly)}
                        </td>
                        <td className="px-3.5 py-2.5 font-black text-emerald-950">
                          {formatINRCurrency(std.yearEnd)}
                        </td>
                        <td className="bg-emerald-200/60 px-3 py-2.5 text-emerald-950">
                          {formatINRCurrency(step.monthly)}
                        </td>
                        <td className="bg-emerald-200/60 px-3.5 py-2.5 font-black text-emerald-950">
                          {formatINRCurrency(step.yearEnd)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[11px] font-black text-emerald-800">
                          <span className="inline-flex items-center gap-1">
                            <CheckIcon />
                            Goal
                          </span>
                        </td>
                      </tr>
                    </Fragment>
                  );
                }

                if (milestone.row === "halfway") {
                  return (
                    <Fragment key={std.year}>
                      {omitRow}
                      <tr className="bg-amber-50/40">
                        <td className="px-3 py-2 text-center font-black text-amber-900">
                          {std.year}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {formatINRCurrency(std.monthly)}
                        </td>
                        <td className="px-3.5 py-2 font-black text-amber-950">
                          {formatINRCurrency(std.yearEnd)}
                        </td>
                        <td className="bg-emerald-50/40 px-3 py-2 text-emerald-900">
                          {formatINRCurrency(step.monthly)}
                        </td>
                        <td className="bg-emerald-50/40 px-3.5 py-2 font-semibold text-emerald-950">
                          {formatINRCurrency(step.yearEnd)}
                        </td>
                        <td className="px-3 py-2 text-right text-[11px] font-bold text-amber-800">
                          Halfway
                        </td>
                      </tr>
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={std.year}>
                    {omitRow}
                    <tr>
                      <td className="px-3 py-2 text-center font-bold text-slate-900">
                        {std.year}
                      </td>
                      <td className="px-3 py-2">{formatINRCurrency(std.monthly)}</td>
                      <td className="px-3.5 py-2 font-semibold text-slate-900">
                        {formatINRCurrency(std.yearEnd)}
                      </td>
                      <td className="bg-emerald-50/40 px-3 py-2 text-emerald-900">
                        {formatINRCurrency(step.monthly)}
                      </td>
                      <td className="bg-emerald-50/40 px-3.5 py-2 font-semibold text-emerald-950">
                        {formatINRCurrency(step.yearEnd)}
                      </td>
                      <td className="px-3 py-2 text-right text-[11px] text-slate-400">
                        {milestone.label === "Compounding" ? "" : milestone.label}
                      </td>
                    </tr>
                  </Fragment>
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

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      />
    </svg>
  );
}
