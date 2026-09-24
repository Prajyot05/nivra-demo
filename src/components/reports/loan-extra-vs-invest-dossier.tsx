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

export type LoanExtraVsInvestReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  principal: number;
  years: number;
  interestPct: number;
  extraAmount: number;
  extraMonth: number;
  investReturnPct: number;
  taxPct: number;
  incomeTaxPct: number;
  emi: number;
  originalInterest: number;
  originalNetCost: number;
  option1Interest: number;
  option1Saving: number;
  option1NetCost: number;
  corpusAfterTax: number;
  option2Saving: number;
  option2NetCost: number;
  remainingMonths: number;
  interestSavedVsOriginal: number;
  path: Array<{
    month: number;
    outstandingPrepay: number;
    investment: number;
  }>;
};

type LoanExtraVsInvestDossierProps = {
  id?: string;
  data: LoanExtraVsInvestReportData;
};

export const LOAN_EXTRA_VS_INVEST_REPORT_ID = "loan-extra-vs-invest-report";

function formatRemaining(months: number): string {
  const rounded = Math.max(0, Math.round(months));
  const years = Math.floor(rounded / 12);
  const rem = rounded % 12;
  if (years === 0) return `${rem}m`;
  if (rem === 0) return `${years}y`;
  return `${years}y ${rem}m`;
}

/**
 * Loan Extra Payment vs Investment off-screen dossier.
 */
