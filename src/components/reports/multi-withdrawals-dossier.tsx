"use client";

import { formatINRCurrency, formatPercent, WithdrawalPathChart } from "@nivra/ui";
import {
  DUMMY_REPORT_CONTACT,
  ExecutiveDossierSheet,
  ExecutivePlaybook,
  ExecutiveSectionHeading,
  type ExecutiveContact,
} from "@/components/reports/executive-dossier";
import { getReportPlaybook } from "@/lib/report-playbooks";

export type MultiWithdrawalsReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  returnPct: number;
  taxPct: number;
  startMonthlySip: number;
  totalInvested: number;
  totalWithdrawn: number;
  totalTax: number;
  rows: Array<{
    name: string;
    atAge: number;
    amount: number;
    monthlySip: number;
    invested: number;
    years: number;
    peakCorpus: number;
    tax: number;
  }>;
  phases: Array<{ fromAge: number; toAge: number; monthlySip: number }>;
  schedule: Array<{
    age: number;
    corpus: number;
    withdrawal: number;
    monthlySip: number;
  }>;
};

/** Chart tokens so Recharts paints correctly on the off-screen white sheet. */
const REPORT_CHART_VARS = {
  ["--app-chart-invested" as string]: "#152033",
  ["--app-chart-gain" as string]: "#34d399",
  ["--app-chart-tax" as string]: "#f87171",
  ["--app-text" as string]: "#0f172a",
  ["--app-text-muted" as string]: "#64748b",
  ["--app-text-subtle" as string]: "#94a3b8",
  ["--app-border" as string]: "#e2e8f0",
  ["--app-surface" as string]: "#ffffff",
  ["--app-primary" as string]: "#0f172a",
  ["--app-primary-soft" as string]: "#cbd5e1",
  ["--app-danger" as string]: "#ef4444",
  ["--app-step-text" as string]: "#047857",
} as const;

type MultiWithdrawalsDossierProps = {
  id?: string;
  data: MultiWithdrawalsReportData;
};

export const MULTI_WITHDRAWALS_REPORT_ID = "multi-withdrawals-report";

/**
 * SIP Required for Multiple Withdrawals off-screen dossier.
 * Matches Goal SIP / MF vs FD executive report style.
 */
