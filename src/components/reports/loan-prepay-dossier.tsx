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

export type LoanPrepayReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  principal: number;
  years: number;
  interestPct: number;
  yearlyExtra: number;
  recoverReturnPct: number;
  emi: number;
  monthsPaid: number;
  totalPrincipal: number;
  totalInterest: number;
  totalExtra: number;
  originalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  recoverSip: number;
  revisedRecoverSip: number;
  schedule: Array<{
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
    extra?: number;
  }>;
  originalScheduleLength: number;
};

type LoanPrepayDossierProps = {
  id?: string;
  data: LoanPrepayReportData;
};

export const LOAN_PREPAY_REPORT_ID = "loan-prepay-report";

function formatRemaining(months: number): string {
  const rounded = Math.max(0, Math.round(months));
  const years = Math.floor(rounded / 12);
  const rem = rounded % 12;
  if (years === 0) return `${rem}m`;
  if (rem === 0) return `${years}y`;
  return `${years}y ${rem}m`;
}

/**
 * Loan yearly extra payment (prepay) off-screen dossier.
 */
export function LoanPrepayDossier({
  id = LOAN_PREPAY_REPORT_ID,
  data,
}: LoanPrepayDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const originalMonths = data.originalScheduleLength || data.years * 12;
  const paidIn = formatRemaining(data.monthsPaid);
  const originalTerm = formatRemaining(originalMonths);
  const timeSaved = formatRemaining(data.monthsSaved);
  const sipLower = Math.max(0, data.recoverSip - data.revisedRecoverSip);
  const hasSavings = data.monthsSaved > 0 || data.interestSaved > 0;

  const extraMonths = data.schedule
    .filter((row) => (row.extra ?? 0) > 0)
    .map((row) => row.month);

  const yearlyRows = buildYearlyRows(data.schedule);
  const truncated = yearlyRows.length > 14;
  const shownYears = truncated
    ? [...yearlyRows.slice(0, 7), ...yearlyRows.slice(-7)]
    : yearlyRows;
  const midOmit = truncated ? Math.max(0, yearlyRows.length - 14) : 0;

  const playbook = getReportPlaybook("loan-extra").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: `Apply the yearly extra of ${formatINRCurrency(data.yearlyExtra)} at each year-end (months ${extraMonths.slice(0, 3).join(", ")}${extraMonths.length > 3 ? ", …" : ""}) so principal reduces on schedule and tenure compresses.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: hasSavings
              ? `Yearly extras save ${formatINRCurrency(data.interestSaved)} in interest and ${timeSaved} of tenure (${originalMonths}m to ${data.monthsPaid}m). Keep extras on the highest-rate loan first.`
              : `Set a yearly extra above zero so interest and tenure compress versus the ${originalTerm} scheduled term.`,
          }
        : {
            ...pillar,
            description:
              sipLower > 0
                ? `After extras, the SIP needed to offset remaining interest falls from ${formatINRCurrency(data.recoverSip)} to ${formatINRCurrency(data.revisedRecoverSip)}/mo (${formatINRCurrency(sipLower)} lower) at ${formatPercent(data.recoverReturnPct)}.`
                : `Keep EMI constant at ${formatINRCurrency(data.emi)}/mo and let extras cut tenure, unless cash-flow relief is the priority.`,
          },
  );

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Loan Yearly Extra Payments"
      subtitle="Shorter tenure, interest saved, and revised recovery SIP"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        {
          label: "Yearly extra",
          value: formatINRCurrency(data.yearlyExtra),
          emphasize: "emerald",
        },
        { label: "Paid in", value: paidIn, emphasize: "emerald" },
        { label: "Loan rate", value: formatPercent(data.interestPct) },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Interest outcome
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">Interest saved</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.interestSaved)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Original interest</span>
              <span className="font-semibold tabular-nums text-rose-300">
                {formatINRCurrency(data.originalInterest)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">With extras</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.totalInterest)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Monthly EMI</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.emi)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Total extras</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.totalExtra)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Tenure outcome
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">Time saved</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {timeSaved}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">
              ({data.monthsSaved} months)
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">Scheduled term</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {originalMonths} mo · {originalTerm}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Paid off in</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {data.monthsPaid} mo · {paidIn}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Yearly extras</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {extraMonths.length} payments
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Each extra</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.yearlyExtra)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {hasSavings ? (
        <section className="mt-1" data-pdf-keep-together>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-950">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Outcome snapshot
            </span>
            Debt-free in {data.monthsPaid} months ({paidIn}), {timeSaved} sooner than the{" "}
            {originalTerm} schedule. Interest falls by {formatINRCurrency(data.interestSaved)}{" "}
            after {formatINRCurrency(data.totalExtra)} in yearly extras.
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
          <Param label="Yearly Extra" value={formatINRCurrency(data.yearlyExtra)} />
          <Param label="Recover Return" value={formatPercent(data.recoverReturnPct)} />
          <Param label="EMI" value={formatINRCurrency(data.emi)} />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="recovery-sips"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Interest Recovery SIPs"
          hint={`At ${formatPercent(data.recoverReturnPct)} return over original term`}
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="SIP for original interest"
            value={formatINRCurrency(data.recoverSip)}
            hint="Monthly · before extras"
            tone="slate"
          />
          <SnapshotCard
            label="SIP for revised interest"
            value={formatINRCurrency(data.revisedRecoverSip)}
            hint="Monthly · after extras"
            tone="emerald"
          />
          <SnapshotCard
            label="SIP reduction"
            value={sipLower > 0 ? formatINRCurrency(sipLower) : "₹0"}
            hint={sipLower > 0 ? "Lower monthly investment needed" : "No change"}
            tone={sipLower > 0 ? "emerald" : "slate"}
          />
        </div>
      </section>

      {extraMonths.length > 0 ? (
        <section className="space-y-2" data-pdf-keep-together>
          <ExecutiveSectionHeading
            title="Extra Payment Timeline"
            hint={`${formatINRCurrency(data.yearlyExtra)} at each year-end · repaid month ${data.monthsPaid}`}
          />
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="px-3 py-2.5 font-bold" scope="col">
                    Year mark
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                    Month
                  </th>
                  <th
                    className="px-3 py-2.5 text-right font-semibold text-emerald-300"
                    scope="col"
                  >
                    Extra applied
                  </th>
                </tr>
              </thead>
              <tbody>
                {extraMonths.map((month, index) => (
                  <tr
                    key={month}
                    className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}
                  >
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      Year {index + 1}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">{month}</td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-900">
                      {formatINRCurrency(data.yearlyExtra)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 font-semibold text-emerald-950">
                  <td className="px-3 py-2">Paid off</td>
                  <td className="px-3 py-2 text-right">{data.monthsPaid}</td>
                  <td className="px-3 py-2 text-right">
                    Total extras {formatINRCurrency(data.totalExtra)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Interest Comparison" />
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold" scope="col">
                  Metric
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Scheduled
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  With extras
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="bg-white">
                <td className="px-3 py-2 font-medium">Tenure</td>
                <td className="px-3 py-2 text-right">
                  {originalMonths} mo ({originalTerm})
                </td>
                <td className="px-3 py-2 text-right text-emerald-900">
                  {data.monthsPaid} mo ({paidIn})
                </td>
              </tr>
              <tr className="bg-slate-50/80">
                <td className="px-3 py-2 font-medium">Interest</td>
                <td className="px-3 py-2 text-right">
                  {formatINRCurrency(data.originalInterest)}
                </td>
                <td className="px-3 py-2 text-right text-emerald-900">
                  {formatINRCurrency(data.totalInterest)}
                </td>
              </tr>
              <tr className="bg-emerald-50 font-semibold text-emerald-950">
                <td className="px-3 py-2">Interest saved</td>
                <td className="px-3 py-2 text-right">n/a</td>
                <td className="px-3 py-2 text-right">
                  {formatINRCurrency(data.interestSaved)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" data-purpose="yearly-schedule" data-pdf-keep-together>
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Yearly Prepaid Path" />
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
                  Extra
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Interest
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
                  showOmit={truncated && index === 7 && midOmit > 0}
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
  schedule: LoanPrepayReportData["schedule"],
): Array<{ year: number; extra: number; interest: number; balance: number }> {
  const rows: Array<{
    year: number;
    extra: number;
    interest: number;
    balance: number;
  }> = [];
  if (schedule.length === 0) return rows;

  let year = 1;
  let extra = 0;
  let interest = 0;
  for (let i = 0; i < schedule.length; i++) {
    const row = schedule[i]!;
    extra += row.extra ?? 0;
    interest += row.interest;
    const isYearEnd = row.month % 12 === 0 || i === schedule.length - 1;
    if (isYearEnd) {
      rows.push({
        year,
        extra,
        interest,
        balance: row.balance,
      });
      year += 1;
      extra = 0;
      interest = 0;
    }
  }
  return rows;
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

function YearRow({
  row,
  index,
  showOmit,
  midOmit,
  isLast,
}: {
  row: { year: number; extra: number; interest: number; balance: number };
  index: number;
  showOmit: boolean;
  midOmit: number;
  isLast: boolean;
}) {
  const hasExtra = row.extra > 0;
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
          isLast || hasExtra
            ? "bg-emerald-50 font-semibold text-emerald-950"
            : index % 2 === 1
              ? "bg-slate-50/80"
              : "bg-white"
        }
      >
        <td className="px-3 py-2 text-center">{row.year}</td>
        <td className="px-3 py-2 text-right">
          {hasExtra ? formatINRCurrency(row.extra) : "0"}
        </td>
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