export function LoanExtraVsInvestDossier({
  id = LOAN_EXTRA_VS_INVEST_REPORT_ID,
  data,
}: LoanExtraVsInvestDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const investLeads = data.option2Saving > data.option1Saving + 1e-6;
  const prepayLeads = data.option1Saving > data.option2Saving + 1e-6;
  const tied = !investLeads && !prepayLeads;
  const advantage = Math.abs(data.option2Saving - data.option1Saving);
  const decisionMonth = Math.min(
    Math.max(1, Math.round(data.extraMonth)),
    data.path[data.path.length - 1]?.month ?? data.extraMonth,
  );
  const remaining = formatRemaining(data.remainingMonths);
  const originalMonths = data.years * 12;
  const debtFreeFaster = data.remainingMonths + decisionMonth < originalMonths;

  const crossover = data.path.find(
    (row) => row.investment > 0 && row.investment >= row.outstandingPrepay,
  );
  const endPoint = data.path[data.path.length - 1];

  const pathRows = buildPathRows(data.path, decisionMonth, crossover?.month);
  const truncated = pathRows.length > 14;
  const shownPath = truncated
    ? [...pathRows.slice(0, 7), ...pathRows.slice(-7)]
    : pathRows;
  const midOmit = truncated ? Math.max(0, pathRows.length - 14) : 0;

  const playbook = getReportPlaybook("loan-extra").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: `At month ${decisionMonth}, deploy the surplus of ${formatINRCurrency(data.extraAmount)} either into principal or into investments. Confirm the amortisation schedule updates if you prepay.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: tied
              ? `Prepay and invest land at a similar net saving near ${formatINRCurrency(data.option1Saving)} under ${formatPercent(data.investReturnPct)} return and ${formatPercent(data.taxPct)} capital gains tax. Decide on debt freedom vs liquidity.`
              : prepayLeads
                ? `Prepaying saves ${formatINRCurrency(data.option1Saving)} vs original loan cost, ${formatINRCurrency(advantage)} more than investing at ${formatPercent(data.investReturnPct)} after tax. Prefer principal reduction when the loan rate dominates post-tax returns.`
                : `Investing the extra builds ${formatINRCurrency(data.corpusAfterTax)} after tax and a net saving of ${formatINRCurrency(data.option2Saving)}, ${formatINRCurrency(advantage)} more than prepaying. Keep investing when expected post-tax return beats the loan rate.`,
          }
        : {
            ...pillar,
            description: debtFreeFaster
              ? `Prepaying shortens the remaining loan to about ${remaining} after the extra at month ${decisionMonth}. Keep EMI constant so tenure compresses unless cash-flow relief is the priority.`
              : `If cash-flow relief matters more than tenure, keep the extra on the invest path and leave EMI unchanged on the original ${data.years}-year schedule.`,
          },
  );

  const compareRows = [
    {
      label: "Initial amount",
      prepay: formatINRCurrency(data.extraAmount),
      invest: formatINRCurrency(data.extraAmount),
    },
    {
      label: "Loan interest benefit",
      prepay: formatINRCurrency(data.interestSavedVsOriginal),
      invest: "n/a",
    },
    {
      label: "Investment corpus after tax",
      prepay: "n/a",
      invest: formatINRCurrency(data.corpusAfterTax),
    },
    {
      label: "Net cost",
      prepay: formatINRCurrency(data.option1NetCost),
      invest: formatINRCurrency(data.option2NetCost),
    },
    {
      label: "Net saving vs original",
      prepay: formatINRCurrency(data.option1Saving),
      invest: formatINRCurrency(data.option2Saving),
      highlight: true,
    },
    {
      label: "Remaining loan",
      prepay: `~${remaining}`,
      invest: `${data.years}y`,
    },
  ];

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Extra Payment vs Investment"
      subtitle="Prepay the loan or invest the same surplus"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        { label: "Extra", value: formatINRCurrency(data.extraAmount), emphasize: "emerald" },
        { label: "At month", value: String(decisionMonth) },
        { label: "Loan rate", value: formatPercent(data.interestPct) },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Option 1
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">Prepay the loan</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.option1Saving)}
            </span>
            <span className="text-[10px] font-medium text-slate-400">net saving</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Interest after extra</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.option1Interest)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Interest saved</span>
              <span className="font-semibold tabular-nums text-emerald-300">
                {formatINRCurrency(data.interestSavedVsOriginal)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Net loan cost</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.option1NetCost)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Remaining tenure</span>
              <span className="font-semibold tabular-nums text-slate-100">~{remaining}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Option 2
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">Invest the extra</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {formatINRCurrency(data.option2Saving)}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">net saving</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">Corpus after tax</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.corpusAfterTax)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Net cost</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.option2NetCost)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Invest return</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatPercent(data.investReturnPct)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">CG tax</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatPercent(data.taxPct)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-1" data-pdf-keep-together>
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${
            tied
              ? "border-slate-200 bg-slate-50 text-slate-700"
              : "border-emerald-200 bg-emerald-50/60 text-emerald-950"
          }`}
        >
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Outcome snapshot
          </span>
          {tied
            ? `Both paths deliver a similar net saving near ${formatINRCurrency(data.option1Saving)} for an extra of ${formatINRCurrency(data.extraAmount)} at month ${decisionMonth}.`
            : prepayLeads
              ? `Prepaying leads by ${formatINRCurrency(advantage)} in net saving. Loan remaining after the extra is about ${remaining}${debtFreeFaster ? ", shorter than the original tenure" : ""}.`
              : `Investing leads by ${formatINRCurrency(advantage)} in net saving, with after-tax corpus ${formatINRCurrency(data.corpusAfterTax)}${crossover ? ` · investment overtakes outstanding near month ${crossover.month}` : ""}.`}
        </div>
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center sm:grid-cols-8">
          <Param label="Principal" value={formatINRCurrency(data.principal)} />
          <Param label="Tenure" value={`${data.years} Yrs`} />
          <Param
            label="Loan Rate"
            value={formatPercent(data.interestPct)}
            valueClass="text-emerald-700"
          />
          <Param label="EMI" value={formatINRCurrency(data.emi)} />
          <Param label="Extra Amount" value={formatINRCurrency(data.extraAmount)} />
          <Param label="Extra Month" value={`M${decisionMonth}`} />
          <Param label="Invest Return" value={formatPercent(data.investReturnPct)} />
          <Param label="CG / Income Tax" value={`${formatPercent(data.taxPct, 1)} / ${formatPercent(data.incomeTaxPct, 0)}`} />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="baseline-snapshot"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Original Loan Baseline"
          hint="Cost if no extra payment is made"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Monthly EMI"
            value={formatINRCurrency(data.emi)}
            hint={`${data.years} year tenure`}
            tone="slate"
          />
          <SnapshotCard
            label="Original interest"
            value={formatINRCurrency(data.originalInterest)}
            hint="Lifetime interest"
            tone="rose"
          />
          <SnapshotCard
            label="Original net cost"
            value={formatINRCurrency(data.originalNetCost)}
            hint="After income-tax benefit"
            tone="emerald"
          />
        </div>
      </section>

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Decision Comparison" />
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold" scope="col">
                  Metric
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Prepay
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Invest
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
                  <td className="px-3 py-2 text-right">{row.prepay}</td>
                  <td className="px-3 py-2 text-right text-emerald-900">{row.invest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" data-purpose="path-schedule" data-pdf-keep-together>
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Outstanding vs Investment Path" />
          <span className="text-[11px] font-medium text-slate-400">
            {pathRows.length} marks
            {truncated ? ` · showing ${shownPath.length}` : ""}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 text-center font-bold" scope="col">
                  Month
                </th>
                <th className="px-3 py-2.5 font-semibold" scope="col">
                  Note
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Loan Outstanding
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Investment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shownPath.map((row, index) => (
                <PathRow
                  key={`${row.month}-${row.note}`}
                  row={row}
                  index={index}
                  showOmit={truncated && index === 7 && midOmit > 0}
                  midOmit={midOmit}
                />
              ))}
            </tbody>
          </table>
        </div>
        {endPoint ? (
          <p className="text-[11px] text-slate-500">
            At month {endPoint.month}: loan outstanding{" "}
            {formatINRCurrency(endPoint.outstandingPrepay)}, investment{" "}
            {formatINRCurrency(endPoint.investment)}.
          </p>
        ) : null}
      </section>

      <div className="mt-2" data-pdf-keep-together>
        <ExecutivePlaybook pillars={playbook} compact />
      </div>
    </ExecutiveDossierSheet>
  );
}

