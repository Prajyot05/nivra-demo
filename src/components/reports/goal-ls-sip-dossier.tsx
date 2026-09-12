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

export type GoalLsSipReportData = {
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
  currentCorpus: number;
  extraLumpsum: number;
  inflAdjGoal: number;
  targetGoal: number;
  existingCredit: number;
  shortfall: number;
  extraLumpsumFv: number;
  allLumpsum: number;
  allSip: number;
  mixSip: number;
  mixStepUp: number;
  overfunded?: boolean;
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
    extraLumpEnd: number;
    sipMonthly: number;
    sipYearEnd: number;
    combinedEnd: number;
  }>;
};

type GoalLsSipDossierProps = {
  id?: string;
  data: GoalLsSipReportData;
};

export const GOAL_LS_SIP_REPORT_ID = "goal-ls-sip-report";

/**
 * Goal with Current Lumpsum (LS + SIP options) off-screen dossier.
 */
export function GoalLsSipDossier({
  id = GOAL_LS_SIP_REPORT_ID,
  data,
}: GoalLsSipDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const years = data.schedule.length || data.tenureYears;
  const allSipTotal = data.allSip * 12 * years;
  const mixSipTotal = data.mixSip * 12 * years;
  const mixCapital = data.extraLumpsum + mixSipTotal;

  const playbook = getReportPlaybook("goal-ls-sip").map((p) =>
    p.id === "01"
      ? {
          ...p,
          description: `Invest the extra lumpsum of ${formatINRCurrency(data.extraLumpsum)} now and start the mix SIP of ${formatINRCurrency(data.mixSip)}/mo so the shortfall of ${formatINRCurrency(data.shortfall)} closes by year ${years}.`,
        }
      : p.id === "02"
        ? {
            ...p,
            description: `Benchmark the mix against all-lumpsum (${formatINRCurrency(data.allLumpsum)} today) and all-SIP (${formatINRCurrency(data.allSip)}/mo). Pick the path that fits cashflow without underfunding the ${formatINRCurrency(data.targetGoal)} target.`,
          }
        : p,
  );

  const ageRows = data.schedule;
  const truncated = ageRows.length > 20;
  const shown = truncated
    ? [...ageRows.slice(0, 10), ...ageRows.slice(-10)]
    : ageRows;
  const midOmit = truncated ? Math.max(0, ageRows.length - 20) : 0;

  const mixSlices = [
    { label: "Current corpus credit", value: data.existingCredit, color: "#152033" },
    { label: "Extra lumpsum", value: data.extraLumpsum, color: "#64748b" },
    { label: "SIP invested", value: data.standard.invested, color: "#152033" },
    { label: "SIP gain", value: data.standard.gain, color: "#34d399" },
    { label: "SIP tax", value: data.standard.tax, color: "#f87171" },
  ].filter((s) => s.value > 0);
  const mixSum = mixSlices.reduce((s, x) => s + x.value, 0);

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Goal with Current Lumpsum"
      subtitle="Goal funding · Lumpsum and SIP options"
      contact={contact}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        { label: "Tenure", value: `${data.tenureYears} Years` },
        {
          label: "Mix SIP",
          value: formatINRCurrency(data.mixSip),
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
                Hybrid Path
              </span>
              <h3 className="text-sm font-bold text-slate-100">Mix Monthly SIP</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white">
                {formatINRCurrency(data.mixSip)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Extra Lumpsum</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.extraLumpsum)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">SIP Invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.standard.invested)}
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
                <span className="block text-[10px] text-emerald-800">Corpus Credit</span>
                <span className="block truncate font-medium tabular-nums text-emerald-700">
                  {formatINRCurrency(data.existingCredit)}
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
              <strong>Note:</strong> Current corpus credit of{" "}
              <strong>{formatINRCurrency(data.existingCredit)}</strong> plus an extra lumpsum of{" "}
              <strong>{formatINRCurrency(data.extraLumpsum)}</strong> leaves a mix SIP of{" "}
              <strong>{formatINRCurrency(data.mixSip)}</strong>/mo to fund{" "}
              <strong>{formatINRCurrency(data.targetGoal)}</strong>.
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
          <Param label="Current Corpus" value={formatINRCurrency(data.currentCorpus)} />
          <Param label="Extra Lumpsum" value={formatINRCurrency(data.extraLumpsum)} />
        </div>
      </section>

      <section className="space-y-2" data-purpose="funding-options">
        <ExecutiveSectionHeading
          title="Funding Options · All LS vs All SIP vs Mix"
          hint="Total capital committed over the tenure"
        />
        <div className="grid grid-cols-3 gap-3">
          <OptionCard
            eyebrow="Option A"
            title="All Lumpsum"
            primary={formatINRCurrency(data.allLumpsum)}
            primaryHint="one-time today"
            rows={[
              { label: "Covers shortfall", value: formatINRCurrency(data.shortfall) },
              { label: "Corpus credit", value: formatINRCurrency(data.existingCredit) },
            ]}
          />
          <OptionCard
            eyebrow="Option B"
            title="All SIP"
            primary={formatINRCurrency(data.allSip)}
            primaryHint="/ month"
            accent
            rows={[
              { label: "Total SIP capital", value: formatINRCurrency(allSipTotal) },
              { label: "Years", value: `${years} years` },
            ]}
          />
          <OptionCard
            eyebrow="Option C"
            title="Mix Path"
            primary={formatINRCurrency(data.mixSip)}
            primaryHint="/ month"
            rows={[
              { label: "Extra lumpsum", value: formatINRCurrency(data.extraLumpsum) },
              { label: "Total mix capital", value: formatINRCurrency(mixCapital) },
            ]}
          />
        </div>
      </section>

      <section className="space-y-3" data-purpose="mix-composition" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Mix Funding Composition"
          hint="Corpus credit · Extra LS · SIP invested / gain / tax"
        />
        <div className="flex items-stretch gap-3">
          <div className="w-[38%] min-w-0 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Mix Stack Breakdown
            </span>
            <div className="mt-2.5 space-y-2">
              {mixSlices.map((slice) => {
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
                        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: slice.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="Additional SIP Leg"
              centerLabel="Net After Tax"
              centerValue={data.standard.netAfterTax}
              invested={data.standard.invested}
              gain={data.standard.gain}
              tax={data.standard.tax}
              taxLabel="SIP Tax"
              accent
              layout="row"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3" data-purpose="sip-legs" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Mix SIP & Step-Up Leg Metrics" />
        <div className="grid grid-cols-2 gap-3">
          <LegCard
            title="Standard Mix SIP"
            monthly={data.standard.monthlySip}
            invested={data.standard.invested}
            gain={data.standard.gain}
            tax={data.standard.tax}
            maturity={data.standard.maturity}
          />
          <LegCard
            title="Step-Up Mix SIP"
            monthly={data.stepUp.monthlySip}
            endMonthly={data.stepUp.endMonthlySip}
            invested={data.stepUp.invested}
            gain={data.stepUp.gain}
            tax={data.stepUp.tax}
            maturity={data.stepUp.maturity}
            stepHint={`${formatPercent(data.stepUpPct)} annual step-up`}
          />
        </div>
      </section>

      <section className="space-y-3" data-purpose="yearly-schedule">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Yearly Accumulation & Portfolio Growth Schedule" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Extra LS
            </span>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Mix SIP
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
                <th className="px-3 py-2.5 text-center font-bold" scope="col">
                  Yr
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Extra LS (End)
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Mix SIP (Mo)
                </th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  SIP Corpus (End)
                </th>
                <th
                  className="bg-slate-800/80 px-4 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Combined Corpus
                </th>
                <th className="px-3 py-2.5 text-right font-semibold" scope="col">
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
  monthly,
  endMonthly,
  invested,
  gain,
  tax,
  maturity,
  stepHint,
}: {
  title: string;
  monthly: number;
  endMonthly?: number;
  invested: number;
  gain: number;
  tax: number;
  maturity: number;
  stepHint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-900">{title}</h3>
        {stepHint ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {stepHint}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-lg font-black tabular-nums text-slate-950">
          {formatINRCurrency(monthly)}
        </span>
        <span className="text-[10px] text-slate-500">/ mo start</span>
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
    extraLumpEnd: number;
    sipMonthly: number;
    sipYearEnd: number;
    combinedEnd: number;
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
            colSpan={6}
            className="px-3 py-2 text-center text-[11px] font-medium text-slate-400"
          >
            … {midOmit} years omitted …
          </td>
        </tr>
      ) : null}
      {isLast ? (
        <tr className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold">
          <td className="px-3 py-3 text-center text-sm font-black text-emerald-950">
            {row.year}
          </td>
          <td className="px-3 py-3 text-right text-emerald-900">
            {formatINRCurrency(row.extraLumpEnd)}
          </td>
          <td className="px-3 py-3 text-right text-emerald-900">
            {formatINRCurrency(row.sipMonthly)}
          </td>
          <td className="px-4 py-3 text-right text-sm font-black text-emerald-950">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="bg-emerald-200/60 px-4 py-3 text-right text-sm font-black text-emerald-950">
            {formatINRCurrency(row.combinedEnd)}
          </td>
          <td className="px-3 py-3 text-right text-xs font-black text-emerald-800">
            Final year
          </td>
        </tr>
      ) : isMid ? (
        <tr className="bg-amber-50/40">
          <td className="px-3 py-2 text-center font-black text-amber-900">{row.year}</td>
          <td className="px-3 py-2 text-right font-medium">
            {formatINRCurrency(row.extraLumpEnd)}
          </td>
          <td className="px-3 py-2 text-right font-medium">
            {formatINRCurrency(row.sipMonthly)}
          </td>
          <td className="px-4 py-2 text-right font-black text-amber-950">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="bg-emerald-50/40 px-4 py-2 text-right font-semibold text-emerald-950">
            {formatINRCurrency(row.combinedEnd)}
          </td>
          <td className="px-3 py-2 text-right text-[11px] font-bold text-amber-800">
            Midpoint
          </td>
        </tr>
      ) : (
        <tr>
          <td className="px-3 py-2 text-center font-bold text-slate-900">{row.year}</td>
          <td className="px-3 py-2 text-right">{formatINRCurrency(row.extraLumpEnd)}</td>
          <td className="px-3 py-2 text-right">{formatINRCurrency(row.sipMonthly)}</td>
          <td className="px-4 py-2 text-right font-semibold text-slate-900">
            {formatINRCurrency(row.sipYearEnd)}
          </td>
          <td className="bg-emerald-50/40 px-4 py-2 text-right font-semibold text-emerald-950">
            {formatINRCurrency(row.combinedEnd)}
          </td>
          <td className="px-3 py-2 text-right text-[11px] text-slate-400">
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
