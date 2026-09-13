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

function formatDurationYm(months: number): string {
  const whole = Math.max(0, Math.trunc(months));
  return `${Math.floor(whole / 12)}y ${whole % 12}m`;
}

export type GoalCompoundingReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  goalAmount: number;
  tenureYears: number;
  returnPct: number;
  taxPct: number;
  investmentType: "one-time" | "sip";
  stepSize: number;
  targetGoal: number;
  standard: {
    monthlySip: number;
    invested: number;
    maturity: number;
    gain: number;
    tax: number;
    netAfterTax: number;
  };
  lumpsum: {
    lumpsum: number;
    invested: number;
    maturity: number;
    gain: number;
    tax: number;
    netAfterTax: number;
  };
  growthSteps: Array<{
    step: number;
    targetCorpus: number;
    corpus: number;
    months: number;
  }>;
  schedule: Array<{
    year: number;
    sipMonthly: number;
    sipYearEnd: number;
    lumpsumEnd: number;
  }>;
};

type GoalCompoundingDossierProps = {
  id?: string;
  data: GoalCompoundingReportData;
};

export const GOAL_COMPOUNDING_REPORT_ID = "goal-compounding-report";

const STEP_LABEL: Record<number, string> = {
  10_000: "Rs. 10,000",
  100_000: "Rs. 1,00,000",
  1_000_000: "Rs. 10,00,000",
  10_000_000: "Rs. 1,00,00,000",
};

/**
 * Power of Compounding / Growth Steps off-screen dossier.
 */
