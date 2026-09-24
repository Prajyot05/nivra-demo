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

export type FinancialHealthEvent = {
  age: number;
  amount: number;
  type: "Expense" | "Income";
};

export type FinancialHealthReportData = {
  clientName: string;
  age: number;
  retirementAge: number;
  survivingAge: number;
  email?: string;
  phone?: string;
  currentCorpus: number;
  monthlyExpenses: number;
  monthlyInvestment: number;
  lifestyleYearly: number;
  inflationPct: number;
  returnPct: number;
  returnAfterPct: number;
  taxPct: number;
  retirementBenefit: number;
  events: FinancialHealthEvent[];
  activeYears: number;
  retiredYears: number;
  corpusAtRetirement: number;
  monthlyExpAtRetPlus1: number;
  lifestyleAtRetPlus1: number;
  yearsLasting: number;
  monthsLasting: number;
  remainingAtSurvival: number;
  remainingPvToday: number;
  funded: boolean;
  message: string;
  gapAtRetirement: number;
  schedule: Array<{
    age: number;
    corpus: number;
    yearlyExpense: number;
    eventAmount: number;
    phase: string;
  }>;
};

type FinancialHealthDossierProps = {
  id?: string;
  data: FinancialHealthReportData;
};

export const FINANCIAL_HEALTH_REPORT_ID = "financial-health-report";

/**
 * Financial Health Analysis off-screen dossier (corpus longevity vs surviving age).
 */
