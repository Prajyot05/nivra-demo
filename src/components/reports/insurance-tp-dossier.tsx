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

export type InsuranceTpReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  premium: number;
  payTerm: number;
  yearsPaid: number;
  policyTerm: number;
  yearsToMaturity: number;
  maturityValue: number;
  taxPct: number;
  surrenderValue: number;
  termPremium: number;
  termYears: number;
  termCover: number;
  returnPct: number;
  remainingPremiums: number;
  investmentPeriodYears: number;
  additionalWealth: number;
  keep: {
    totalPremium: number;
    maturity: number;
    tax: number;
    net: number;
    /** Decimal from engine. */
    irr: number;
  };
  switch: {
    surrenderValue: number;
    termCost: number;
    investMaturity: number;
    /** Decimal from engine. */
    irr: number;
    /** Decimal from engine. */
    surrenderIrr: number;
    totalPaidToDate: number;
    sipRedirectAnnual: number;
    corpusPath: Array<{ year: number; corpus: number }>;
  };
  compare: Array<{ category: string; keep: number; switch: number }>;
};

type InsuranceTpDossierProps = {
  id?: string;
  data: InsuranceTpReportData;
};

export const INSURANCE_TP_REPORT_ID = "insurance-tp-report";

function formatIrrPct(decimal: number): string {
  if (!Number.isFinite(decimal)) return "n/a";
  return formatPercent(decimal * 100, 2);
}

/**
 * Insurance Keep vs Switch (term + invest) off-screen dossier.
 */
