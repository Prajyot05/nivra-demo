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

export type LoanInterestRecoveryReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  principal: number;
  baselineYears: number;
  proposedYears: number;
  interestPct: number;
  sipReturnPct: number;
  baselineEmi: number;
  baselineInterest: number;
  baselinePaid: number;
  proposedEmi: number;
  proposedInterest: number;
  proposedPaid: number;
  monthlySip: number;
  sipInvested: number;
  sipAtHorizon: number;
  wealthCreated: number;
  totalAssetPlusWealth: number;
  additionalWealth: number;
  savingsVsBaselinePaid: number;
  totalInvestedLoanPlusSip: number;
  schedule: Array<{
    year: number;
    baseline: number;
    proposed: number;
    sip: number;
    loanPlusSip: number;
  }>;
};

type LoanInterestRecoveryDossierProps = {
  id?: string;
  data: LoanInterestRecoveryReportData;
};

export const LOAN_INTEREST_RECOVERY_REPORT_ID = "loan-interest-recovery-report";

/**
 * Loan Restructuring with Interest Recovery off-screen dossier.
 */
export function LoanInterestRecoveryDossier({
  id = LOAN_INTEREST_RECOVERY_REPORT_ID,
  data,
}: LoanInterestRecoveryDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const yearsSaved = Math.max(0, data.baselineYears - data.proposedYears);
  const interestSaved = Math.max(0, data.baselineInterest - data.proposedInterest);
  const loanPaymentSaved = Math.max(0, data.baselinePaid - data.proposedPaid);
  const totalInvested =
    data.totalInvestedLoanPlusSip || data.proposedPaid + data.sipInvested;
  const accelerated = yearsSaved > 0;

  const schedule = data.schedule;
  const truncated = schedule.length > 16;
  const shown = truncated
    ? [...schedule.slice(0, 8), ...schedule.slice(-8)]
    : schedule;
  const midOmit = truncated ? Math.max(0, schedule.length - 16) : 0;

  const playbook = getReportPlaybook("loan-recovery").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: accelerated
            ? `Commit to the proposed EMI of ${formatINRCurrency(data.proposedEmi)}/mo so the loan ends in ${data.proposedYears} years (${yearsSaved}y sooner than the ${data.baselineYears}-year baseline).`
            : `Size the proposed EMI of ${formatINRCurrency(data.proposedEmi)}/mo against take-home income before shortening tenure below ${data.baselineYears} years.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: `Run a parallel SIP of ${formatINRCurrency(data.monthlySip)}/mo at ${formatPercent(data.sipReturnPct)} alongside the shorter loan. Modeled SIP at horizon is ${formatINRCurrency(data.sipAtHorizon)}.`,
          }
        : {
            ...pillar,
            description: `Interest saved vs baseline is ${formatINRCurrency(interestSaved)}, with additional wealth of ${formatINRCurrency(data.additionalWealth)} at the horizon. Recheck after any rate reset.`,
          },
  );

  const compareRows = [
    {
      label: "Tenure",
      baseline: `${data.baselineYears} yrs`,
      proposed: `${data.proposedYears} yrs`,
    },
    {
      label: "EMI",
      baseline: formatINRCurrency(data.baselineEmi),
      proposed: formatINRCurrency(data.proposedEmi),
    },
    {
      label: "Monthly SIP",
      baseline: "n/a",
      proposed: formatINRCurrency(data.monthlySip),
    },
    {
      label: "Interest",
      baseline: formatINRCurrency(data.baselineInterest),
      proposed: formatINRCurrency(data.proposedInterest),
    },
    {
      label: "Interest saved",
      baseline: "n/a",
      proposed: formatINRCurrency(interestSaved),
      highlight: true,
    },
    {
      label: "Total loan paid",
      baseline: formatINRCurrency(data.baselinePaid),
      proposed: formatINRCurrency(data.proposedPaid),
    },
    {
      label: "SIP at horizon",
      baseline: "n/a",
      proposed: formatINRCurrency(data.sipAtHorizon),
    },
    {
      label: "Wealth at horizon",
      baseline: formatINRCurrency(data.principal),
      proposed: formatINRCurrency(data.totalAssetPlusWealth),
      highlight: true,
    },
  ];

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Loan Interest Recovery"
      subtitle="Shorter tenure plus SIP to rebuild interest paid"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        {
          label: "Principal",
          value: formatINRCurrency(data.principal),
          emphasize: "emerald",
        },
        {
          label: "Path",
          value: `${data.baselineYears}y to ${data.proposedYears}y`,
        },
        { label: "Loan rate", value: formatPercent(data.interestPct) },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Baseline
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">
            {data.baselineYears}-year loan
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.baselineEmi)}
            </span>
            <span className="text-[10px] font-medium text-slate-400">/ month EMI</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Interest</span>
              <span className="font-semibold tabular-nums text-rose-300">
                {formatINRCurrency(data.baselineInterest)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Total paid</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.baselinePaid)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Wealth at end</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.principal)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Asset only</span>
              <span className="font-semibold tabular-nums text-slate-100">Principal</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Proposed + SIP
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">
            {data.proposedYears}-year loan
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {formatINRCurrency(data.proposedEmi)}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">/ month EMI</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">Monthly SIP</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.monthlySip)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Interest</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.proposedInterest)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">SIP at horizon</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.sipAtHorizon)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Asset + wealth</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.totalAssetPlusWealth)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-1" data-pdf-keep-together>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-950">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Outcome snapshot
          </span>
          {accelerated
            ? `Debt-free ${yearsSaved}y earlier (${data.baselineYears}y to ${data.proposedYears}y). Interest saved ${formatINRCurrency(interestSaved)}. Additional wealth at horizon ${formatINRCurrency(data.additionalWealth)}.`
            : `Proposed path pairs EMI ${formatINRCurrency(data.proposedEmi)} with SIP ${formatINRCurrency(data.monthlySip)}. Horizon wealth ${formatINRCurrency(data.totalAssetPlusWealth)}.`}
        </div>
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Principal" value={formatINRCurrency(data.principal)} />
          <Param label="Baseline" value={`${data.baselineYears} Yrs`} />
          <Param
            label="Proposed"
            value={`${data.proposedYears} Yrs`}
            valueClass="text-emerald-700"
          />
          <Param label="Loan Rate" value={formatPercent(data.interestPct)} />
          <Param label="SIP Return" value={formatPercent(data.sipReturnPct)} />
          <Param
            label="Years Saved"
            value={accelerated ? `${yearsSaved}y` : "0"}
            valueClass={accelerated ? "text-emerald-700" : "text-slate-900"}
          />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="horizon-outcomes"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Horizon Outcomes"
          hint="Savings and wealth vs the baseline path"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Interest saved"
            value={formatINRCurrency(interestSaved)}
            hint="Baseline interest less proposed"
            tone="rose"
          />
          <SnapshotCard
            label="Additional wealth"
            value={formatINRCurrency(data.additionalWealth)}
            hint="Vs asset-only baseline"
            tone="emerald"
          />
          <SnapshotCard
            label="Total invested"
            value={formatINRCurrency(totalInvested)}
            hint="Proposed loan paid + SIP contributions"
            tone="slate"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Loan payments saved"
            value={formatINRCurrency(loanPaymentSaved)}
            hint="Baseline paid less proposed paid"
            tone="slate"
          />
          <SnapshotCard
            label="SIP invested"
            value={formatINRCurrency(data.sipInvested)}
            hint="Contributions over proposed tenure"
            tone="emerald"
          />
          <SnapshotCard
            label="Savings vs baseline paid"
            value={formatINRCurrency(data.savingsVsBaselinePaid)}
            hint="Cashflow difference"
            tone="emerald"
          />
        </div>
      </section>

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Strategy Comparison" />
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold" scope="col">
                  Metric
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Baseline
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Proposed + SIP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {compareRows.map((row, index) => (
                <tr
                  key={row.label}
                  className={
                    row.highlight
                      ? "bg-emerald-50 font-semibold text-emerald-950"
                      : index % 2 === 1
                        ? "bg-slate-50/80"
                        : "bg-white"
                  }
                >
                  <td className="px-3 py-2 text-left font-medium">{row.label}</td>
                  <td className="px-3 py-2 text-right">{row.baseline}</td>
                  <td className="px-3 py-2 text-right text-emerald-900">{row.proposed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" data-purpose="yearly-schedule" data-pdf-keep-together>
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Yearly Path" />
          <span className="text-[11px] font-medium text-slate-400">
            {schedule.length} years
            {truncated ? ` · showing ${shown.length}` : ""}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 text-center font-bold" scope="col">
                  Yr
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Baseline
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Proposed
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  SIP
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Loan + SIP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shown.map((row, index) => (
                <ScheduleRow
                  key={row.year}
                  row={row}
                  index={index}
                  showOmit={truncated && index === 8 && midOmit > 0}
                  midOmit={midOmit}
                  isProposedEnd={row.year === data.proposedYears}
                  isBaselineEnd={row.year === data.baselineYears}
                />
              ))}
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

function ScheduleRow({
  row,
  index,
  showOmit,
  midOmit,
  isProposedEnd,
  isBaselineEnd,
}: {
  row: LoanInterestRecoveryReportData["schedule"][number];
  index: number;
  showOmit: boolean;
  midOmit: number;
  isProposedEnd: boolean;
  isBaselineEnd: boolean;
}) {
  const milestone = isProposedEnd || isBaselineEnd;
  return (
    <>
      {showOmit ? (
        <tr className="bg-slate-50/80">
          <td
            colSpan={5}
            className="px-3 py-2 text-center text-[11px] font-medium text-slate-400"
          >
            … {midOmit} years omitted …
          </td>
        </tr>
      ) : null}
      <tr
        className={
          milestone
            ? "bg-emerald-50 font-semibold text-emerald-950"
            : index % 2 === 1
              ? "bg-slate-50/80"
              : "bg-white"
        }
      >
        <td className="px-3 py-2 text-center">{row.year}</td>
        <td className="px-3 py-2 text-right">{formatINRCurrency(row.baseline)}</td>
        <td className="px-3 py-2 text-right">{formatINRCurrency(row.proposed)}</td>
        <td className="px-3 py-2 text-right">{formatINRCurrency(row.sip)}</td>
        <td className="px-3 py-2 text-right text-emerald-900">
          {formatINRCurrency(row.loanPlusSip)}
        </td>
      </tr>
    </>
  );
}
