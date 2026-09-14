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

export type VehicleLoanOption = {
  name: string;
  invested: number;
  maturity: number;
  profit: number;
  netProfit: number;
  outOfPocket: number;
  netOutOfPocket: number;
  financialBenefit: number;
};

export type VehicleLoanReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  onRoadCost: number;
  loanAmount: number;
  interestPct: number;
  years: number;
  incomeTaxPct: number;
  depreciationPct: number;
  fdReturnPct: number;
  debtReturnPct: number;
  conservativeReturnPct: number;
  equityReturnPct: number;
  fdTaxPct: number;
  debtTaxPct: number;
  conservativeTaxPct: number;
  equityTaxPct: number;
  emi: number;
  totalInterest: number;
  totalDepreciation: number;
  taxOnInterest: number;
  taxOnDepreciation: number;
  totalTaxSaved: number;
  best: string | null;
  options: VehicleLoanOption[];
  stacked: Array<{
    category: string;
    taxShield: number;
    opportunity: number;
    netBenefit: number;
  }>;
  depreciation: Array<{
    year: number;
    value: number;
    depreciation: number;
    balance: number;
  }>;
};

type VehicleLoanDossierProps = {
  id?: string;
  data: VehicleLoanReportData;
};

export const VEHICLE_LOAN_REPORT_ID = "vehicle-loan-report";

const RETURN_BY_OPTION: Record<string, keyof VehicleLoanReportData | null> = {
  "No loan": null,
  FD: "fdReturnPct",
  "MF debt": "debtReturnPct",
  Conservative: "conservativeReturnPct",
  Equity: "equityReturnPct",
};

/**
 * Vehicle loan benefit analysis off-screen dossier.
 */