export function InsuranceTpDossier({
  id = INSURANCE_TP_REPORT_ID,
  data,
}: InsuranceTpDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const additionalWealth =
    data.additionalWealth || data.switch.investMaturity - data.keep.net;
  const switchLeads = data.switch.investMaturity > data.keep.net + 1e-6;
  const keepLeads = data.keep.net > data.switch.investMaturity + 1e-6;
  const tied = !switchLeads && !keepLeads;
  const advantage = Math.abs(data.switch.investMaturity - data.keep.net);
  const initialFunding = data.switch.surrenderValue + data.switch.termCost;

  const path = data.switch.corpusPath ?? [];
  const truncated = path.length > 14;
  const shownPath = truncated
    ? [...path.slice(0, 7), ...path.slice(-7)]
    : path;
  const midOmit = truncated ? Math.max(0, path.length - 14) : 0;

  const playbook = getReportPlaybook("insurance").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description:
            data.termCover > 0
              ? `Keep pure term cover of ${formatINRCurrency(data.termCover)} in place if you switch, so protection is not dropped while the savings sleeve is rebuilt.`
              : "Size pure term cover to income replacement needs before surrendering an investment-linked policy.",
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: switchLeads
              ? `Switching projects ${formatINRCurrency(additionalWealth)} more wealth than keeping (${formatINRCurrency(data.switch.investMaturity)} vs ${formatINRCurrency(data.keep.net)}). Confirm term premiums of ${formatINRCurrency(data.termPremium)}/yr stay affordable for ${data.termYears} years.`
              : keepLeads
                ? `Keeping the policy projects a higher net of ${formatINRCurrency(data.keep.net)} vs switch corpus ${formatINRCurrency(data.switch.investMaturity)}. Confirm remaining premiums of ${formatINRCurrency(data.premium)}/yr for ${data.remainingPremiums} years stay affordable.`
                : `Keep and switch land near ${formatINRCurrency(data.keep.net)}. Decide on cover continuity and surrender liquidity rather than yield alone.`,
          }
        : {
            ...pillar,
            description: `Surrender value ${formatINRCurrency(data.surrenderValue)} plus redirected SIP of ${formatINRCurrency(data.switch.sipRedirectAnnual)}/yr (after term) builds the switch corpus at ${formatPercent(data.returnPct)}. Do not treat the old policy as a goal SIP substitute without checking cover.`,
          },
  );

  const compareRows = [
    {
      label: "Initial / surrender",
      keep: "n/a",
      switch: formatINRCurrency(data.switch.surrenderValue),
    },
    {
      label: "Term cost",
      keep: "n/a",
      switch: formatINRCurrency(data.switch.termCost),
    },
    {
      label: "Term cover",
      keep: "n/a",
      switch: data.termCover > 0 ? formatINRCurrency(data.termCover) : "n/a",
    },
    {
      label: "Maturity / corpus",
      keep: formatINRCurrency(data.keep.maturity),
      switch: formatINRCurrency(data.switch.investMaturity),
    },
    {
      label: "Tax",
      keep: formatINRCurrency(data.keep.tax),
      switch: "n/a",
    },
    {
      label: "Net / final value",
      keep: formatINRCurrency(data.keep.net),
      switch: formatINRCurrency(data.switch.investMaturity),
      highlight: true,
    },
    {
      label: "IRR",
      keep: formatIrrPct(data.keep.irr),
      switch: formatIrrPct(data.switch.irr),
    },
  ];

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Keep vs Switch Analysis"
      subtitle="Surrender to term cover plus investment"
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Age", value: `${data.age} yrs` },
        {
          label: "Horizon",
          value: `${data.yearsToMaturity} yrs`,
          emphasize: "emerald",
        },
        { label: "Surrender", value: formatINRCurrency(data.surrenderValue) },
        { label: "Invest return", value: formatPercent(data.returnPct) },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Option 1
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">Keep the policy</h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.keep.net)}
            </span>
            <span className="text-[10px] font-medium text-slate-400">net after tax</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Gross maturity</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.keep.maturity)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Tax</span>
              <span className="font-semibold tabular-nums text-rose-300">
                {formatINRCurrency(data.keep.tax)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Keep IRR</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatIrrPct(data.keep.irr)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Remaining premiums</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {data.remainingPremiums} yrs
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Option 2
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">
            Switch to term + invest
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {formatINRCurrency(data.switch.investMaturity)}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">corpus</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">Surrender invested</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.switch.surrenderValue)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Term cost</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.switch.termCost)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Switch IRR</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatIrrPct(data.switch.irr)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Surrender IRR</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatIrrPct(data.switch.surrenderIrr)}
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
            ? `Keep and switch land at a similar final value near ${formatINRCurrency(data.keep.net)} over ${data.yearsToMaturity} years.`
            : switchLeads
              ? `Switching adds ${formatINRCurrency(advantage)} versus keeping (${formatINRCurrency(data.switch.investMaturity)} corpus vs ${formatINRCurrency(data.keep.net)} net). Horizon ${data.yearsToMaturity}y at ${formatPercent(data.returnPct)}.`
              : `Keeping leads by ${formatINRCurrency(advantage)} (${formatINRCurrency(data.keep.net)} net vs ${formatINRCurrency(data.switch.investMaturity)} switch corpus).`}
          {data.termCover > 0
            ? ` Term cover modeled at ${formatINRCurrency(data.termCover)}.`
            : ""}
        </div>
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center sm:grid-cols-8">
          <Param label="Premium" value={formatINRCurrency(data.premium)} />
          <Param label="Years Paid" value={String(data.yearsPaid)} />
          <Param label="Pay Term" value={`${data.payTerm} Yrs`} />
          <Param label="Yrs to Maturity" value={`${data.yearsToMaturity} Yrs`} />
          <Param label="Maturity Value" value={formatINRCurrency(data.maturityValue)} />
          <Param label="Surrender" value={formatINRCurrency(data.surrenderValue)} />
          <Param
            label="Invest Return"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Tax" value={formatPercent(data.taxPct, 0)} />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="switch-funding"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Switch Funding Snapshot"
          hint="Surrender plus term cost vs projected corpus"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Surrender invested"
            value={formatINRCurrency(data.switch.surrenderValue)}
            hint="Parked into investments"
            tone="slate"
          />
          <SnapshotCard
            label="Term cost"
            value={formatINRCurrency(data.switch.termCost)}
            hint={`${formatINRCurrency(data.termPremium)}/yr × ${data.termYears}y`}
            tone="rose"
          />
          <SnapshotCard
            label="Additional wealth"
            value={formatINRCurrency(additionalWealth)}
            hint="Switch corpus less keep net"
            tone="emerald"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Initial funding"
            value={formatINRCurrency(initialFunding)}
            hint="Surrender + term cost"
            tone="slate"
          />
          <SnapshotCard
            label="SIP redirect / yr"
            value={formatINRCurrency(data.switch.sipRedirectAnnual)}
            hint="Premium less term premium"
            tone="emerald"
          />
          <SnapshotCard
            label="Paid to date"
            value={formatINRCurrency(data.switch.totalPaidToDate)}
            hint={`${data.yearsPaid} premiums already paid`}
            tone="slate"
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
                  Keep
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Switch
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
                  <td className="px-3 py-2 text-right">{row.keep}</td>
                  <td className="px-3 py-2 text-right text-emerald-900">{row.switch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500">
          Surrender IRR {formatIrrPct(data.switch.surrenderIrr)} · Investment IRR{" "}
          {formatIrrPct(data.switch.irr)} · Investment period{" "}
          {data.investmentPeriodYears} years.
        </p>
      </section>

      {shownPath.length > 0 ? (
        <section className="space-y-3" data-purpose="corpus-path" data-pdf-keep-together>
          <div className="flex items-center justify-between gap-2">
            <ExecutiveSectionHeading title="Switch Corpus Path" />
            <span className="text-[11px] font-medium text-slate-400">
              {path.length} years
              {truncated ? ` · showing ${shownPath.length}` : ""}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
                <tr>
                  <th className="px-3 py-2.5 text-center font-bold" scope="col">
                    Yr
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
                {shownPath.map((row, index) => (
                  <PathRow
                    key={row.year}
                    row={row}
                    index={index}
                    showOmit={truncated && index === 7 && midOmit > 0}
                    midOmit={midOmit}
                    isLast={row.year === data.yearsToMaturity}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

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

function PathRow({
  row,
  index,
  showOmit,
  midOmit,
  isLast,
}: {
  row: { year: number; corpus: number };
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
            colSpan={2}
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
        <td className="px-3 py-2 text-right text-emerald-900">
          {formatINRCurrency(row.corpus)}
        </td>
      </tr>
    </>
  );
}
