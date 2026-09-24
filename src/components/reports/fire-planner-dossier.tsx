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

export type FirePlannerEvent = {
  age: number;
  /** Excel Q column. */
  income?: number;
  /** Excel R column. */
  expense?: number;
  /** Legacy display fields. */
  amount?: number;
  type?: "Expense" | "Income";
};

export type FirePlannerReportData = {
  clientName: string;
  age: number;
  retirementAge: number;
  survivingAge: number;
  email?: string;
  phone?: string;
  monthlyExpenses: number;
  lifestyleYearly: number;
  monthlyExpenseFactorPct: number;
  lifestyleFactorPct: number;
  inflationPct: number;
  returnPct: number;
  returnAfterPct: number;
  taxPct: number;
  existingCorpus: number;
  currentSipMonthly: number;
  currentSipReturnPct: number;
  limitSipYears: number;
  stepUpPct: number;
  stepUpEveryYears: number;
  delayMonths: number;
  events: FirePlannerEvent[];
  activeYears: number;
  retiredYears: number;
  monthlyExpAtRet: number;
  lifestyleAtRet: number;
  yearlyExpAtRet: number;
  corpusRequired: number;
  currentAtRetirement: number;
  eventsCorpusAtRetirement: number;
  balanceCorpus: number;
  additionalLumpsum: number;
  excess: boolean;
  monthlySip: number;
  stepUpStartSip: number;
  totalSipInvested: number;
  delayLumpsum: number;
  delaySip: number;
  eventLumpsum: number;
  eventSip: number;
  eventSipUntilAge: number;
  preRetEventCount: number;
  schedule: Array<{
    age: number;
    corpus: number;
    contribution: number;
    withdrawal: number;
    eventAmount: number;
    phase: string;
  }>;
};

type FirePlannerDossierProps = {
  id?: string;
  data: FirePlannerReportData;
};

export const FIRE_PLANNER_REPORT_ID = "fire-planner-report";

/**
 * FIRE Planner off-screen dossier (corpus required, SIP / lumpsum funding, delay cost).
 */