export function MultiWithdrawalsDossier({
  id = MULTI_WITHDRAWALS_REPORT_ID,
  data,
}: MultiWithdrawalsDossierProps) {
  const lastAge = data.rows.reduce((m, r) => Math.max(m, r.atAge), data.age);
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };
  const payoutAges = new Set(data.rows.map((r) => r.atAge)).size;

  const playbook = getReportPlaybook("multi-withdrawals").map((p) =>
    p.id === "01"
      ? {
          ...p,
          description: `Begin the combined opening SIP of ${formatINRCurrency(data.startMonthlySip)}/mo so each of the ${data.rows.length} timed withdrawals compounds from the current age (${data.age}).`,
        }
      : p.id === "02"
        ? {
            ...p,
            description: `Monthly SIP steps down across ${data.phases.length} funding phases as goals hit. After the final payout at age ${lastAge}, the SIP can stop.`,
          }
        : p,
  );

  const pathData = data.schedule.map((row) => ({
    year: row.age,
    corpus: row.corpus,
    withdrawal: row.withdrawal,
    after: row.withdrawal > 0 ? Math.max(0, row.corpus - row.withdrawal) : null,
    marker: row.withdrawal > 0 ? row.corpus : null,
  }));
  const milestones = data.rows.map((row) => ({
    age: row.atAge,
    label: row.name,
    amount: row.amount,
  }));

  const ageRows = data.schedule.filter((r) => r.age >= data.age);
  const truncated = ageRows.length > 20;
  const shownAges = truncated
    ? [...ageRows.slice(0, 10), ...ageRows.slice(-10)]
    : ageRows;
  const midOmit = truncated ? Math.max(0, ageRows.length - 20) : 0;

  return (
    <ExecutiveDossierSheet
      id={id}
      title="SIP for Multiple Withdrawals"
      subtitle="Timed goal funding · SIP step-down"
      contact={contact}
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Timeline Window",
          value: `Age ${data.age} to ${lastAge}`,
        },
        {
          label: "Opening SIP",
          value: formatINRCurrency(data.startMonthlySip),
          emphasize: "emerald",
        },
      ]}
    >
      <section className="space-y-3" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary SIP & Withdrawal Milestones"
          hint={`${data.rows.length} goals · ${formatPercent(data.returnPct)} CAGR · ${formatPercent(data.taxPct)} tax at payout`}
        />

        <div className="flex gap-3">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
            <div className="border-b border-slate-800 pb-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Monthly SIP
              </span>
              <h3 className="text-sm font-bold text-slate-100">Start Monthly SIP</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-white">
                {formatINRCurrency(data.startMonthlySip)}
              </span>
              <span className="text-xs font-medium text-slate-400">/ month</span>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Total Invested</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {formatINRCurrency(data.totalInvested)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Total Tax</span>
                <span className="block truncate font-medium tabular-nums text-rose-300">
                  {formatINRCurrency(data.totalTax)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-slate-400">Phases</span>
                <span className="block truncate font-medium tabular-nums text-slate-200">
                  {data.phases.length}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="border-b border-emerald-200/60 pb-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Total withdrawn
              </span>
              <h3 className="text-sm font-bold text-emerald-950">Total Withdrawn</h3>
            </div>
            <div className="flex items-baseline space-x-2 py-3">
              <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950">
                {formatINRCurrency(data.totalWithdrawn)}
              </span>
            </div>
            <div className="flex gap-2 border-t border-emerald-200/60 pt-2.5 text-[11px]">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Goals</span>
                <span className="block truncate font-bold tabular-nums text-emerald-950">
                  {data.rows.length}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Payout Ages</span>
                <span className="block truncate font-medium tabular-nums text-emerald-700">
                  {payoutAges}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-emerald-800">Final Age</span>
                <span className="block truncate font-medium tabular-nums text-slate-700">
                  {lastAge}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              <strong>Note:</strong> An opening SIP of{" "}
              <strong>{formatINRCurrency(data.startMonthlySip)}</strong>/mo funds{" "}
              {data.rows.length} timed withdrawals totaling{" "}
              <strong>{formatINRCurrency(data.totalWithdrawn)}</strong>, with the monthly SIP
              stepping down after each payout through age {lastAge}.
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            {data.age} to {lastAge}
          </span>
        </div>
      </section>

      <section className="space-y-2" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param
            label="Return CAGR"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Tax at Payout" value={formatPercent(data.taxPct)} />
          <Param label="Goals" value={String(data.rows.length)} />
          <Param label="Opening SIP" value={formatINRCurrency(data.startMonthlySip)} />
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              End age
            </span>
            <span className="mt-1 inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-800">
              AGE {lastAge}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-2" data-purpose="corpus-over-age">
        <ExecutiveSectionHeading
          title="Corpus over age"
          hint="Red markers at each withdrawal"
        />
        <div style={REPORT_CHART_VARS}>
          <WithdrawalPathChart
            data={pathData}
            milestones={milestones}
            compact
            className="h-64 min-h-64 flex-none border-slate-200 p-3 shadow-sm sm:h-64 sm:min-h-64 sm:p-3"
          />
        </div>
      </section>

      <section className="space-y-2" data-purpose="per-goal-schedule" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Per Withdrawal SIP Schedule" />
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2 font-bold" scope="col">
                  Goal
                </th>
                <th className="px-3 py-2 text-center font-semibold" scope="col">
                  Age
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-300" scope="col">
                  Amount
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Monthly SIP
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-300" scope="col">
                  Invested
                </th>
                <th className="px-3 py-2 text-center font-semibold" scope="col">
                  Yrs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.rows.map((row, i) => {
                const isLast = i === data.rows.length - 1;
                return (
                  <tr
                    key={`${row.name}-${row.atAge}-${i}`}
                    className={
                      isLast
                        ? "border-t-2 border-emerald-500 bg-emerald-100/70 font-bold"
                        : undefined
                    }
                  >
                    <td
                      className={`max-w-[160px] truncate px-3 py-1.5 ${
                        isLast ? "text-emerald-950" : "font-medium text-slate-900"
                      }`}
                      title={row.name}
                    >
                      {row.name}
                    </td>
                    <td className="px-3 py-1.5 text-center">{row.atAge}</td>
                    <td className="px-3 py-1.5 text-right">{formatINRCurrency(row.amount)}</td>
                    <td
                      className={`px-3 py-1.5 text-right ${
                        isLast
                          ? "bg-emerald-200/60 font-black text-emerald-950"
                          : "bg-emerald-50/40 font-semibold text-emerald-950"
                      }`}
                    >
                      {formatINRCurrency(row.monthlySip)}
                    </td>
                    <td className="px-3 py-1.5 text-right">{formatINRCurrency(row.invested)}</td>
                    <td className="px-3 py-1.5 text-center">{row.years}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2" data-purpose="age-path">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Age Path · Corpus & Withdrawals" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Corpus
            </span>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              Withdrawal
            </span>
            <span className="text-slate-400">• {ageRows.length} Ages</span>
          </div>
        </div>

        {truncated ? (
          <p className="text-xs text-slate-500">
            Showing the first 10 and last 10 ages of {ageRows.length} modeled years (
            {midOmit} omitted).
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2 text-center font-bold" scope="col">
                  Age
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-300" scope="col">
                  Monthly SIP
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-200" scope="col">
                  Corpus
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Withdrawal
                </th>
                <th className="px-3 py-2 text-right font-semibold" scope="col">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shownAges.map((row, i) => {
                const isPayout = row.withdrawal > 0;
                const isStart = row.age === data.age;
                const isEnd = row.age === lastAge;
                const showEllipsisBefore = truncated && i === 10;
                return (
                  <AgePathRows
                    key={row.age}
                    row={row}
                    isPayout={isPayout}
                    isStart={isStart}
                    isEnd={isEnd}
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

function AgePathRows({
  row,
  isPayout,
  isStart,
  isEnd,
  showEllipsisBefore,
  midOmit,
}: {
  row: { age: number; corpus: number; withdrawal: number; monthlySip: number };
  isPayout: boolean;
  isStart: boolean;
  isEnd: boolean;
  showEllipsisBefore: boolean;
  midOmit: number;
}) {
  return (
    <>
      {showEllipsisBefore ? (
        <tr key={`ellipsis-${row.age}`} className="bg-slate-50">
          <td
            colSpan={5}
            className="px-3 py-1.5 text-center text-[11px] font-medium text-slate-400"
          >
            … {midOmit} ages omitted …
          </td>
        </tr>
      ) : null}
      <tr
        className={
          isPayout
            ? "border-t border-emerald-300 bg-emerald-100/60 font-bold"
            : isStart
              ? "bg-slate-50"
              : undefined
        }
      >
        <td
          className={`px-3 py-1.5 text-center font-bold ${
            isPayout ? "text-emerald-950" : "text-slate-900"
          }`}
        >
          {row.age}
        </td>
        <td className="px-3 py-1.5 text-right">{formatINRCurrency(row.monthlySip)}</td>
        <td className="px-3 py-1.5 text-right font-semibold text-slate-900">
          {formatINRCurrency(row.corpus)}
        </td>
        <td
          className={`px-3 py-1.5 text-right ${
            isPayout
              ? "bg-emerald-200/60 font-black text-emerald-950"
              : "bg-emerald-50/30 text-slate-500"
          }`}
        >
          {row.withdrawal > 0 ? formatINRCurrency(row.withdrawal) : "-"}
        </td>
        <td
          className={`px-3 py-1.5 text-right text-[11px] ${
            isPayout
              ? "font-black text-emerald-800"
              : isEnd
                ? "font-semibold text-slate-500"
                : "text-slate-400"
          }`}
        >
          {isPayout ? "Payout" : isStart ? "Start" : isEnd ? "End" : ""}
        </td>
      </tr>
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
