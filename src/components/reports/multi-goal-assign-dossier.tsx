"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";
import {
  DUMMY_REPORT_CONTACT,
  ExecutiveDossierSheet,
  ExecutivePlaybook,
  ExecutiveSectionHeading,
  type ExecutiveContact,
} from "@/components/reports/executive-dossier";
import { getReportPlaybook } from "@/lib/report-playbooks";

export type MultiGoalAssignReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  stYears: number;
  stReturnPct: number;
  ltReturnPct: number;
  inflationPct: number;
  taxPct: number;
  delayMonths: number;
  currentCorpus: number;
  corpusReturnPct: number;
  totalMonthlySip: number;
  totalSipInvested: number;
  totalLumpsum: number;
  totalAssigned: number;
  unassignedCorpus: number;
  goals: Array<{
    name: string;
    amount: number;
    years: number;
    inflAdjGoal: number;
    assigned: number;
    remainingTarget: number;
    monthlySip: number;
    lumpsum: number;
    sipInvested: number;
    delayCost: number;
    bucket: "ST" | "LT";
  }>;
};

type MultiGoalAssignDossierProps = {
  id?: string;
  data: MultiGoalAssignReportData;
};

export const MULTI_GOAL_ASSIGN_REPORT_ID = "multi-goal-assign-report";

type FundingStatus = "fully" | "partial" | "needs";

function fundingStatus(goal: {
  assigned: number;
  monthlySip: number;
  lumpsum: number;
}): FundingStatus {
  const needsTopUp = goal.monthlySip > 1e-6 || goal.lumpsum > 1e-6;
  if (goal.assigned > 1e-6 && !needsTopUp) return "fully";
  if (goal.assigned > 1e-6 && needsTopUp) return "partial";
  return "needs";
}

const STATUS_LABEL: Record<FundingStatus, string> = {
  fully: "Fully funded",
  partial: "Partial corpus",
  needs: "Needs funding",
};

/**
 * Multiple Goals with Corpus Assignment off-screen dossier.
 */
