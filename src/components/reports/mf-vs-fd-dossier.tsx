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

export type MfVsFdReportData = {
  clientName: string;
  age: number;
  email?: string;
  phone?: string;
  amount: number;
  days: number;
  mfReturnPct: number;
  fdReturnPct: number;
  mfTaxPct: number;
  fdTaxPct: number;
  mf: {
    invested: number;
    gain: number;
    tax: number;
    net: number;
    preTax: number;
    postTax: number;
    annualizedReturn: number;
    returnPerDay: number;
  };
  fd: {
    invested: number;
    gain: number;
    tax: number;
    net: number;
    preTax: number;
    postTax: number;
    annualizedReturn: number;
    returnPerDay: number;
  };
  mfAdvantage: number;
  fdAdvantage: number;
  difference: number;
};

type MfVsFdDossierProps = {
  id?: string;
  data: MfVsFdReportData;
};

export const MF_VS_FD_REPORT_ID = "mf-vs-fd-report";

function periodLabel(days: number) {
  if (days === 7) return "7 Days";
  if (days === 15) return "15 Days";
  if (days === 30) return "30 Days (~1 Mo)";
  if (days === 90) return "90 Days (~3 Mo)";
  if (days === 180) return "180 Days (~6 Mo)";
  if (days === 365) return "365 Days (1 Yr)";
  return `${days} Days`;
}