export function FinancialHealthDossier({
  id = FINANCIAL_HEALTH_REPORT_ID,
  data,
}: FinancialHealthDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const longevityLabel = data.funded
    ? `Fully funded through age ${data.survivingAge}`
    : `Lasts ~${data.yearsLasting} of ${data.retiredYears} retired years`;

  const playbook = getReportPlaybook("health").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: data.funded
            ? `Corpus remains solvent through age ${data.survivingAge}, with ${formatINRCurrency(data.remainingAtSurvival)} left at survival (PV today ${formatINRCurrency(data.remainingPvToday)}). Keep the savings and drawdown plan reviewed yearly.`
            : data.gapAtRetirement > 0
              ? `Close the ${formatINRCurrency(data.gapAtRetirement)} gap at retirement age ${data.retirementAge}, or lower lifestyle draw, so the plan lasts the full ${data.retiredYears}-year retirement.`
              : `Corpus runs short before age ${data.survivingAge} (${longevityLabel}). Raise pre-retirement savings or trim post-retirement spending to restore solvency.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description:
              data.events.length > 0
                ? `Ring-fence ${data.events.length} planned event${data.events.length === 1 ? "" : "s"} (${data.events.map((ev) => `${ev.type.toLowerCase()} at ${ev.age}`).join(", ")}) so one-time cash needs do not force distressed withdrawals.`
                : "No major post-retirement events are modeled. Add known education, medical, or gift outflows before locking the drawdown plan.",
          }
        : pillar,
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
      title="Financial Health Analysis"
      subtitle="Corpus longevity, retirement drawdown, and funding status"
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
          value: data.funded ? "Funded" : "Action needed",
          emphasize: data.funded ? "status" : undefined,
        },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            At retirement
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">
            Corpus at age {data.retirementAge}
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.corpusAtRetirement)}
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
              <span className="block text-[10px] text-slate-400">Exp. at ret+1</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.monthlyExpAtRetPlus1)}/mo
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Lifestyle at ret+1</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.lifestyleAtRetPlus1)}/yr
              </span>
            </div>
          </div>
        </div>

        <div
          className={
            data.funded
              ? "rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm"
              : "rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm"
          }
        >
          <span
            className={`block text-[10px] font-bold uppercase tracking-wider ${
              data.funded ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            Longevity
          </span>
          <h3
            className={`mt-0.5 text-sm font-bold ${
              data.funded ? "text-emerald-950" : "text-rose-950"
            }`}
          >
            {data.funded ? "Remaining at survival" : "Funding gap at retirement"}
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black tabular-nums ${
                data.funded ? "text-emerald-950" : "text-rose-950"
              }`}
            >
              {formatINRCurrency(
                data.funded
                  ? data.remainingAtSurvival
                  : Math.max(0, data.gapAtRetirement),
              )}
            </span>
          </div>
          <p
            className={`mt-1 text-[11px] font-medium ${
              data.funded ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {longevityLabel}
          </p>
          <div
            className={`mt-3 grid grid-cols-2 gap-2 border-t pt-2 text-[11px] ${
              data.funded ? "border-emerald-200/60" : "border-rose-200/70"
            }`}
          >
            <div>
              <span
                className={`block text-[10px] ${
                  data.funded ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                Months lasting
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  data.funded ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {data.funded ? "Full horizon" : `${data.monthsLasting} mos`}
              </span>
            </div>
            <div>
              <span
                className={`block text-[10px] ${
                  data.funded ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                PV remaining today
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  data.funded ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {formatINRCurrency(data.remainingPvToday)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {!data.funded && data.message ? (
        <section className="mt-1" data-pdf-keep-together>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-relaxed text-rose-900">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Plan note
            </span>
            {data.message.replace(/[—–]/g, " to ")}
          </div>
        </section>
      ) : null}

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Current Corpus" value={formatINRCurrency(data.currentCorpus)} />
          <Param label="Monthly Exp." value={formatINRCurrency(data.monthlyExpenses)} />
          <Param label="Monthly Invest." value={formatINRCurrency(data.monthlyInvestment)} />
          <Param label="Lifestyle / Yr" value={formatINRCurrency(data.lifestyleYearly)} />
          <Param
            label="Pre-Ret Return"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Post-Ret Return" value={formatPercent(data.returnAfterPct)} />
          <Param label="Inflation" value={formatPercent(data.inflationPct)} />
          <Param label="Tax After Ret." value={formatPercent(data.taxPct)} />
          <Param label="Ret. Benefit" value={formatINRCurrency(data.retirementBenefit)} />
          <Param label="Retire Age" value={String(data.retirementAge)} />
          <Param label="Survive Age" value={String(data.survivingAge)} />
          <Param
            label="Status"
            value={data.funded ? "Funded" : "Shortfall"}
            valueClass={data.funded ? "text-emerald-700" : "text-rose-700"}
          />
        </div>
      </section>

      {data.events.length > 0 ? (
        <section className="space-y-2" data-pdf-keep-together>
          <ExecutiveSectionHeading
            title="Major Financial Events"
            hint={`${data.events.length} post-retirement event${data.events.length === 1 ? "" : "s"}`}
          />
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="px-3 py-2.5 font-bold" scope="col">
                    Age
                  </th>
                  <th className="px-3 py-2.5 font-semibold" scope="col">
                    Type
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-emerald-300" scope="col">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((ev, index) => (
                  <tr
                    key={`${ev.age}-${ev.type}-${index}`}
                    className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}
                  >
                    <td className="px-3 py-2 font-semibold text-slate-900">{ev.age}</td>
                    <td className="px-3 py-2 text-slate-700">{ev.type}</td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${
                        ev.type === "Expense" ? "text-rose-700" : "text-emerald-800"
                      }`}
                    >
                      {formatINRCurrency(ev.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section
        className="space-y-3"
        data-purpose="funding-snapshot"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Funding Snapshot"
          hint="Corpus at retirement vs gap and survival remainder"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Corpus at retirement"
            value={formatINRCurrency(data.corpusAtRetirement)}
            hint={`Age ${data.retirementAge}`}
            tone="slate"
          />
          <SnapshotCard
            label="Gap at retirement"
            value={
              data.gapAtRetirement > 0
                ? formatINRCurrency(data.gapAtRetirement)
                : "₹0 · Fully funded"
            }
            hint={data.gapAtRetirement > 0 ? "Shortfall" : "No shortfall"}
            tone={data.gapAtRetirement > 0 ? "rose" : "emerald"}
          />
          <SnapshotCard
            label="Remaining at survival"
            value={formatINRCurrency(data.remainingAtSurvival)}
            hint={`Age ${data.survivingAge}`}
            tone="emerald"
          />
        </div>
      </section>

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
                  Annual Expense
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
  row: FinancialHealthReportData["schedule"][number];
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
            colSpan={5}
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
        <td className="px-3 py-2 text-right">{formatINRCurrency(row.yearlyExpense)}</td>
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