export function FirePlannerDossier({
  id = FIRE_PLANNER_REPORT_ID,
  data,
}: FirePlannerDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const surplusAtRetirement = Math.max(
    0,
    data.currentAtRetirement + data.eventsCorpusAtRetirement - data.corpusRequired,
  );
  const delayLumpsum = data.delayLumpsum || data.additionalLumpsum;
  const delaySip = data.delaySip || data.monthlySip;
  const delayLumpsumExtra = Math.max(0, delayLumpsum - data.additionalLumpsum);
  const delaySipExtra = Math.max(0, delaySip - data.monthlySip);
  const showDelay =
    data.delayMonths > 0 && (delayLumpsumExtra > 0 || delaySipExtra > 0);
  const sipGain = Math.max(0, data.balanceCorpus - data.totalSipInvested);
  const showGapMix = !data.excess && data.balanceCorpus > 0;

  const playbook = getReportPlaybook("fire").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: `Target ${formatINRCurrency(data.corpusRequired)} at age ${data.retirementAge} (${data.activeYears} active years, ${data.retiredYears} retired). Glide equity down as retirement nears so sequence risk does not impair the required corpus.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: data.excess
              ? `Plan is overfunded by about ${formatINRCurrency(surplusAtRetirement)} at retirement. Keep SIP or lumpsum discipline only if lifestyle goals rise. Otherwise lock the glidepath and review yearly.`
              : `Fund the gap with either ${formatINRCurrency(data.additionalLumpsum)} lumpsum today or ${formatINRCurrency(data.monthlySip)}/mo SIP (step-up start ${formatINRCurrency(data.stepUpStartSip)}). Avoid funding pauses that compound into larger shortfalls.`,
          }
        : {
            ...pillar,
            description: showDelay
              ? `Waiting ${data.delayMonths} months raises lumpsum need by ${formatINRCurrency(delayLumpsumExtra)} and SIP by ${formatINRCurrency(delaySipExtra)}/mo. Re-validate surviving age ${data.survivingAge} and post-retirement return ${formatPercent(data.returnAfterPct)} annually.`
              : `Re-validate surviving age ${data.survivingAge} and post-retirement return ${formatPercent(data.returnAfterPct)} annually so withdrawals stay solvent through the plan horizon.`,
          },
  );

  const ageRows = data.schedule;
  const truncated = ageRows.length > 18;
  const shown = truncated
    ? [...ageRows.slice(0, 9), ...ageRows.slice(-9)]
    : ageRows;
  const midOmit = truncated ? Math.max(0, ageRows.length - 18) : 0;

  const phaseLabel = (phase: string) =>
    phase === "retire" ? "Retire" : phase === "post" ? "Post" : "Pre";

  return (
    <ExecutiveDossierSheet
      id={id}
      title="FIRE Retirement Plan"
      subtitle="Corpus required, funding path, and longevity runway"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        {
          label: "Timeline",
          value: `${data.age} to ${data.survivingAge}`,
        },
        {
          label: "Retire",
          value: String(data.retirementAge),
          emphasize: "emerald",
        },
        {
          label: "Status",
          value: data.excess ? "Fully funded" : "Funding needed",
          emphasize: data.excess ? "status" : undefined,
        },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            At retirement
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">
            Corpus required at age {data.retirementAge}
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.corpusRequired)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Active years</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {data.activeYears} yrs
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Retired years</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {data.retiredYears} yrs
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Yearly exp. at ret</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.yearlyExpAtRet)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Lifestyle at ret</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.lifestyleAtRet)}/yr
              </span>
            </div>
          </div>
        </div>

        <div
          className={
            data.excess
              ? "rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm"
              : "rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm"
          }
        >
          <span
            className={`block text-[10px] font-bold uppercase tracking-wider ${
              data.excess ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {data.excess ? "Surplus" : "Funding"}
          </span>
          <h3
            className={`mt-0.5 text-sm font-bold ${
              data.excess ? "text-emerald-950" : "text-rose-950"
            }`}
          >
            {data.excess ? "Surplus at retirement" : "Monthly SIP needed"}
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black tabular-nums ${
                data.excess ? "text-emerald-950" : "text-rose-950"
              }`}
            >
              {formatINRCurrency(
                data.excess ? surplusAtRetirement : data.monthlySip,
              )}
            </span>
            {!data.excess ? (
              <span className="text-xs font-semibold text-rose-700">/mo</span>
            ) : null}
          </div>
          <p
            className={`mt-1 text-[11px] font-medium ${
              data.excess ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {data.excess
              ? "Existing path covers the required corpus"
              : `Or lumpsum today ${formatINRCurrency(data.additionalLumpsum)}`}
          </p>
          <div
            className={`mt-3 grid grid-cols-2 gap-2 border-t pt-2 text-[11px] ${
              data.excess ? "border-emerald-200/60" : "border-rose-200/70"
            }`}
          >
            <div>
              <span
                className={`block text-[10px] ${
                  data.excess ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                Current @ retirement
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  data.excess ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {formatINRCurrency(data.currentAtRetirement)}
              </span>
            </div>
            <div>
              <span
                className={`block text-[10px] ${
                  data.excess ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                {data.excess ? "Net gap" : "Balance to fund"}
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  data.excess ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {formatINRCurrency(data.balanceCorpus)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {showDelay ? (
        <section className="mt-1" data-pdf-keep-together>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-relaxed text-rose-900">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Cost of delay
            </span>
            Waiting {data.delayMonths} months before funding raises lumpsum need by{" "}
            {formatINRCurrency(delayLumpsumExtra)} (to {formatINRCurrency(delayLumpsum)})
            and monthly SIP by {formatINRCurrency(delaySipExtra)} (to{" "}
            {formatINRCurrency(delaySip)}).
          </div>
        </section>
      ) : null}

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Monthly Exp." value={formatINRCurrency(data.monthlyExpenses)} />
          <Param label="Lifestyle / Yr" value={formatINRCurrency(data.lifestyleYearly)} />
          <Param
            label="Exp. Factor"
            value={formatPercent(data.monthlyExpenseFactorPct, 0)}
          />
          <Param
            label="Life. Factor"
            value={formatPercent(data.lifestyleFactorPct, 0)}
          />
          <Param
            label="Pre-Ret Return"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Post-Ret Return" value={formatPercent(data.returnAfterPct)} />
          <Param label="Inflation" value={formatPercent(data.inflationPct)} />
          <Param label="Tax on Gains" value={formatPercent(data.taxPct)} />
          <Param label="Existing Corpus" value={formatINRCurrency(data.existingCorpus)} />
          <Param label="Current SIP" value={formatINRCurrency(data.currentSipMonthly)} />
          <Param
            label="Step-up"
            value={`${formatPercent(data.stepUpPct, 0)} / ${data.stepUpEveryYears}y`}
          />
          <Param
            label="Delay"
            value={data.delayMonths > 0 ? `${data.delayMonths} mo` : "None"}
          />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="funding-snapshot"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Funding Snapshot"
          hint="Required corpus vs current path and gap closing options"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Corpus required"
            value={formatINRCurrency(data.corpusRequired)}
            hint={`Age ${data.retirementAge}`}
            tone="slate"
          />
          <SnapshotCard
            label="Current path @ retirement"
            value={formatINRCurrency(data.currentAtRetirement)}
            hint={
              data.eventsCorpusAtRetirement > 0
                ? `Plus events ${formatINRCurrency(data.eventsCorpusAtRetirement)}`
                : "Existing investments only"
            }
            tone="emerald"
          />
          <SnapshotCard
            label={data.excess ? "Surplus" : "Additional lumpsum"}
            value={formatINRCurrency(
              data.excess ? surplusAtRetirement : data.additionalLumpsum,
            )}
            hint={
              data.excess
                ? "Fully funded"
                : `Or SIP ${formatINRCurrency(data.monthlySip)}/mo`
            }
            tone={data.excess ? "emerald" : "rose"}
          />
        </div>
      </section>

      {showGapMix ? (
        <section className="space-y-2" data-pdf-keep-together>
          <ExecutiveSectionHeading
            title="Gap Funding Mix"
            hint="If the remaining gap is closed via the recommended SIP path"
          />
          <ReportCompositionDonut
            title="SIP path to close the gap"
            centerLabel="Balance to fund"
            centerValue={data.balanceCorpus}
            invested={data.totalSipInvested}
            gain={sipGain}
            tax={0}
            taxLabel="Tax (not modeled here)"
            compact
            layout="stacked"
          />
        </section>
      ) : null}

      {(data.eventLumpsum > 0 || data.stepUpStartSip > 0) && !data.excess ? (
        <section className="space-y-3" data-pdf-keep-together>
          <ExecutiveSectionHeading title="Alternate Funding Levers" />
          <div className="grid grid-cols-3 gap-3">
            <SnapshotCard
              label="Step-up SIP start"
              value={formatINRCurrency(data.stepUpStartSip)}
              hint={`${formatPercent(data.stepUpPct, 0)} every ${data.stepUpEveryYears}y`}
              tone="slate"
            />
            <SnapshotCard
              label="Pre-ret. event lumpsum"
              value={
                data.eventLumpsum > 0
                  ? formatINRCurrency(data.eventLumpsum)
                  : "₹0"
              }
              hint={
                data.preRetEventCount > 0
                  ? `${data.preRetEventCount} pre-ret event${data.preRetEventCount === 1 ? "" : "s"}`
                  : "No pre-ret events"
              }
              tone={data.eventLumpsum > 0 ? "rose" : "slate"}
            />
            <SnapshotCard
              label="Event SIP alt."
              value={
                data.eventSip > 0 ? formatINRCurrency(data.eventSip) : "₹0"
              }
              hint={
                data.eventSip > 0
                  ? `Monthly until age ${data.eventSipUntilAge ?? ""}`
                  : "Not applicable"
              }
              tone="slate"
            />
          </div>
        </section>
      ) : null}

      {showDelay ? (
        <section
          className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/30 p-4"
          data-purpose="cost-of-delay"
          data-pdf-keep-together
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                !
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Start now vs delay
              </h3>
            </div>
            <span className="self-start rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 sm:self-auto">
              {data.delayMonths} Month Delay
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 rounded-lg border border-rose-100 bg-white p-3.5 shadow-sm">
              <div className="text-xs font-bold text-rose-900">Lumpsum now</div>
              <div className="mt-1 text-sm font-black tabular-nums text-slate-900">
                {formatINRCurrency(data.additionalLumpsum)}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Delayed: {formatINRCurrency(delayLumpsum)}
              </div>
            </div>
            <div className="flex-1 rounded-lg border border-rose-100 bg-white p-3.5 shadow-sm">
              <div className="text-xs font-bold text-rose-900">SIP now</div>
              <div className="mt-1 text-sm font-black tabular-nums text-slate-900">
                {formatINRCurrency(data.monthlySip)}/mo
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Delayed: {formatINRCurrency(delaySip)}/mo
              </div>
            </div>
            <div className="flex-1 rounded-lg border border-rose-200 bg-rose-50/20 p-3.5 shadow-sm">
              <div className="text-xs font-bold text-rose-800">Extra cost</div>
              <div className="mt-1 text-sm font-black tabular-nums text-rose-900">
                LS {formatINRCurrency(delayLumpsumExtra)}
              </div>
              <div className="mt-2 text-[11px] font-semibold text-rose-700">
                SIP +{formatINRCurrency(delaySipExtra)}/mo
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {data.events.length > 0 ? (
        <section className="space-y-2" data-pdf-keep-together>
          <ExecutiveSectionHeading
            title="Major Financial Events"
            hint={`${data.events.length} event${data.events.length === 1 ? "" : "s"} modeled`}
          />
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="px-3 py-2.5 font-bold" scope="col">
                    Age
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-emerald-300" scope="col">
                    Income
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-rose-300" scope="col">
                    Expense
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((ev, index) => {
                  const income = ev.income ?? (ev.type === "Income" ? ev.amount ?? 0 : 0);
                  const expense = ev.expense ?? (ev.type === "Expense" ? ev.amount ?? 0 : 0);
                  return (
                  <tr
                    key={`${ev.age}-${index}`}
                    className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}
                  >
                    <td className="px-3 py-2 font-semibold text-slate-900">{ev.age}</td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-800">
                      {income > 0 ? formatINRCurrency(income) : "0"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-700">
                      {expense > 0 ? formatINRCurrency(expense) : "0"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-3" data-purpose="age-path" data-pdf-keep-together>
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Age Path" />
          <span className="text-[11px] font-medium text-slate-400">
            {ageRows.length} ages · retire at {data.retirementAge}
            {truncated ? ` · showing ${shown.length}` : ""}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 text-center font-bold" scope="col">
                  Age
                </th>
                <th className="px-3 py-2.5 font-semibold" scope="col">
                  Phase
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Contribution
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Withdrawal
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Net Event
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Corpus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shown.map((row, index) => {
                const isRetire = row.age === data.retirementAge;
                const hasEvent = row.eventAmount !== 0;
                const showOmit = truncated && index === 9 && midOmit > 0;
                return (
                  <AgePathRow
                    key={row.age}
                    row={row}
                    index={index}
                    isRetire={isRetire}
                    hasEvent={hasEvent}
                    showOmit={showOmit}
                    midOmit={midOmit}
                    phaseLabel={phaseLabel(row.phase)}
                  />
                );
              })}
            </tbody>
          </table>
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

function AgePathRow({
  row,
  index,
  isRetire,
  hasEvent,
  showOmit,
  midOmit,
  phaseLabel,
}: {
  row: FirePlannerReportData["schedule"][number];
  index: number;
  isRetire: boolean;
  hasEvent: boolean;
  showOmit: boolean;
  midOmit: number;
  phaseLabel: string;
}) {
  return (
    <>
      {showOmit ? (
        <tr className="bg-slate-50/80">
          <td
            colSpan={6}
            className="px-3 py-2 text-center text-[11px] font-medium text-slate-400"
          >
            … {midOmit} ages omitted …
          </td>
        </tr>
      ) : null}
      <tr
        className={
          isRetire || hasEvent
            ? "bg-emerald-50 font-semibold text-emerald-950"
            : index % 2 === 1
              ? "bg-slate-50/80"
              : "bg-white"
        }
      >
        <td className="px-3 py-2 text-center">{row.age}</td>
        <td className="px-3 py-2">{phaseLabel}</td>
        <td className="px-3 py-2 text-right">
          {formatINRCurrency(row.contribution)}
        </td>
        <td className="px-3 py-2 text-right">
          {formatINRCurrency(row.withdrawal)}
        </td>
        <td
          className={`px-3 py-2 text-right ${
            hasEvent ? "text-rose-700" : "text-slate-500"
          }`}
        >
          {hasEvent ? formatINRCurrency(row.eventAmount) : "0"}
        </td>
        <td className="px-3 py-2 text-right text-emerald-900">
          {formatINRCurrency(row.corpus)}
        </td>
      </tr>
    </>
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
