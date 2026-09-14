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

export type ChildEducationReportData = {
  clientName: string;
  age: number;
  childName: string;
  childAge: number;
  email?: string;
  phone?: string;
  returnPct: number;
  taxPct: number;
  lastFeeAge: number;
  sipYears: number;
  totalCost: number;
  totalTax: number;
  totalWithdrawal: number;
  lumpsum: {
    lumpsum: number;
    invested: number;
    tax: number;
    peakCorpus: number;
    remaining: number;
  };
  sip: {
    monthlySip: number;
    invested: number;
    tax: number;
    peakCorpus: number;
    remaining: number;
  };
  compare: Array<{ category: string; lumpsum: number; sip: number }>;
  schedule: Array<{
    age: number;
    classLabel: string;
    cost: number;
    tax: number;
    withdrawal: number;
    sipCorpus: number;
    sipBalance: number;
    lumpsumBalance: number;
  }>;
};

type ChildEducationDossierProps = {
  id?: string;
  data: ChildEducationReportData;
};

export const CHILD_EDUCATION_REPORT_ID = "child-education-report";

function isCollege(label: string) {
  return /college/i.test(label);
}

/**
 * Child Education Planner off-screen dossier (lumpsum vs SIP fee funding).
 */
export function ChildEducationDossier({
  id = CHILD_EDUCATION_REPORT_ID,
  data,
}: ChildEducationDossierProps) {
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const childLabel = data.childName.trim() || "the child";
  const future = data.schedule.filter((row) => row.age > data.childAge);
  const firstWithdrawal = future.find((row) => row.withdrawal > 0);
  const firstCollege = future.find((row) => isCollege(row.classLabel) && row.cost > 0);
  const shortfallRows = future.filter((row) => row.sipBalance < -0.5);
  const hasShortfall = shortfallRows.length > 0 || data.sip.remaining < -0.5;

  const activeRows = data.schedule.filter(
    (row) =>
      row.age > data.childAge &&
      (row.cost > 0 || row.withdrawal > 0 || row.sipCorpus > 0),
  );
  const truncated = activeRows.length > 18;
  const shownRows = truncated
    ? [...activeRows.slice(0, 9), ...activeRows.slice(-9)]
    : activeRows;
  const midOmit = truncated ? Math.max(0, activeRows.length - 18) : 0;

  const compareRows =
    data.compare.length > 0
      ? data.compare
      : [
          {
            category: "Invested",
            lumpsum: data.lumpsum.invested,
            sip: data.sip.invested,
          },
          {
            category: "Tax",
            lumpsum: data.lumpsum.tax,
            sip: data.sip.tax,
          },
          {
            category: "Peak corpus",
            lumpsum: data.lumpsum.peakCorpus,
            sip: data.sip.peakCorpus,
          },
          {
            category: "Remaining",
            lumpsum: data.lumpsum.remaining,
            sip: data.sip.remaining,
          },
        ];

  const playbook = getReportPlaybook("child-education").map((pillar) =>
    pillar.id === "01"
      ? {
          ...pillar,
          description: `Re-price fees every 12 to 18 months. Today the plan needs ${formatINRCurrency(data.lumpsum.lumpsum)} lumpsum or ${formatINRCurrency(data.sip.monthlySip)}/mo SIP for ${data.sipYears} years to cover ${childLabel}'s costs through age ${data.lastFeeAge}.`,
        }
      : pillar.id === "02"
        ? {
            ...pillar,
            description: `Align withdrawals to the fee calendar (first draw ${
              firstWithdrawal
                ? `at age ${firstWithdrawal.age}, ${firstWithdrawal.classLabel}`
                : `from age ${data.childAge + 1}`
            }${
              firstCollege ? `, college from age ${firstCollege.age}` : ""
            }) rather than a single end-year redemption.`,
          }
        : {
            ...pillar,
            description: firstCollege
              ? `From 24 to 36 months before college at age ${firstCollege.age}, shift a rising share into debt or hybrid so the ${formatINRCurrency(data.totalWithdrawal)} withdrawal path is protected near need.`
              : `From 24 to 36 months before the first major fee, shift a rising share into debt or hybrid to protect purchasing power at need.`,
          },
  );

  return (
    <ExecutiveDossierSheet
      id={id}
      title="Child Education Funding Plan"
      subtitle={`Fee trajectory for ${childLabel}`}
      compact
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        {
          label: "Child",
          value: `${childLabel} · ${data.childAge} yrs`,
        },
        {
          label: "Horizon",
          value: `Age ${data.childAge} to ${data.lastFeeAge}`,
        },
        {
          label: "Monthly SIP",
          value: formatINRCurrency(data.sip.monthlySip),
          emphasize: "emerald",
        },
        {
          label: "Status",
          value: hasShortfall ? "Action needed" : "Funded path",
          emphasize: hasShortfall ? undefined : "status",
        },
      ]}
    >
      <section className="grid grid-cols-2 gap-3" data-pdf-keep-together>
        <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Fund today
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-slate-100">
            Lumpsum required today
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-white">
              {formatINRCurrency(data.lumpsum.lumpsum)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-400">Peak corpus</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.lumpsum.peakCorpus)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Tax drag</span>
              <span className="font-semibold tabular-nums text-rose-300">
                {formatINRCurrency(data.lumpsum.tax)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Invested</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.lumpsum.invested)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Remaining</span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatINRCurrency(data.lumpsum.remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Invest monthly
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-emerald-950">
            Monthly SIP required
          </h3>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-950">
              {formatINRCurrency(data.sip.monthlySip)}
            </span>
            <span className="text-xs font-semibold text-emerald-800">/mo</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2 text-[11px]">
            <div>
              <span className="block text-[10px] text-emerald-800">SIP invested</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.sip.invested)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Peak corpus</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {formatINRCurrency(data.sip.peakCorpus)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Horizon</span>
              <span className="font-semibold tabular-nums text-emerald-950">
                {data.sipYears} yrs
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-800">Remaining</span>
              <span
                className={`font-semibold tabular-nums ${
                  data.sip.remaining < -0.5 ? "text-rose-700" : "text-emerald-950"
                }`}
              >
                {formatINRCurrency(data.sip.remaining)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {hasShortfall ? (
        <section className="mt-1" data-pdf-keep-together>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-relaxed text-rose-900">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Funding shortfall
            </span>
            SIP balance turns negative in{" "}
            {shortfallRows.length > 0
              ? shortfallRows
                  .slice(0, 3)
                  .map((row) => `${row.classLabel} (age ${row.age})`)
                  .join(", ")
              : `the final fee year (age ${data.lastFeeAge})`}
            . Raise the monthly SIP or front-load a lumpsum top-up.
          </div>
        </section>
      ) : null}

      <section className="space-y-2" data-purpose="assumptions-grid" data-pdf-keep-together>
        <ExecutiveSectionHeading title="Assumptions" />
        <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Param label="Parent age" value={`${data.age} yrs`} />
          <Param label="Child age" value={`${data.childAge} yrs`} />
          <Param
            label="Return"
            value={formatPercent(data.returnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="Tax on gains" value={formatPercent(data.taxPct)} />
          <Param label="Last fee age" value={String(data.lastFeeAge)} />
          <Param label="SIP years" value={String(data.sipYears)} />
          <Param label="Edu. cost total" value={formatINRCurrency(data.totalCost)} />
          <Param label="Cap. gains tax" value={formatINRCurrency(data.totalTax)} />
          <Param
            label="Total withdrawal"
            value={formatINRCurrency(data.totalWithdrawal)}
          />
          <Param
            label="College start"
            value={firstCollege ? `Age ${firstCollege.age}` : "None"}
          />
          <Param
            label="First draw"
            value={
              firstWithdrawal
                ? `Age ${firstWithdrawal.age}`
                : `Age ${data.childAge + 1}`
            }
          />
          <Param
            label="Status"
            value={hasShortfall ? "Shortfall" : "On track"}
            valueClass={hasShortfall ? "text-rose-700" : "text-emerald-700"}
          />
        </div>
      </section>

      <section
        className="space-y-3"
        data-purpose="funding-snapshot"
        data-pdf-keep-together
      >
        <ExecutiveSectionHeading
          title="Outcome Snapshot"
          hint="Total fee burden vs remaining corpus under each path"
        />
        <div className="grid grid-cols-3 gap-3">
          <SnapshotCard
            label="Total withdrawal"
            value={formatINRCurrency(data.totalWithdrawal)}
            hint={`Cost ${formatINRCurrency(data.totalCost)} + tax`}
            tone="slate"
          />
          <SnapshotCard
            label="Lumpsum remaining"
            value={formatINRCurrency(data.lumpsum.remaining)}
            hint="After last fee year"
            tone={data.lumpsum.remaining < -0.5 ? "rose" : "emerald"}
          />
          <SnapshotCard
            label="SIP remaining"
            value={formatINRCurrency(data.sip.remaining)}
            hint="After last fee year"
            tone={data.sip.remaining < -0.5 ? "rose" : "emerald"}
          />
        </div>
      </section>

      <section className="space-y-2" data-purpose="composition" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Funding Mix"
          hint="Invested vs gain vs tax drag at peak corpus"
        />
        <div className="grid grid-cols-2 gap-3">
          <ReportCompositionDonut
            title="Lumpsum path"
            invested={data.lumpsum.invested}
            gain={Math.max(0, data.lumpsum.peakCorpus - data.lumpsum.invested)}
            tax={data.lumpsum.tax}
            centerLabel="Peak"
            centerValue={data.lumpsum.peakCorpus}
            taxLabel="Cap. gains tax"
            compact
            layout="stacked"
          />
          <ReportCompositionDonut
            title="SIP path"
            invested={data.sip.invested}
            gain={Math.max(0, data.sip.peakCorpus - data.sip.invested)}
            tax={data.sip.tax}
            centerLabel="Peak"
            centerValue={data.sip.peakCorpus}
            taxLabel="Cap. gains tax"
            compact
            layout="stacked"
          />
        </div>
      </section>

      <section className="space-y-2" data-pdf-keep-together>
        <ExecutiveSectionHeading
          title="Strategy Comparison"
          hint="Side-by-side lumpsum vs SIP metrics"
        />
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold" scope="col">
                  Metric
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Lumpsum
                </th>
                <th
                  className="bg-slate-800/80 px-3 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  SIP
                </th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row, index) => (
                <tr
                  key={row.category}
                  className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}
                >
                  <td className="px-3 py-2 font-semibold text-slate-900">
                    {row.category}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatINRCurrency(row.lumpsum)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-900">
                    {formatINRCurrency(row.sip)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2" data-purpose="education-schedule" data-pdf-keep-together>
        <div className="flex items-center justify-between gap-2">
          <ExecutiveSectionHeading title="Education Fee Schedule" />
          <span className="text-[11px] font-medium text-slate-400">
            {truncated
              ? `Showing first and last 9 of ${activeRows.length} active years`
              : `${activeRows.length} active years`}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-2.5 py-2 font-bold" scope="col">
                  Age
                </th>
                <th className="px-2.5 py-2 font-semibold" scope="col">
                  Class
                </th>
                <th className="px-2.5 py-2 text-right font-semibold text-slate-300" scope="col">
                  Edu. cost
                </th>
                <th className="px-2.5 py-2 text-right font-semibold text-slate-300" scope="col">
                  Cap. gains
                </th>
                <th className="px-2.5 py-2 text-right font-semibold text-slate-300" scope="col">
                  Withdrawal
                </th>
                <th
                  className="bg-slate-800/80 px-2.5 py-2 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  SIP balance
                </th>
                <th className="px-2.5 py-2 text-right font-semibold text-slate-300" scope="col">
                  LS balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shownRows.flatMap((row, i) => {
                const isCollegeYear = isCollege(row.classLabel) && row.cost > 0;
                const isNeg = row.sipBalance < -0.5;
                const isLastFee = row.age === data.lastFeeAge;
                const nodes = [];
                if (truncated && i === 9 && midOmit > 0) {
                  nodes.push(
                    <tr key="omit" className="bg-slate-50/80">
                      <td
                        colSpan={7}
                        className="px-2.5 py-2 text-center text-[11px] font-medium text-slate-400"
                      >
                        … {midOmit} intervening years omitted …
                      </td>
                    </tr>,
                  );
                }
                nodes.push(
                  <tr
                    key={`${row.age}-${row.classLabel}`}
                    className={
                      isNeg
                        ? "bg-rose-50 font-semibold text-rose-900"
                        : isLastFee
                          ? "border-t-2 border-emerald-500 bg-emerald-100/70 font-bold"
                          : isCollegeYear
                            ? "bg-amber-50/80"
                            : i % 2 === 1
                              ? "bg-slate-50/80"
                              : "bg-white"
                    }
                  >
                    <td className="px-2.5 py-1.5">{row.age}</td>
                    <td className="max-w-[120px] truncate px-2.5 py-1.5 font-medium text-slate-900">
                      {row.classLabel}
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      {formatINRCurrency(row.cost)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      {formatINRCurrency(row.tax)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      {formatINRCurrency(row.withdrawal)}
                    </td>
                    <td
                      className={`px-2.5 py-1.5 text-right ${
                        isNeg
                          ? "text-rose-800"
                          : isLastFee
                            ? "bg-emerald-200/60 font-black text-emerald-950"
                            : "bg-emerald-50/40 font-semibold text-emerald-950"
                      }`}
                    >
                      {formatINRCurrency(row.sipBalance)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      {formatINRCurrency(row.lumpsumBalance)}
                    </td>
                  </tr>,
                );
                return nodes;
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
