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

export type LoanEmiReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  principal: number;
  years: number;
  interestPct: number;
  recoverReturnPct: number;
  delayMonths: number;
  emi: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  recoverMonths: number;
  delayedRecoverMonths: number;
  recoverMonthlySip: number;
  recoverInvested: number;
  delayedRecoverMonthlySip: number;
  delayedRecoverInvested: number;
  schedule: Array<{
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
};

type LoanEmiDossierProps = {
  id?: string;
  data: LoanEmiReportData;
};

export const LOAN_EMI_REPORT_ID = "loan-emi-report";

/**
 * Loan EMI with Interest Recovery off-screen dossier.
 */
export function LoanEmiDossier({
  id = LOAN_EMI_REPORT_ID,
  data,
}: LoanEmiDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const interestBurdenPct =
    data.totalPrincipal > 0
      ? (data.totalInterest / data.totalPrincipal) * 100
      : 0;
  const delayExtra = Math.max(
    0,
    data.delayedRecoverMonthlySip - data.recoverMonthlySip,
  );
  const first = data.schedule[0];
  const totalMonths = data.schedule.length;
  const loanYears = Math.max(1, Math.round(totalMonths / 12));

  const yearlyRows = buildYearlyRows(data.schedule);
  const truncated = yearlyRows.length > 16;
  const shownYears = truncated
    ? [...yearlyRows.slice(0, 8), ...yearlyRows.slice(-8)]
    : yearlyRows;
  const midOmit = truncated ? Math.max(0, yearlyRows.length - 16) : 0;

  const milestones = [1, 5, 10, 15, 20]
    .filter((year) => year <= loanYears)
    .map((year) => {
      const month = Math.min(year * 12, totalMonths);
      const row = data.schedule[month - 1];
      if (!row) return null;
      return { year, month, balance: row.balance };
    })
    .filter((row): row is { year: number; month: number; balance: number } => row != null);

  const playbook = getReportPlaybook("loan-emi").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: `Size cashflow around the EMI of ${formatINRCurrency(data.emi)}/mo so the ${formatINRCurrency(data.totalPrincipal)} loan at ${formatPercent(data.interestPct)} stays within a sustainable share of take-home income.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: `Lifetime interest is ${formatINRCurrency(data.totalInterest)} (${formatPercent(interestBurdenPct, 0)} of principal). Stress-test EMI under a +1 to 2% rate shock before locking tenure at ${data.years} years.`,
          }
        : {
            ...pillar,
            description:
              delayExtra > 0
                ? `Start the interest-recovery SIP of ${formatINRCurrency(data.recoverMonthlySip)}/mo now. Waiting ${data.delayMonths} months raises it by ${formatINRCurrency(delayExtra)}/mo to ${formatINRCurrency(data.delayedRecoverMonthlySip)}.`
                : `Run a parallel SIP of ${formatINRCurrency(data.recoverMonthlySip)}/mo at ${formatPercent(data.recoverReturnPct)} so invested capital can offset the ${formatINRCurrency(data.totalInterest)} interest bill by loan end.`,
          },
  );

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Loan EMI with Interest Recovery"
      subtitle="Amortisation, lifetime cost, and SIP to offset interest"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        { label: "Tenure", value: `${data.years} yrs` },
        {
          label: "Rate",
          value: formatPercent(data.interestPct),
          emphasize: "emerald",
        },
        {
          label: "EMI",
          value: formatINRCurrency(data.emi),
          emphasize: "emerald",
        },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Loan repayment
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">Monthly EMI</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.emi)}
            </span>
            <span className="text-[10px] font-medium text-slate-400">/ month</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Principal</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.totalPrincipal)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Total interest</span>
              <span className="font-semibold tabular-nums text-rose-300">
                {formatINRCurrency(data.totalInterest)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Total paid</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.totalPaid)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Interest burden</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatPercent(interestBurdenPct, 0)} of principal
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Interest recovery
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">
            SIP to offset interest
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {formatINRCurrency(data.recoverMonthlySip)}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">/ month now</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">Return / term</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatPercent(data.recoverReturnPct, 0)} · {data.recoverMonths / 12}y
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Total invested</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.recoverInvested)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">
                SIP after {data.delayMonths} mo
              </span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.delayedRecoverMonthlySip)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Delayed invested</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.delayedRecoverInvested)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {delayExtra > 0 ? (
        <section className="mt-1" data-pdf-keep-together>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-relaxed text-rose-900">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Cost of delay
            </span>
            Waiting {data.delayMonths} months before starting the recovery SIP raises the
            monthly amount by {formatINRCurrency(delayExtra)} (from{" "}
            {formatINRCurrency(data.recoverMonthlySip)} to{" "}
            {formatINRCurrency(data.delayedRecoverMonthlySip)}).
          </div>
        </section>
      ) : null}

      {first ? (
        <section className="mt-1" data-pdf-keep-together>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              First EMI split
            </span>
            Principal {formatINRCurrency(first.principal)} · Interest{" "}
            {formatINRCurrency(first.interest)} · early months are interest-heavy as the
            balance amortises.
          </div>
        </section>
      ) : null}

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Principal" value={formatINRCurrency(data.principal)} />
          <Param label="Tenure" value={`${data.years} Yrs`} />
          <Param
            label="Loan Rate"
            value={formatPercent(data.interestPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Recover Return" value={formatPercent(data.recoverReturnPct)} />
          <Param label="Delay" value={`${data.delayMonths} mo`} />
          <Param label="Months" value={String(totalMonths)} />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="lifetime-mix"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Lifetime Cost Mix"
          hint="Principal vs interest over the full tenure"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Principal"
            value={formatINRCurrency(data.totalPrincipal)}
            hint={`${mixPct(data.totalPrincipal, data.totalPaid)} of total paid`}
            tone="slate"
          />
          <SnapshotCard
            label="Interest"
            value={formatINRCurrency(data.totalInterest)}
            hint={`${mixPct(data.totalInterest, data.totalPaid)} of total paid`}
            tone="rose"
          />
          <SnapshotCard
            label="Total paid"
            value={formatINRCurrency(data.totalPaid)}
            hint={`${totalMonths} EMIs`}
            tone="emerald"
          />
        </div>
        <MixBar principal={data.totalPrincipal} interest={data.totalInterest} />
      </section>

      {milestones.length > 0 ? (
        <section className="space-y-2" data-pdf-keep-together>
          <ExecutiveSectionHeading
            title="Payoff Timeline"
            hint="Remaining balance at selected year marks"
          />
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="px-3 py-2.5 font-bold" scope="col">
                    Milestone
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                    Month
                  </th>
                  <th
                    className="px-3 py-2.5 text-right font-semibold text-emerald-300"
                    scope="col"
                  >
                    Remaining Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-2 font-semibold text-slate-900">Start</td>
                  <td className="px-3 py-2 text-right text-slate-600">0</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-900">
                    {formatINRCurrency(data.totalPrincipal)}
                  </td>
                </tr>
                {milestones.map((m, index) => {
                  const isLast = m.month === totalMonths;
                  return (
                    <tr
                      key={m.year}
                      className={
                        isLast
                          ? "bg-emerald-50 font-semibold text-emerald-950"
                          : index % 2 === 0
                            ? "bg-slate-50"
                            : "bg-white"
                      }
                    >
                      <td className="px-3 py-2">Year {m.year}</td>
                      <td className="px-3 py-2 text-right">{m.month}</td>
                      <td className="px-3 py-2 text-right text-emerald-900">
                        {formatINRCurrency(m.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-3" data-purpose="yearly-schedule" data-pdf-keep-together>
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Yearly Amortisation" />
          <span className="text-[11px] font-medium text-slate-400">
            {yearlyRows.length} years
            {truncated ? ` · showing ${shownYears.length}` : ""}
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
                  Principal Paid
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Interest Paid
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Ending Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shownYears.map((row, index) => (
                <YearRow
                  key={row.year}
                  row={row}
                  index={index}
                  showOmit={truncated && index === 8 && midOmit > 0}
                  midOmit={midOmit}
                  isLast={row.year === yearlyRows.length}
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

function buildYearlyRows(
  schedule: LoanEmiReportData["schedule"],
): Array<{ year: number; principal: number; interest: number; balance: number }> {
  const rows: Array<{
    year: number;
    principal: number;
    interest: number;
    balance: number;
  }> = [];
  if (schedule.length === 0) return rows;

  let year = 1;
  let principal = 0;
  let interest = 0;
  for (let i = 0; i < schedule.length; i++) {
    const row = schedule[i]!;
    principal += row.principal;
    interest += row.interest;
    const isYearEnd = row.month % 12 === 0 || i === schedule.length - 1;
    if (isYearEnd) {
      rows.push({
        year,
        principal,
        interest,
        balance: row.balance,
      });
      year += 1;
      principal = 0;
      interest = 0;
    }
  }
  return rows;
}

function mixPct(part: number, total: number): string {
  if (total <= 0) return "0%";
  return formatPercent((part / total) * 100, 0);
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

function MixBar({ principal, interest }: { principal: number; interest: number }) {
  const total = Math.max(principal + interest, 1);
  const principalPct = (principal / total) * 100;
  const interestPct = (interest / total) * 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-slate-700">
          Principal {formatPercent(principalPct, 0)}
        </span>
        <span className="font-semibold text-rose-700">
          Interest {formatPercent(interestPct, 0)}
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-slate-900" style={{ width: `${principalPct}%` }} />
        <div className="h-full bg-rose-400" style={{ width: `${interestPct}%` }} />
      </div>
    </div>
  );
}

function YearRow({
  row,
  index,
  showOmit,
  midOmit,
  isLast,
}: {
  row: { year: number; principal: number; interest: number; balance: number };
  index: number;
  showOmit: boolean;
  midOmit: number;
  isLast: boolean;
}) {
  return (
    <>
      {showOmit ? (
        <tr className="bg-slate-50/80">
          <td
            colSpan={4}
            className="px-3 py-2 text-center text-[11px] font-medium text-slate-400"
          >
            … {midOmit} years omitted …
          </td>
        </tr>
      ) : null}
      <tr
        className={
          isLast
            ? "bg-emerald-50 font-semibold text-emerald-950"
            : index % 2 === 1
              ? "bg-slate-50/80"
              : "bg-white"
        }
      >
        <td className="px-3 py-2 text-center">{row.year}</td>
        <td className="px-3 py-2 text-right">{formatINRCurrency(row.principal)}</td>
        <td className="px-3 py-2 text-right text-rose-700">
          {formatINRCurrency(row.interest)}
        </td>
        <td className="px-3 py-2 text-right text-emerald-900">
          {formatINRCurrency(row.balance)}
        </td>
      </tr>
    </>
  );
}