export function MultiGoalAssignDossier({
  id = MULTI_GOAL_ASSIGN_REPORT_ID,
  data,
}: MultiGoalAssignDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const goals = data.goals.filter((g) => g.amount > 0 && g.years > 0);
  const stCount = goals.filter((g) => g.bucket === "ST").length;
  const ltCount = goals.filter((g) => g.bucket === "LT").length;
  const maxYears = goals.reduce((m, g) => Math.max(m, g.years), 0);
  const totalDelayCost = goals.reduce((s, g) => s + (g.delayCost ?? 0), 0);
  const hasUnassigned = data.unassignedCorpus > 1e-6;
  const maxSip = goals.reduce((m, g) => Math.max(m, g.monthlySip), 0);

  const playbook = getReportPlaybook("multi-goal").map((p) =>
    p.id === "01"
      ? {
          ...p,
          description: `Assign the ${formatINRCurrency(data.currentCorpus)} corpus to the soonest goals first. ${formatINRCurrency(data.totalAssigned)} is already allocated. What is left needs ${formatINRCurrency(data.totalMonthlySip)}/mo SIP or ${formatINRCurrency(data.totalLumpsum)} lumpsum.`,
        }
      : p.id === "02"
        ? {
            ...p,
            description: `Across ${goals.length} goals (${stCount} short-term, ${ltCount} long-term), fund what is left without underfunding every goal equally. Clear near-term goals first.`,
          }
        : p,
  );

  const mixSlices = [
    { label: "Assigned corpus", value: data.totalAssigned, color: "#152033" },
    { label: "Remaining lumpsum", value: data.totalLumpsum, color: "#34d399" },
    { label: "Unused corpus", value: data.unassignedCorpus, color: "#f87171" },
  ].filter((s) => s.value > 0);
  const mixSum = mixSlices.reduce((s, x) => s + x.value, 0);

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Multiple Goals · Corpus Assignment"
      subtitle="Assign current corpus to goals, then fund what is left with SIP or lumpsum"
      contact={contact}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        { label: "Goals", value: String(goals.length) },
        {
          label: "Monthly SIP",
          value: formatINRCurrency(data.totalMonthlySip),
          emphasize: "emerald",
        },
      ]}
    >
      <section className="space-y-3" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Key Results"
          hint={`${stCount} ST · ${ltCount} LT · Longest ${maxYears} yrs`}
        />

        <div className="flex gap-3">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
            <div className="border-b border-slate-800 pb-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Remaining funding
              </span>
              <h3 className="text-sm font-bold text-slate-100">Total SIP / Month</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white">
                {formatINRCurrency(data.totalMonthlySip)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">SIP invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.totalSipInvested)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">One-time alt.</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.totalLumpsum)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Highest SIP</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(maxSip)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="border-b border-emerald-200/60 pb-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Current corpus
              </span>
              <h3 className="text-sm font-bold text-emerald-950">Corpus Assigned</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950">
                {formatINRCurrency(data.totalAssigned)}
              </span>
            </div>
            <div className="flex gap-2 border-t border-emerald-200/60 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Current corpus</span>
                <span className="block truncate font-bold tabular-nums text-emerald-950">
                  {formatINRCurrency(data.currentCorpus)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Unused</span>
                <span className="block truncate font-medium tabular-nums text-emerald-700">
                  {formatINRCurrency(data.unassignedCorpus)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Goals</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {goals.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              <strong>Note:</strong> Corpus of{" "}
              <strong>{formatINRCurrency(data.currentCorpus)}</strong> covers{" "}
              <strong>{formatINRCurrency(data.totalAssigned)}</strong> of the goals. What is left
              needs <strong>{formatINRCurrency(data.totalMonthlySip)}</strong>/mo SIP (or{" "}
              <strong>{formatINRCurrency(data.totalLumpsum)}</strong> lumpsum) across {goals.length}{" "}
              goals.
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            {maxYears} Yrs
          </span>
        </div>
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center sm:grid-cols-8">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param label="ST Cutoff" value={`${data.stYears} Yrs`} />
          <Param
            label="ST Return"
            value={formatPercent(data.stReturnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="LT Return" value={formatPercent(data.ltReturnPct)} />
          <Param label="Inflation" value={formatPercent(data.inflationPct)} />
          <Param label="Tax" value={formatPercent(data.taxPct)} />
          <Param label="Corpus Return" value={formatPercent(data.corpusReturnPct)} />
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

      <section className="space-y-3" data-purpose="funding-mix" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Funding Mix"
          hint="Assigned corpus · Remaining lumpsum · Unused"
        />
        <div className="flex items-stretch gap-3">
          <div className="w-[42%] min-w-0 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Capital mix
            </span>
            <div className="mt-2.5 space-y-2">
              {mixSlices.length === 0 ? (
                <p className="text-[11px] text-slate-500">No funding mix to display yet.</p>
              ) : (
                mixSlices.map((slice) => {
                  const pct = mixSum > 0 ? (slice.value / mixSum) * 100 : 0;
                  return (
                    <div key={slice.label}>
                      <div className="mb-1 flex min-w-0 items-center justify-between gap-1.5 text-[10px]">
                        <span className="flex min-w-0 items-center gap-1 font-medium text-slate-700">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="truncate">{slice.label}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end tabular-nums font-semibold leading-tight text-slate-900">
                          <span>{formatINRCurrency(slice.value)}</span>
                          <span className="text-[9px] font-medium text-slate-400">
                            {formatPercent(pct, 1)}
                          </span>
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {hasUnassigned ? (
              <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-medium text-amber-800">
                Unused corpus of {formatINRCurrency(data.unassignedCorpus)} remains after
                assigning to the soonest goals.
              </p>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Monthly SIP by goal
            </span>
            <div className="mt-2.5 space-y-2">
              {goals.map((g) => {
                const pct = maxSip > 0 ? (g.monthlySip / maxSip) * 100 : 0;
                return (
                  <div key={`${g.name}-${g.years}`}>
                    <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[10px]">
                      <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-700">
                        <span
                          className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${
                            g.bucket === "ST"
                              ? "bg-slate-900 text-white"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {g.bucket}
                        </span>
                        <span className="truncate">{g.name}</span>
                        <span className="shrink-0 text-slate-400">{g.years}y</span>
                      </span>
                      <span className="shrink-0 font-bold tabular-nums text-slate-900">
                        {formatINRCurrency(g.monthlySip)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor: g.bucket === "ST" ? "#0f172a" : "#34d399",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {totalDelayCost > 0 ? (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-2"
          data-purpose="cost-of-delay"
          data-pdf-keep-together
        >
          <div className="min-w-0 text-[11px] text-slate-700">
            <span className="font-bold text-rose-900">Cost of delay</span>
            <span className="text-slate-600">
              {" "}
              · {data.delayMonths} mo start delay adds{" "}
            </span>
            <span className="font-bold tabular-nums text-rose-900">
              {formatINRCurrency(totalDelayCost)}
            </span>
          </div>
        </div>
      ) : null}

      <section className="space-y-3" data-purpose="per-goal-schedule" data-pdf-keep-together>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Per Goal Assignment" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Assigned
            </span>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Remaining SIP / LS
            </span>
            <span className="text-slate-400">• {goals.length} Goals</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-2.5 py-2.5 font-bold" scope="col">
                  Goal
                </th>
                <th className="px-2 py-2.5 text-center font-semibold" scope="col">
                  Yrs
                </th>
                <th className="px-2 py-2.5 text-center font-semibold" scope="col">
                  Bucket
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Infl-Adj
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Assigned
                </th>
                <th
                  className="bg-slate-800/80 px-2.5 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Monthly SIP
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Lumpsum
                </th>
                <th className="px-2.5 py-2.5 text-right font-semibold" scope="col">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {goals.map((goal, i) => {
                const status = fundingStatus(goal);
                const isFully = status === "fully";
                return (
                  <tr
                    key={`${goal.name}-${goal.years}-${i}`}
                    className={
                      isFully
                        ? "bg-emerald-50/50"
                        : status === "partial"
                          ? "bg-amber-50/30"
                          : undefined
                    }
                  >
                    <td
                      className="max-w-[140px] truncate px-2.5 py-2 font-medium text-slate-900"
                      title={goal.name}
                    >
                      {goal.name}
                    </td>
                    <td className="px-2 py-2 text-center">{goal.years}</td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          goal.bucket === "ST"
                            ? "bg-slate-900 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {goal.bucket}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      {formatINRCurrency(goal.inflAdjGoal)}
                    </td>
                    <td className="px-2.5 py-2 text-right font-semibold text-slate-900">
                      {formatINRCurrency(goal.assigned)}
                    </td>
                    <td
                      className={`px-2.5 py-2 text-right font-semibold ${
                        goal.monthlySip > 0
                          ? "bg-emerald-50/60 text-emerald-950"
                          : "text-slate-400"
                      }`}
                    >
                      {formatINRCurrency(goal.monthlySip)}
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      {formatINRCurrency(goal.lumpsum)}
                    </td>
                    <td
                      className={`px-2.5 py-2 text-right text-[11px] font-semibold ${
                        isFully
                          ? "text-emerald-800"
                          : status === "partial"
                            ? "text-amber-800"
                            : "text-slate-500"
                      }`}
                    >
                      {STATUS_LABEL[status]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold">
                <td className="px-2.5 py-2.5 text-sm font-black text-emerald-950" colSpan={4}>
                  Totals
                </td>
                <td className="px-2.5 py-2.5 text-right text-sm font-black text-emerald-950">
                  {formatINRCurrency(data.totalAssigned)}
                </td>
                <td className="bg-emerald-200/60 px-2.5 py-2.5 text-right text-sm font-black text-emerald-950">
                  {formatINRCurrency(data.totalMonthlySip)}
                </td>
                <td className="px-2.5 py-2.5 text-right text-sm font-black text-emerald-950">
                  {formatINRCurrency(data.totalLumpsum)}
                </td>
                <td className="px-2.5 py-2.5 text-right text-xs font-black text-emerald-800">
                  All goals
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div data-pdf-keep-together>
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