export function GoalCompoundingDossier({
  id = GOAL_COMPOUNDING_REPORT_ID,
  data,
}: GoalCompoundingDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };
  const pathLabel = data.investmentType === "sip" ? "SIP" : "One Time";
  const stepLabel = STEP_LABEL[data.stepSize] ?? formatINRCurrency(data.stepSize);
  const years = data.schedule.length || data.tenureYears;
  const playbook = getReportPlaybook("goal-compounding").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description:
            data.investmentType === "sip"
              ? `Start the monthly SIP of ${formatINRCurrency(data.standard.monthlySip)} on the 1st business day so every modeled wealth step stays on the ${data.tenureYears}-year path.`
              : `Park the lumpsum of ${formatINRCurrency(data.lumpsum.lumpsum)} on the agreed start date so compounding is not shortened under the ${formatPercent(data.returnPct)} return path.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description:
              data.growthSteps.length > 0
                ? `The ${pathLabel} path clears ${data.growthSteps.length} ${stepLabel} milestones, with the goal step at ${formatDurationYm(data.growthSteps[data.growthSteps.length - 1]?.months ?? 0)}.`
                : `The selected ${pathLabel} path does not clear a ${stepLabel} step inside the tenure. Review step size or the goal amount before tracking milestones.`,
          }
        : pillar,
  );

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Goal. Power of Compounding"
      subtitle="SIP vs lumpsum required, with wealth-step timings"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName },
        { label: "Age", value: `${data.age} yrs` },
        { label: "Goal", value: formatINRCurrency(data.goalAmount), emphasize: "emerald" },
        { label: "Tenure", value: `${data.tenureYears} yrs` },
        { label: "Return", value: formatPercent(data.returnPct) },
        { label: "Tax", value: formatPercent(data.taxPct) },
        { label: "Growth path", value: pathLabel },
        { label: "Step size", value: stepLabel },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <PathCard
          eyebrow="SIP"
          title="Monthly SIP required"
          accent
          primary={formatINRCurrency(data.standard.monthlySip)}
          primaryHint="/ month"
          rows={[
            { label: "Invested", value: formatINRCurrency(data.standard.invested) },
            { label: "Pre-tax corpus", value: formatINRCurrency(data.standard.maturity) },
            { label: "Tax", value: formatINRCurrency(data.standard.tax) },
            { label: "Net after tax", value: formatINRCurrency(data.standard.netAfterTax) },
          ]}
        />
        <PathCard
          eyebrow="One Time"
          title="Lumpsum required"
          primary={formatINRCurrency(data.lumpsum.lumpsum)}
          primaryHint="today"
          rows={[
            { label: "Invested", value: formatINRCurrency(data.lumpsum.invested) },
            { label: "Pre-tax corpus", value: formatINRCurrency(data.lumpsum.maturity) },
            { label: "Tax", value: formatINRCurrency(data.lumpsum.tax) },
            { label: "Net after tax", value: formatINRCurrency(data.lumpsum.netAfterTax) },
          ]}
        />
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Goal Amount" value={formatINRCurrency(data.goalAmount)} />
          <Param label="Tenure" value={`${data.tenureYears} Yrs`} />
          <Param
            label="Return"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Tax" value={formatPercent(data.taxPct)} />
          <Param label="Growth Path" value={pathLabel} />
          <Param label="Step Size" value={stepLabel} />
        </div>
      </section>

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Wealth Growth Steps"
          hint={`${pathLabel} path · ${stepLabel} steps`}
        />
        {data.growthSteps.length === 0 ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
            Insufficient value for growth steps on the {pathLabel} path with {stepLabel} steps.
            Choose a smaller step size or a larger goal.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="px-3 py-2.5 font-bold" scope="col">
                    Step
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                    Target Corpus
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-emerald-300" scope="col">
                    Time Taken
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.growthSteps.map((step, index) => {
                  const isLast = index === data.growthSteps.length - 1;
                  return (
                    <tr
                      key={step.step}
                      className={
                        isLast
                          ? "bg-emerald-50 font-semibold text-emerald-950"
                          : index % 2 === 1
                            ? "bg-slate-50"
                            : "bg-white"
                      }
                    >
                      <td className="px-3 py-2">{step.step}</td>
                      <td className="px-3 py-2 text-right">
                        {formatINRCurrency(step.targetCorpus)}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-800">
                        {formatDurationYm(step.months)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className="space-y-3"
        data-purpose="corpus-visual-analytics"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Corpus Composition"
          hint="SIP mix at goal year · invested / gain / tax"
        />
        <div className="flex items-stretch gap-3">
          <div className="min-w-0 flex-1">
            <ReportCompositionDonut
              title="SIP at Goal Year"
              centerLabel="Pre-tax"
              centerValue={data.standard.maturity}
              invested={data.standard.invested}
              gain={data.standard.gain}
              tax={data.standard.tax}
              taxLabel="Capital Gains Tax"
              accent
              layout="row"
            />
          </div>
          <div className="w-[42%] min-w-0 shrink-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Goal-year outcome
            </span>
            <div className="mt-3 space-y-2.5 text-[12px]">
              <MixRow label="Target goal" value={formatINRCurrency(data.targetGoal)} strong />
              <MixRow
                label="SIP net after tax"
                value={formatINRCurrency(data.standard.netAfterTax)}
              />
              <MixRow
                label="Lumpsum net after tax"
                value={formatINRCurrency(data.lumpsum.netAfterTax)}
              />
              <div className="border-t border-slate-100 pt-2.5">
                <MixRow label="SIP tax" value={formatINRCurrency(data.standard.tax)} muted />
              </div>
              <MixRow label="Lumpsum tax" value={formatINRCurrency(data.lumpsum.tax)} muted />
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-2 space-y-3"
        data-purpose="yearly-schedule"
        data-pdf-keep-together
      >
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Yearly Schedule" />
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              SIP
            </span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Lumpsum
            </span>
            <span className="text-slate-400">
              {years} years · goal in year {data.tenureYears}
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
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Monthly SIP
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  SIP Year-End
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Lumpsum Year-End
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.schedule.map((row, index) => {
                const isGoal = row.year === data.tenureYears;
                return (
                  <tr
                    key={row.year}
                    className={
                      isGoal
                        ? "bg-emerald-50 font-semibold text-emerald-950"
                        : index % 2 === 1
                          ? "bg-slate-50/80"
                          : "bg-white"
                    }
                  >
                    <td className="px-3 py-2 text-center">{row.year}</td>
                    <td className="px-3 py-2 text-right">{formatINRCurrency(row.sipMonthly)}</td>
                    <td className="px-3 py-2 text-right">{formatINRCurrency(row.sipYearEnd)}</td>
                    <td className="px-3 py-2 text-right text-emerald-900">
                      {formatINRCurrency(row.lumpsumEnd)}
                    </td>
                  </tr>
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

function PathCard({
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          {eyebrow}
        </span>
        <h3 className="mt-0.5 text-sm font-bold text-emerald-950">{title}</h3>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black tabular-nums text-emerald-950">{primary}</span>
          <span className="text-[10px] font-medium text-emerald-700">{primaryHint}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
          {rows.map((row) => (
            <div key={row.label}>
              <span className="block text-[10px] text-emerald-800">{row.label}</span>
              <span className="font-semibold tabular-nums text-emerald-950">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {eyebrow}
      </span>
      <h3 className="mt-0.5 text-sm font-bold text-slate-100">{title}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-black tabular-nums text-white">{primary}</span>
        <span className="text-[10px] font-medium text-slate-400">{primaryHint}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
        {rows.map((row) => (
          <div key={row.label}>
            <span className="block text-[10px] text-slate-400">{row.label}</span>
            <span className="font-semibold tabular-nums text-slate-100">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
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
      <span className={`mt-1 block truncate text-sm font-bold tabular-nums ${valueClass}`} title={value}>
        {value}
      </span>
    </div>
  );
}

function MixRow({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={muted ? "text-slate-500" : "text-slate-600"}>{label}</span>
      <span
        className={`tabular-nums ${
          strong
            ? "font-bold text-slate-950"
            : muted
              ? "font-medium text-rose-600"
              : "font-semibold text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