function buildPathRows(
  path: LoanExtraVsInvestReportData["path"],
  decisionMonth: number,
  crossoverMonth?: number,
): Array<{
  month: number;
  note: string;
  outstanding: number;
  investment: number;
  milestone: boolean;
}> {
  if (path.length === 0) return [];

  const byMonth = new Map(path.map((row) => [row.month, row]));
  const lastMonth = path[path.length - 1]?.month ?? 0;
  const marks = new Set<number>();

  marks.add(1);
  marks.add(decisionMonth);
  if (crossoverMonth) marks.add(crossoverMonth);
  marks.add(lastMonth);

  for (let m = 12; m <= lastMonth; m += 12) {
    marks.add(m);
  }

  return [...marks]
    .filter((m) => byMonth.has(m))
    .sort((a, b) => a - b)
    .map((month) => {
      const row = byMonth.get(month)!;
      let note = month % 12 === 0 ? `Year ${month / 12}` : `Month ${month}`;
      if (month === decisionMonth) note = "Decision";
      if (crossoverMonth && month === crossoverMonth) note = "Investment overtakes";
      if (month === lastMonth && month !== decisionMonth) note = "Horizon end";
      return {
        month,
        note,
        outstanding: row.outstandingPrepay,
        investment: row.investment,
        milestone:
          month === decisionMonth ||
          month === crossoverMonth ||
          month === lastMonth,
      };
    });
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

function PathRow({
  row,
  index,
  showOmit,
  midOmit,
}: {
  row: {
    month: number;
    note: string;
    outstanding: number;
    investment: number;
    milestone: boolean;
  };
  index: number;
  showOmit: boolean;
  midOmit: number;
}) {
  return (
    <>
      {showOmit ? (
        <tr className="bg-slate-50/80">
          <td
            colSpan={4}
            className="px-3 py-2 text-center text-[11px] font-medium text-slate-400"
          >
            … {midOmit} marks omitted …
          </td>
        </tr>
      ) : null}
      <tr
        className={
          row.milestone
            ? "bg-emerald-50 font-semibold text-emerald-950"
            : index % 2 === 1
              ? "bg-slate-50/80"
              : "bg-white"
        }
      >
        <td className="px-3 py-2 text-center">{row.month}</td>
        <td className="px-3 py-2">{row.note}</td>
        <td className="px-3 py-2 text-right">{formatINRCurrency(row.outstanding)}</td>
        <td className="px-3 py-2 text-right text-emerald-900">
          {formatINRCurrency(row.investment)}
        </td>
      </tr>
    </>
  );
}