export function VehicleLoanDossier({
  id = VEHICLE_LOAN_REPORT_ID,
  data,
}: VehicleLoanDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const downPayment = Math.max(0, data.onRoadCost - data.loanAmount);
  const ranked = [...data.options].sort(
    (a, b) => b.financialBenefit - a.financialBenefit,
  );
  const top = ranked.find((opt) => opt.name === data.best) ?? ranked[0] ?? null;
  const noLoan = data.options.find((opt) => opt.name === "No loan") ?? null;
  const runnerUp = ranked.find((opt) => opt.name !== top?.name) ?? null;
  const vsNoLoan =
    top && noLoan ? top.financialBenefit - noLoan.financialBenefit : 0;
  const vsRunnerUp =
    top && runnerUp ? top.financialBenefit - runnerUp.financialBenefit : 0;

  const returnFor = (name: string): number | null => {
    const key = RETURN_BY_OPTION[name];
    if (!key) return null;
    const value = data[key];
    return typeof value === "number" ? value : null;
  };

  const playbook = getReportPlaybook("loan-vehicle").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: top
            ? `Under the stated assumptions, ${top.name} delivers a financial benefit of ${formatINRCurrency(top.financialBenefit)}. If financing, invest the ${formatINRCurrency(data.loanAmount)} loan amount on day one while EMI of ${formatINRCurrency(data.emi)}/mo runs.`
            : `Compare loan-plus-invest options against paying cash for the ${formatINRCurrency(data.onRoadCost)} on-road cost.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: `Modeled tax saved is ${formatINRCurrency(data.totalTaxSaved)} (${formatINRCurrency(data.taxOnInterest)} on interest, ${formatINRCurrency(data.taxOnDepreciation)} on depreciation at ${formatPercent(data.incomeTaxPct)}). Confirm treatment before filing.`,
          }
        : {
            ...pillar,
            description:
              top && top.name !== "No loan"
                ? `${top.name} leads the ranking for this ${data.years}-year horizon. Re-check if risk tolerance or tenure changes, especially versus ${runnerUp?.name ?? "cash"}.`
                : `Paying cash (No loan) leads under these returns. Revisit if a tax-efficient sleeve can beat the ${formatPercent(data.interestPct)} loan cost after tax.`,
          },
  );

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Vehicle Loan Benefit Analysis"
      subtitle="Loan plus invest options vs paying cash"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        {
          label: "On-road",
          value: formatINRCurrency(data.onRoadCost),
          emphasize: "emerald",
        },
        { label: "Loan", value: formatINRCurrency(data.loanAmount) },
        { label: "Tenure", value: `${data.years} yrs` },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Cash path
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">
            {noLoan?.name ?? "No loan"}
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(noLoan?.financialBenefit ?? 0)}
            </span>
            <span className="text-[10px] font-medium text-slate-400">benefit</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">On-road cost</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.onRoadCost)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Down payment</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.onRoadCost)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Tax on depreciation</span>
              <span className="font-semibold tabular-nums text-emerald-300">
                {formatINRCurrency(data.taxOnDepreciation)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Loan interest</span>
              <span className="font-semibold tabular-nums text-slate-100">₹0</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Top financed path
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">
            {top?.name ?? "Loan + invest"}
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {formatINRCurrency(top?.financialBenefit ?? 0)}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">benefit</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">Monthly EMI</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.emi)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Net profit</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(top?.netProfit ?? 0)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Investment value</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {(top?.maturity ?? 0) > 0
                  ? formatINRCurrency(top?.maturity ?? 0)
                  : "n/a"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Vs no loan</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {vsNoLoan > 0
                  ? `+${formatINRCurrency(vsNoLoan)}`
                  : formatINRCurrency(vsNoLoan)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {top ? (
        <section className="mt-1" data-pdf-keep-together>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-950">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Outcome snapshot
            </span>
            {top.name} leads with benefit {formatINRCurrency(top.financialBenefit)}
            {vsNoLoan !== 0
              ? ` (${vsNoLoan > 0 ? "+" : ""}${formatINRCurrency(vsNoLoan)} vs no loan)`
              : ""}
            {runnerUp && vsRunnerUp > 0
              ? `. Edge over ${runnerUp.name}: ${formatINRCurrency(vsRunnerUp)}.`
              : "."}{" "}
            EMI {formatINRCurrency(data.emi)}/mo · tax saved{" "}
            {formatINRCurrency(data.totalTaxSaved)}.
          </div>
        </section>
      ) : null}

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Loan Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="On-Road" value={formatINRCurrency(data.onRoadCost)} />
          <Param label="Loan" value={formatINRCurrency(data.loanAmount)} />
          <Param label="Down Payment" value={formatINRCurrency(downPayment)} />
          <Param
            label="Loan Rate"
            value={formatPercent(data.interestPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Tenure" value={`${data.years} Yrs`} />
          <Param label="Income Tax" value={formatPercent(data.incomeTaxPct, 0)} />
        </div>
      </section>

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Investment Sleeve Assumptions" />
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center sm:grid-cols-8">
          <Param label="Depreciation" value={formatPercent(data.depreciationPct, 0)} />
          <Param label="FD Return" value={formatPercent(data.fdReturnPct, 0)} />
          <Param label="MF Debt" value={formatPercent(data.debtReturnPct, 0)} />
          <Param label="Conservative" value={formatPercent(data.conservativeReturnPct, 0)} />
          <Param label="Equity" value={formatPercent(data.equityReturnPct, 0)} />
          <Param label="FD Tax" value={formatPercent(data.fdTaxPct, 0)} />
          <Param label="Debt Tax" value={formatPercent(data.debtTaxPct, 0)} />
          <Param label="Eq / Cons Tax" value={`${formatPercent(data.equityTaxPct, 1)} / ${formatPercent(data.conservativeTaxPct, 1)}`} />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="financing-breakdown"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Financing Breakdown"
          hint="Interest, depreciation, and tax shield"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Monthly EMI"
            value={formatINRCurrency(data.emi)}
            hint={`${data.years}-year loan`}
            tone="slate"
          />
          <SnapshotCard
            label="Interest paid"
            value={formatINRCurrency(data.totalInterest)}
            hint="Over full tenure"
            tone="rose"
          />
          <SnapshotCard
            label="Total tax saved"
            value={formatINRCurrency(data.totalTaxSaved)}
            hint="Interest + depreciation"
            tone="emerald"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Tax on interest"
            value={formatINRCurrency(data.taxOnInterest)}
            hint={`At ${formatPercent(data.incomeTaxPct, 0)}`}
            tone="slate"
          />
          <SnapshotCard
            label="Tax on depreciation"
            value={formatINRCurrency(data.taxOnDepreciation)}
            hint={`${formatPercent(data.depreciationPct, 0)} declining`}
            tone="slate"
          />
          <SnapshotCard
            label="Total depreciation"
            value={formatINRCurrency(data.totalDepreciation)}
            hint={`${data.years} years`}
            tone="emerald"
          />
        </div>
      </section>

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Option Ranking"
          hint="Sorted by financial benefit"
        />
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold" scope="col">
                  #
                </th>
                <th className="px-3 py-2.5 font-semibold" scope="col">
                  Option
                </th>
                <th className="px-3 py-2.5 text-right font-semibold" scope="col">
                  Return
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Investment
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Net Profit
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Benefit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ranked.map((opt, index) => {
                const isTop = top?.name === opt.name;
                const returnPct = returnFor(opt.name);
                const stacked = data.stacked.find((row) => row.category === opt.name);
                return (
                  <tr
                    key={opt.name}
                    className={
                      isTop
                        ? "bg-emerald-50 font-semibold text-emerald-950"
                        : index % 2 === 1
                          ? "bg-slate-50/80"
                          : "bg-white"
                    }
                  >
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 text-left">{opt.name}</td>
                    <td className="px-3 py-2 text-right">
                      {returnPct == null ? "n/a" : formatPercent(returnPct, 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {opt.maturity > 0 ? formatINRCurrency(opt.maturity) : "n/a"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {opt.name === "No loan" && opt.netProfit === 0
                        ? "n/a"
                        : formatINRCurrency(opt.netProfit)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-900">
                      {formatINRCurrency(opt.financialBenefit)}
                      {stacked ? (
                        <span className="mt-0.5 block text-[10px] font-medium text-slate-500">
                          Shield {formatINRCurrency(stacked.taxShield)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" data-purpose="depreciation" data-pdf-keep-together>
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Depreciation Schedule" />
          <span className="text-[11px] font-medium text-slate-400">
            Total {formatINRCurrency(data.totalDepreciation)}
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
                  Opening Value
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Depreciation
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Closing Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.depreciation.map((row, index) => {
                const isLast = index === data.depreciation.length - 1;
                return (
                  <tr
                    key={row.year}
                    className={
                      isLast
                        ? "bg-emerald-50 font-semibold text-emerald-950"
                        : index % 2 === 1
                          ? "bg-slate-50/80"
                          : "bg-white"
                    }
                  >
                    <td className="px-3 py-2 text-center">{row.year}</td>
                    <td className="px-3 py-2 text-right">{formatINRCurrency(row.value)}</td>
                    <td className="px-3 py-2 text-right text-rose-700">
                      {formatINRCurrency(row.depreciation)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-900">
                      {formatINRCurrency(row.balance)}
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