function VehicleCard({
  eyebrow,
  title,
  accent,
  postTax,
  maturity,
  invested,
  preTax,
  tax,
}: {
  eyebrow: string;
  title: string;
  accent: boolean;
  postTax: number;
  maturity: number;
  invested: number;
  preTax: number;
  tax: number;
}) {
  if (accent) {
    return (
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
        <div className="border-b border-emerald-200/60 pb-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            {eyebrow}
          </span>
          <h3 className="text-sm font-bold text-emerald-950">{title}</h3>
        </div>
        <div className="flex items-baseline space-x-2 py-4">
          <span className="text-3xl font-black tracking-tight tabular-nums text-emerald-950 sm:text-4xl">
            {formatINRCurrency(postTax)}
          </span>
          <span className="text-xs font-semibold text-emerald-800">post-tax return</span>
        </div>
        <div className="flex gap-2 border-t border-emerald-200/60 pt-3 text-[11px]">
          <div className="flex-1">
            <span className="block text-[10px] text-emerald-800">Final Maturity</span>
            <span className="font-bold tabular-nums text-emerald-950">
              {formatINRCurrency(maturity)}
            </span>
          </div>
          <div className="flex-1">
            <span className="block text-[10px] text-emerald-800">Principal</span>
            <span className="font-medium tabular-nums text-slate-700">
              {formatINRCurrency(invested)}
            </span>
          </div>
          <div className="flex-1">
            <span className="block text-[10px] text-emerald-800">Pre-Tax / Tax</span>
            <span className="font-medium tabular-nums text-emerald-700">
              +{formatINRCurrency(preTax)} / -{formatINRCurrency(tax)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
      <div className="border-b border-slate-800 pb-3">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {eyebrow}
        </span>
        <h3 className="text-sm font-bold text-slate-100">{title}</h3>
      </div>
      <div className="flex items-baseline space-x-2 py-4">
        <span className="text-3xl font-black tracking-tight tabular-nums text-white sm:text-4xl">
          {formatINRCurrency(postTax)}
        </span>
        <span className="text-xs font-medium text-slate-400">post-tax return</span>
      </div>
      <div className="flex gap-2 border-t border-slate-800 pt-3 text-[11px]">
        <div className="flex-1">
          <span className="block text-[10px] text-slate-400">Final Maturity</span>
          <span className="font-bold tabular-nums text-emerald-400">
            {formatINRCurrency(maturity)}
          </span>
        </div>
        <div className="flex-1">
          <span className="block text-[10px] text-slate-400">Principal</span>
          <span className="font-medium tabular-nums text-slate-200">
            {formatINRCurrency(invested)}
          </span>
        </div>
        <div className="flex-1">
          <span className="block text-[10px] text-slate-400">Pre-Tax / Tax</span>
          <span className="font-medium tabular-nums text-emerald-300">
            +{formatINRCurrency(preTax)} / -{formatINRCurrency(tax)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * MF vs FD Comparison off-screen dossier for direct PDF download.
 * Visual system matches Goal SIP (Standard vs Step-Up) executive report.
 */
export function MfVsFdDossier({ id = MF_VS_FD_REPORT_ID, data }: MfVsFdDossierProps) {
  const mfWins = data.mfAdvantage > data.fdAdvantage;
  const fdWins = data.fdAdvantage > data.mfAdvantage;
  const tied = !mfWins && !fdWins;
  const winnerLabel = mfWins ? "Mutual Fund" : fdWins ? "Fixed Deposit" : "Neither";
  const advantage = mfWins ? data.mfAdvantage : data.fdAdvantage;
  const base = mfWins ? data.fd.postTax : data.mf.postTax;
  const relativePct = base > 0 ? (advantage / base) * 100 : 0;
  const mfAnnualPostTax = data.mfReturnPct * (1 - data.mfTaxPct / 100);
  const fdAnnualPostTax = data.fdReturnPct * (1 - data.fdTaxPct / 100);
  const mfPeriodYield = data.amount > 0 ? (data.mf.postTax / data.amount) * 100 : 0;
  const fdPeriodYield = data.amount > 0 ? (data.fd.postTax / data.amount) * 100 : 0;

  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };

  const playbook = getReportPlaybook("mf-vs-fd").map((p) =>
    p.id === "01"
      ? {
          ...p,
          title: tied
            ? "Confirm Tax Treatment Parity"
            : `Deploy via ${mfWins ? "MF" : "FD"} on Post-Tax Merit`,
          description: tied
            ? `Under the stated slab rates, MF and FD land at the same post-tax outcome for this ${periodLabel(data.days).toLowerCase()} window. Decide on liquidity and certainty, not yield.`
            : `${winnerLabel} delivers ${formatINRCurrency(advantage)} more post-tax return (${formatPercent(relativePct, 1)} relative edge) after applying ${mfWins ? formatPercent(data.mfTaxPct, 0) : formatPercent(data.fdTaxPct, 0)} tax. Use this as the deployment default unless liquidity constraints reverse the call.`,
        }
      : p.id === "02"
        ? {
            ...p,
            description: `Holding window is ${periodLabel(data.days)}. Reserve FD for known cash needs where premature-exit penalties matter; keep debt / arbitrage MF where duration flexibility outweighs mark-to-market noise.`,
          }
        : p,
  );

  const breakdownRows: {
    label: string;
    mf: string;
    fd: string;
    highlight?: boolean;
    goal?: boolean;
  }[] = [
    {
      label: "Annualized Return",
      mf: formatINRCurrency(data.mf.annualizedReturn),
      fd: formatINRCurrency(data.fd.annualizedReturn),
    },
    {
      label: "Return Per Day",
      mf: formatINRCurrency(data.mf.returnPerDay),
      fd: formatINRCurrency(data.fd.returnPerDay),
    },
    {
      label: "Expected Pre-Tax Return",
      mf: formatINRCurrency(data.mf.preTax),
      fd: formatINRCurrency(data.fd.preTax),
    },
    {
      label: "Tax on Profit",
      mf: formatINRCurrency(data.mf.tax),
      fd: formatINRCurrency(data.fd.tax),
    },
    {
      label: "Post-Tax Return",
      mf: formatINRCurrency(data.mf.postTax),
      fd: formatINRCurrency(data.fd.postTax),
      highlight: true,
    },
    {
      label: "Difference in Return",
      mf: formatINRCurrency(data.mfAdvantage),
      fd: formatINRCurrency(data.fdAdvantage),
    },
    {
      label: "Final Maturity Amount",
      mf: formatINRCurrency(data.mf.net),
      fd: formatINRCurrency(data.fd.net),
      goal: true,
    },
  ];

  const statusValue = tied ? "Tied Outcome" : `${mfWins ? "MF" : "FD"} Leads`;

  return (
    <ExecutiveDossierSheet
      id={id}
      title="MF vs FD Comparison"
      subtitle="Institutional Wealth Advisory Desk • Short-Horizon Post-Tax Vehicle Selection"
      contact={contact}
      disclaimer="This report is for illustrative planning only. Assumed interest and tax rates are inputs, not guarantees. Fixed deposits may levy premature withdrawal penalties. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing."
      meta={[
        { label: "Client Name", value: data.clientName || "Client" },
        {
          label: "Holding Window",
          value: `${periodLabel(data.days)} · Age ${data.age}`,
        },
        {
          label: "Principal Deployed",
          value: formatINRCurrency(data.amount),
          emphasize: "emerald",
        },
        {
          label: "Advisory Status",
          value: statusValue,
          emphasize: "status",
        },
      ]}
    >
      <section className="space-y-4" data-purpose="primary-milestones">
        <ExecutiveSectionHeading
          variant="square"
          title="Primary Post-Tax Return Milestones"
          hint={`Modeled over ${periodLabel(data.days).toLowerCase()} using a 365-day count basis`}
        />

        <div className="flex gap-4">
          <VehicleCard
            eyebrow="Market-Linked Debt / Arbitrage Path"
            title={`Mutual Fund (${formatPercent(data.mfReturnPct, 0)} Gross)`}
            accent={mfWins}
            postTax={data.mf.postTax}
            maturity={data.mf.net}
            invested={data.mf.invested}
            preTax={data.mf.preTax}
            tax={data.mf.tax}
          />
          <VehicleCard
            eyebrow="Fixed-Tenure Certainty Path"
            title={`Fixed Deposit (${formatPercent(data.fdReturnPct, 0)} Gross)`}
            accent={fdWins || tied}
            postTax={data.fd.postTax}
            maturity={data.fd.net}
            invested={data.fd.invested}
            preTax={data.fd.preTax}
            tax={data.fd.tax}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              {tied ? (
                <>
                  <strong>Key Advisory Insight:</strong> Both vehicles deliver the same post-tax
                  return for this horizon. Choose FD when the cash date is fixed; choose MF when
                  exit flexibility outweighs rate certainty.
                </>
              ) : (
                <>
                  <strong>Key Advisory Insight:</strong> {winnerLabel} earns{" "}
                  <strong>
                    {formatINRCurrency(advantage)} ({formatPercent(relativePct, 1)} more)
                  </strong>{" "}
                  post-tax than the alternate for this {periodLabel(data.days).toLowerCase()}{" "}
                  deployment. Ranking is driven by tax drag, not headline coupon alone.
                </>
              )}
            </span>
          </div>
          <span className="whitespace-nowrap pl-4 text-[11px] font-semibold text-emerald-700">
            Edge: {tied ? "Rs. 0" : formatINRCurrency(advantage)}
          </span>
        </div>
      </section>

      <section className="space-y-3" data-purpose="assumptions-grid">
        <ExecutiveSectionHeading title="Actuarial & Financial Parameters Baseline" />
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4 text-center">
          <Param label="Client Age" value={`${data.age} Yrs`} />
          <Param label="Principal" value={formatINRCurrency(data.amount)} />
          <Param label="Period" value={periodLabel(data.days)} />
          <Param
            label="MF Interest"
            value={formatPercent(data.mfReturnPct)}
            valueClass="text-emerald-700"
          />
          <Param label="FD Interest" value={formatPercent(data.fdReturnPct)} />
          <Param label="MF Tax Rate" value={formatPercent(data.mfTaxPct)} />
          <Param label="FD Tax Rate" value={formatPercent(data.fdTaxPct)} />
          <div className="flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Day Count
            </span>
            <span className="mt-1 inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              365-DAY
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4" data-purpose="corpus-visual-analytics">
        <ExecutiveSectionHeading
          title="Maturity Composition & Tax Drag Breakdown"
          hint="Invested · Pre-tax Gain · Tax · Net Maturity after tax"
        />
        <div className="flex gap-4">
          <div className="flex-1">
            <ReportCompositionDonut
              title="Mutual Fund Architecture"
              centerLabel="Maturity"
              centerValue={data.mf.net}
              invested={data.mf.invested}
              gain={data.mf.gain}
              tax={data.mf.tax}
              accent={mfWins}
              multiplierDigits={4}
            />
          </div>
          <div className="flex-1">
            <ReportCompositionDonut
              title="Fixed Deposit Architecture"
              centerLabel="Maturity"
              centerValue={data.fd.net}
              invested={data.fd.invested}
              gain={data.fd.gain}
              tax={data.fd.tax}
              accent={fdWins || tied}
              multiplierDigits={4}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3" data-purpose="roi-insights">
        <ExecutiveSectionHeading title="Post-Tax ROI & Relative Advantage" />
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Better Option
            </span>
            <span className="mt-1.5 block text-sm font-bold text-slate-900">
              {tied
                ? "Tied on post-tax return"
                : `${winnerLabel} +${formatINRCurrency(advantage)}`}
            </span>
            <span className="mt-1 block text-[11px] text-slate-500">
              {tied
                ? "Decide on liquidity vs certainty"
                : `${formatPercent(relativePct, 1)} relative edge`}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              MF Post-Tax ROI
            </span>
            <span className="mt-1.5 block text-sm font-bold tabular-nums text-emerald-800">
              {formatPercent(mfAnnualPostTax, 2)}
            </span>
            <span className="mt-1 block text-[11px] text-slate-500">
              Annualized · period {formatPercent(mfPeriodYield, 4)} of principal
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              FD Post-Tax ROI
            </span>
            <span className="mt-1.5 block text-sm font-bold tabular-nums text-slate-900">
              {formatPercent(fdAnnualPostTax, 2)}
            </span>
            <span className="mt-1 block text-[11px] text-slate-500">
              Annualized · period {formatPercent(fdPeriodYield, 4)} of principal
            </span>
          </div>
        </div>
      </section>

      {/* Keep together so the rose panel is not sliced across PDF pages */}
      <section
        className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/30 p-4"
        data-purpose="investment-notes"
        data-pdf-keep-together
      >
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
              !
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
              Important Investment Notes & Structural Friction
            </h3>
          </div>
          <span className="self-start rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 sm:self-auto">
            Liquidity Risk Check
          </span>
        </div>
        <div className="flex gap-3 pt-1">
          <div className="flex-1 rounded-lg border border-rose-100 bg-white p-3.5 shadow-sm">
            <div className="text-xs font-bold text-rose-900">FD Premature Exit</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Fixed Deposits may charge a premature withdrawal penalty, even for partial
              withdrawals. Modeled maturity assumes the deposit is held to the stated tenure.
            </p>
          </div>
          <div className="flex-1 rounded-lg border border-rose-100 bg-white p-3.5 shadow-sm">
            <div className="text-xs font-bold text-rose-900">MF Duration Flexibility</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Debt / Arbitrage Mutual Funds provide flexibility in investment duration, unlike FDs
              where tenure is typically fixed at inception.
            </p>
          </div>
          <div className="flex-1 rounded-lg border border-rose-200 bg-rose-50/20 p-3.5 shadow-sm">
            <div className="text-xs font-bold text-rose-900">Tax Ranking Risk</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Gross coupons of {formatPercent(data.mfReturnPct, 0)} MF vs{" "}
              {formatPercent(data.fdReturnPct, 0)} FD can reverse after{" "}
              {formatPercent(data.mfTaxPct, 0)} / {formatPercent(data.fdTaxPct, 0)} tax. Always
              compare post-tax legs before booking.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-3" data-purpose="return-breakdown" data-pdf-keep-together>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <ExecutiveSectionHeading title="Post-Tax Return Breakdown Schedule" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
              MF: {formatPercent(data.mfReturnPct)} @ {formatPercent(data.mfTaxPct)} tax
            </span>
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              FD: {formatPercent(data.fdReturnPct)} @ {formatPercent(data.fdTaxPct)} tax
            </span>
            <span className="text-slate-400">• {periodLabel(data.days)}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-2.5 font-bold" scope="col">
                  Particulars
                </th>
                <th
                  className="bg-slate-800/80 px-4 py-2.5 text-right font-semibold text-emerald-300"
                  scope="col"
                >
                  Mutual Funds
                </th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-200" scope="col">
                  Fixed Deposit
                </th>
                <th className="px-4 py-2.5 text-right font-semibold" scope="col">
                  Reading
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {breakdownRows.map((row) => {
                if (row.goal) {
                  return (
                    <tr
                      key={row.label}
                      className="border-t-2 border-emerald-500 bg-emerald-100/70 font-bold"
                    >
                      <td className="px-4 py-3 text-sm font-black text-emerald-950">
                        {row.label}
                      </td>
                      <td className="bg-emerald-200/60 px-4 py-3 text-right text-sm font-black text-emerald-950">
                        {row.mf}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-black text-emerald-950">
                        {row.fd}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-black text-emerald-800">
                        <span className="inline-flex items-center gap-1">
                          <CheckIcon />
                          Horizon Close
                        </span>
                      </td>
                    </tr>
                  );
                }
                if (row.highlight) {
                  return (
                    <tr key={row.label} className="bg-amber-50/40">
                      <td className="px-4 py-2.5 font-black text-amber-900">{row.label}</td>
                      <td className="bg-emerald-50/40 px-4 py-2.5 text-right font-black text-emerald-950">
                        {row.mf}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-amber-950">{row.fd}</td>
                      <td className="px-4 py-2.5 text-right text-[11px] font-bold text-amber-800">
                        Decision metric
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={row.label}>
                    <td className="px-4 py-2 font-medium text-slate-900">{row.label}</td>
                    <td className="bg-emerald-50/40 px-4 py-2 text-right font-semibold text-emerald-950">
                      {row.mf}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900">{row.fd}</td>
                    <td className="px-4 py-2 text-right text-[11px] text-slate-400">-</td>
                  </tr>
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
    <div className="flex-1 border-r border-slate-100 pr-2 last:border-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className={`mt-1 block text-sm font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      />
    </svg>
  );
}
