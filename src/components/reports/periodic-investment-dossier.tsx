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

export type PeriodicInvestmentReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  amount: number;
  timesPerYear: number;
  frequencyLabel: string;
  years: number;
  returnPct: number;
  taxPct: number;
  maturity: number;
  totalInvested: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  payments: number;
  schedule: Array<{
    month: number;
    contribution: number;
    contributionFv: number;
  }>;
};

type PeriodicInvestmentDossierProps = {
  id?: string;
  data: PeriodicInvestmentReportData;
};

export const PERIODIC_INVESTMENT_REPORT_ID = "periodic-investment-report";

/**
 * Periodic Lumpsum Investment off-screen dossier for PDF download.
 * Matches Goal SIP / MF vs FD / One-Time executive report style.
 */
export function PeriodicInvestmentDossier({
  id = PERIODIC_INVESTMENT_REPORT_ID,
  data,
}: PeriodicInvestmentDossierProps) {
  const endAge = data.age + data.years;
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const playbook = getReportPlaybook("investment-growth").map((p) =>
    p.id === "01"
      ? {
          ...p,
          title: "Keep Every Contribution On Calendar",
          description: `Treat the ${formatINRCurrency(data.amount)} ${data.frequencyLabel.toLowerCase()} contribution as non-discretionary. Skipping even one installment permanently reduces the ${data.years}-year terminal corpus under the same return path.`,
        }
      : p.id === "02"
        ? {
            ...p,
            title: "Tax Net, Not Gross",
            description: `Headline maturity of ${formatINRCurrency(data.maturity)} nets to ${formatINRCurrency(data.netAfterTax)} after modeled capital gains tax at ${formatPercent(data.taxPct)}. Frame client conversations on post-tax spendable wealth.`,
          }
        : p.id === "03"
          ? {
              ...p,
              title: `Glidepath Before Year ${data.years}`,
              description: `Begin shifting equity exposure toward short-duration debt or hybrids via STP in the final 2 to 3 years so the planned redemption is not hostage to a late-cycle drawdown.`,
            }
          : p,
  );

  const truncated = data.schedule.length > 24;
  const midOmit = Math.max(0, data.schedule.length - 24);
  const lastMonth = data.schedule[data.schedule.length - 1]?.month;
  const wealthMultiple =
    data.totalInvested > 0 ? data.maturity / data.totalInvested : 0;

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Periodic Lumpsum Investment"
      subtitle="Periodic investment summary"
      contact={contact}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Timeline Window",
          value: `Age ${data.age} to ${endAge} (${data.years} Yrs)`,
        },
        {
          label: "Contribution Plan",
          value: `${data.payments} × ${formatINRCurrency(data.amount)}`,
          emphasize: "emerald",
        },
      ]}
    >
      <section className="space-y-4" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Corpus Milestones"
          hint={`Modeled over ${data.years} years at ${formatPercent(data.returnPct)} CAGR · ${data.frequencyLabel}`}
        />

        <div className="flex gap-4">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
            <div className="border-b border-slate-800 pb-3">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Nominal Terminal Value
              </span>
              <h3 className="text-sm font-bold text-slate-100">Full Maturity Corpus</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-4">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white sm:text-4xl">
                {formatINRCurrency(data.maturity)}
              </span>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-3 text-[11px]">
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-slate-400">Invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.totalInvested)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-slate-400">Pre-Tax Gain</span>
                <span className="block truncate font-medium tabular-nums text-emerald-300">
                  +{formatINRCurrency(data.gain)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-slate-400">Payments</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {data.payments}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <div className="border-b border-emerald-200/60 pb-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Post-Tax Spendable
              </span>
              <h3 className="text-sm font-bold text-emerald-950">Net After Tax</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-4">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950 sm:text-4xl">
                {formatINRCurrency(data.netAfterTax)}
              </span>
            </div>
            <div className="flex gap-2 border-t border-emerald-200/60 pt-3 text-[11px]">
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-emerald-800">Tax on Gains</span>
                <span className="block truncate font-medium tabular-nums text-rose-700">
                  {formatINRCurrency(data.tax)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-emerald-800">Tax Rate</span>
                <span className="block truncate font-medium tabular-nums text-emerald-950">
                  {formatPercent(data.taxPct)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-emerald-800">Frequency</span>
                <span className="block truncate font-medium text-emerald-950">
                  {data.frequencyLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              <strong>Note:</strong> {data.payments} contributions of{" "}
              {formatINRCurrency(data.amount)} ({data.frequencyLabel.toLowerCase()}) grow to{" "}
              <strong>{formatINRCurrency(data.maturity)}</strong> nominally and{" "}
              <strong>{formatINRCurrency(data.netAfterTax)}</strong> after tax (
              {wealthMultiple.toFixed(2)}x invested capital).
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            Tenure: {data.years} Yrs
          </span>
        </div>
      </section>

      <section className="space-y-3" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-7 gap-3 rounded-xl border border-slate-200 bg-white p-4 text-center">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param label="Amount Each" value={formatINRCurrency(data.amount)} />
          <Param label="Frequency" value={data.frequencyLabel} />
          <Param label="Tenure" value={`${data.years} Yrs`} />
          <Param
            label="Return CAGR"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Tax on Gains" value={formatPercent(data.taxPct)} />
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Payments
            </span>
            <span className="mt-1 inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-800">
              {data.payments}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4" data-purpose="corpus-visual-analytics">
        <ExecutiveSectionHeading
          title="Corpus Composition & Capital Gains Breakdown"
          hint="Invested · Pre-tax Gain · Tax · Net after tax"
        />
        <div className="mx-auto w-full max-w-lg">
          <ReportCompositionDonut
            title="Periodic mix"
            centerLabel="Maturity"
            centerValue={data.maturity}
            invested={data.totalInvested}
            gain={data.gain}
            tax={data.tax}
            taxLabel="Capital Tax"
            accent
          />
        </div>
      </section>

      <section
        className="mt-6 space-y-3"
        data-purpose="contribution-schedule"
        data-pdf-keep-together
      >
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Contribution Schedule" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Contribution
            </span>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              FV at end
            </span>
            <span className="text-slate-400">• {data.payments} Rows</span>
          </div>
        </div>

        {truncated ? (
          <p className="text-xs text-slate-500">
            Showing the first 12 and last 12 contribution months of {data.payments} total payments.
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 text-center font-bold" scope="col">
                  Month
                </th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-300" scope="col">
                  Contribution
                </th>
                <th
                  className="bg-slate-800/80 px-4 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  FV at end
                </th>
                <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(truncated ? data.schedule.slice(0, 12) : data.schedule).map((row, i) => {
                const isFirst = row.month === data.schedule[0]?.month;
                const isLast = !truncated && row.month === lastMonth;
                return (
                  <ScheduleRow
                    key={`head-${row.month}`}
                    row={row}
                    zebra={i % 2 === 1}
                    isFirst={isFirst}
                    isLast={isLast}
                  />
                );
              })}
              {truncated ? (
                <tr key="ellipsis" className="bg-slate-50">
                  <td
                    colSpan={4}
                    className="px-3 py-2 text-center text-[11px] font-medium text-slate-400"
                  >
                    … {midOmit} contributions omitted …
                  </td>
                </tr>
              ) : null}
              {truncated
                ? data.schedule.slice(-12).map((row, i) => (
                    <ScheduleRow
                      key={`tail-${row.month}`}
                      row={row}
                      zebra={i % 2 === 1}
                      isFirst={false}
                      isLast={row.month === lastMonth}
                    />
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10" data-pdf-keep-together>
        <ExecutivePlaybook pillars={playbook} />
      </div>
    </ExecutiveDossierSheet>
  );
}

function ScheduleRow({
  row,
  zebra,
  isFirst,
  isLast,
}: {
  row: { month: number; contribution: number; contributionFv: number };
  zebra: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <tr
      className={
        isLast
          ? "border-t-2 border-emerald-500 bg-emerald-100/70 font-bold"
          : zebra
            ? "bg-slate-50/80"
            : undefined
      }
    >
      <td
        className={`px-3 py-2 text-center font-bold ${
          isLast ? "text-emerald-950" : "text-slate-900"
        }`}
      >
        {row.month}
      </td>
      <td className={`px-4 py-2 text-right ${isLast ? "text-emerald-900" : "font-medium"}`}>
        {formatINRCurrency(row.contribution)}
      </td>
      <td
        className={`px-4 py-2 text-right ${
          isLast
            ? "bg-emerald-200/60 text-sm font-black text-emerald-950"
            : "bg-emerald-50/40 font-semibold text-emerald-950"
        }`}
      >
        {formatINRCurrency(row.contributionFv)}
      </td>
      <td
        className={`px-3 py-2 text-right text-[11px] ${
          isLast
            ? "font-black text-emerald-800"
            : isFirst
              ? "font-bold text-slate-500"
              : "text-slate-400"
        }`}
      >
        {isLast ? "Final contribution" : isFirst ? "First contribution" : ""}
      </td>
    </tr>
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
