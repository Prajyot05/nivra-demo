"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";
import {
  DUMMY_REPORT_CONTACT,
  type ExecutiveContact,
} from "@/components/reports/executive-dossier";
import { type MfVsFdReportData } from "@/components/reports/mf-vs-fd-dossier";
import { getReportPlaybook } from "@/lib/report-playbooks";
import {
  AdvisoryAssumptions,
  AdvisoryComposition,
  AdvisoryDossierSheet,
  AdvisoryHero,
  AdvisoryNote,
  AdvisoryReading,
  AdvisoryPlaybook,
  AdvisorySection,
  AdvisoryStatRow,
  AdvisoryTable,
} from "@/components/v2/reports/advisory-dossier";

export const V2_MF_VS_FD_REPORT_ID = "v2-mf-vs-fd-report";

type Props = {
  id?: string;
  data: MfVsFdReportData;
};

function periodLabel(days: number) {
  if (days === 7) return "7 Days";
  if (days === 15) return "15 Days";
  if (days === 30) return "30 Days (~1 Mo)";
  if (days === 90) return "90 Days (~3 Mo)";
  if (days === 180) return "180 Days (~6 Mo)";
  if (days === 365) return "365 Days (1 Yr)";
  return `${days} Days`;
}

/**
 * V2-only MF vs FD PDF dossier. Classic /mf-vs-fd keeps MfVsFdDossier.
 */
export function V2MfVsFdAdvisoryDossier({
  id = V2_MF_VS_FD_REPORT_ID,
  data,
}: Props) {
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
            : `Choose ${mfWins ? "MF" : "FD"} on Post-Tax Merit`,
          description: tied
            ? `Under the stated slab rates, MF and FD land at the same post-tax outcome for this ${periodLabel(data.days).toLowerCase()} window. Decide on liquidity and certainty, not yield.`
            : `${winnerLabel} delivers ${formatINRCurrency(advantage)} more post-tax return (${formatPercent(relativePct, 1)} relative edge) after applying ${mfWins ? formatPercent(data.mfTaxPct, 0) : formatPercent(data.fdTaxPct, 0)} tax. Use this as the default unless liquidity constraints reverse the call.`,
        }
      : p.id === "02"
        ? {
            ...p,
            description: `Holding window is ${periodLabel(data.days)}. Reserve FD for known cash needs where premature-exit penalties matter; keep debt / arbitrage MF where duration flexibility outweighs mark-to-market noise.`,
          }
        : p,
  );

  const breakdownRows = [
    {
      label: "Annualized return",
      mf: formatINRCurrency(data.mf.annualizedReturn),
      fd: formatINRCurrency(data.fd.annualizedReturn),
      tone: "default" as const,
      reading: "-",
    },
    {
      label: "Return per day",
      mf: formatINRCurrency(data.mf.returnPerDay),
      fd: formatINRCurrency(data.fd.returnPerDay),
      tone: "default" as const,
      reading: "-",
    },
    {
      label: "Expected pre-tax return",
      mf: formatINRCurrency(data.mf.preTax),
      fd: formatINRCurrency(data.fd.preTax),
      tone: "default" as const,
      reading: "-",
    },
    {
      label: "Tax on profit",
      mf: formatINRCurrency(data.mf.tax),
      fd: formatINRCurrency(data.fd.tax),
      tone: "default" as const,
      reading: "-",
    },
    {
      label: "Post-tax return",
      mf: formatINRCurrency(data.mf.postTax),
      fd: formatINRCurrency(data.fd.postTax),
      tone: "highlight" as const,
      reading: "Decision metric",
    },
    {
      label: "Difference in return",
      mf: formatINRCurrency(data.mfAdvantage),
      fd: formatINRCurrency(data.fdAdvantage),
      tone: "default" as const,
      reading: "-",
    },
    {
      label: "Final maturity amount",
      mf: formatINRCurrency(data.mf.net),
      fd: formatINRCurrency(data.fd.net),
      tone: "final" as const,
      reading: "Final year",
    },
  ];

  const outcomeValue = tied
    ? "Tied on post-tax return"
    : `${mfWins ? "MF" : "FD"} +${formatINRCurrency(advantage)}`;

  return (
    <AdvisoryDossierSheet
      id={id}
      title="MF vs FD Comparison Dossier"
      subtitle={`${data.clientName || "Client"} · Age ${data.age}`}
      contact={contact}
      disclaimer="This report is for illustrative planning only. Assumed interest and tax rates are inputs, not guarantees. Fixed deposits may levy premature withdrawal penalties. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing."
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        {
          label: "Holding window",
          value: periodLabel(data.days),
        },
        {
          label: "Principal",
          value: formatINRCurrency(data.amount),
          accent: true,
        },
        {
          label: "Post-tax outcome",
          value: outcomeValue,
          accent: true,
        },
      ]}
    >
      <AdvisoryHero
        left={{
          label: "MF post-tax",
          value: formatINRCurrency(data.mf.postTax),
          hint: `${formatPercent(data.mfReturnPct)} gross · ${formatPercent(data.mfTaxPct)} tax`,
        }}
        right={{
          label: "FD post-tax",
          value: formatINRCurrency(data.fd.postTax),
          hint: `${formatPercent(data.fdReturnPct)} gross · ${formatPercent(data.fdTaxPct)} tax`,
        }}
      />
      <AdvisoryStatRow
        items={[
          { label: "Principal", value: formatINRCurrency(data.amount) },
          { label: "MF net", value: formatINRCurrency(data.mf.net) },
          { label: "FD net", value: formatINRCurrency(data.fd.net) },
          {
            label: "Advantage",
            value: tied ? "Rs. 0" : formatINRCurrency(advantage),
          },
        ]}
      />
      <AdvisoryReading
        items={[
          {
            title: tied ? "Post-tax result is tied" : `${winnerLabel} leads after tax`,
            body: tied
              ? `Both vehicles deliver the same post-tax return over ${periodLabel(data.days).toLowerCase()}. Choose the fixed deposit when the cash date is fixed. Choose the mutual fund when the option to exit early matters more than a locked rate.`
              : `${winnerLabel} earns ${formatINRCurrency(advantage)} more after tax (${formatPercent(relativePct, 1)} relative to the other leg) over ${periodLabel(data.days).toLowerCase()}. The ranking comes from tax drag, not from the headline coupon.`,
          },
          {
            title: "Tax changes the ranking",
            body: `Mutual fund gross is ${formatPercent(data.mfReturnPct)} with tax at ${formatPercent(data.mfTaxPct)}, so post-tax ROI is ${formatPercent(mfAnnualPostTax, 2)} annualised. Fixed deposit gross is ${formatPercent(data.fdReturnPct)} with tax at ${formatPercent(data.fdTaxPct)}, so post-tax ROI is ${formatPercent(fdAnnualPostTax, 2)}. Pre-tax coupons of those two rates can reverse once tax is applied.`,
          },
          {
            title: "Liquidity and exit",
            body: `The model assumes the deposit is held for the full ${periodLabel(data.days).toLowerCase()}. A fixed deposit can charge a penalty on early exit, including a partial withdrawal. A debt or arbitrage fund can be exited without a fixed maturity, but the value can move with the market before tax.`,
          },
        ]}
      />

      <AdvisorySection title="Assumptions" keepTogether>
        <AdvisoryAssumptions
          items={[
            { label: "Client age", value: `${data.age} yrs` },
            { label: "Principal", value: formatINRCurrency(data.amount) },
            { label: "Period", value: periodLabel(data.days) },
            {
              label: "MF interest",
              value: formatPercent(data.mfReturnPct),
              accent: true,
            },
            { label: "FD interest", value: formatPercent(data.fdReturnPct) },
            { label: "MF tax rate", value: formatPercent(data.mfTaxPct) },
            { label: "FD tax rate", value: formatPercent(data.fdTaxPct) },
            { label: "Day count", value: "365-day" },
          ]}
        />
      </AdvisorySection>

      <AdvisorySection
        title="Maturity composition"
        hint="Invested · Pre-tax gain · Tax"
        keepTogether
      >
        <div className="grid grid-cols-2 gap-10">
          <AdvisoryComposition
            title="Mutual Fund mix"
            centerLabel="Maturity"
            centerValue={data.mf.net}
            invested={data.mf.invested}
            gain={data.mf.gain}
            tax={data.mf.tax}
          />
          <AdvisoryComposition
            title="Fixed Deposit mix"
            centerLabel="Maturity"
            centerValue={data.fd.net}
            invested={data.fd.invested}
            gain={data.fd.gain}
            tax={data.fd.tax}
          />
        </div>
      </AdvisorySection>

      <AdvisorySection title="Post-tax ROI and relative advantage" keepTogether>
        <AdvisoryTable
          columns={[
            { key: "label", header: "Reading", align: "left" },
            { key: "value", header: "Result", align: "right" },
            { key: "note", header: "Note", align: "left" },
          ]}
          rows={[
            {
              label: "Better option",
              value: tied
                ? "Tied on post-tax return"
                : `${winnerLabel} +${formatINRCurrency(advantage)}`,
              note: tied
                ? "Decide on liquidity vs certainty"
                : `${formatPercent(relativePct, 1)} relative edge`,
            },
            {
              label: "MF post-tax ROI",
              value: formatPercent(mfAnnualPostTax, 2),
              note: `Annualized · period ${formatPercent(mfPeriodYield, 4)} of principal`,
            },
            {
              label: "FD post-tax ROI",
              value: formatPercent(fdAnnualPostTax, 2),
              note: `Annualized · period ${formatPercent(fdPeriodYield, 4)} of principal`,
            },
          ]}
        />
      </AdvisorySection>

      <AdvisoryNote title="Important investment notes" tone="friction">
        <div className="mt-1 grid grid-cols-3 gap-5">
          <div>
            <p className="mb-1 text-[12px] font-semibold" style={{ color: "#9f1239" }}>
              FD premature exit
            </p>
            <p>
              Fixed Deposits may charge a premature withdrawal penalty, even for partial
              withdrawals. Modeled maturity assumes the deposit is held to the stated tenure.
            </p>
          </div>
          <div>
            <p className="mb-1 text-[12px] font-semibold" style={{ color: "#9f1239" }}>
              MF duration flexibility
            </p>
            <p>
              Debt / Arbitrage Mutual Funds provide flexibility in investment duration, unlike FDs
              where tenure is typically fixed at inception.
            </p>
          </div>
          <div>
            <p className="mb-1 text-[12px] font-semibold" style={{ color: "#9f1239" }}>
              Tax ranking risk
            </p>
            <p>
              Gross coupons of {formatPercent(data.mfReturnPct, 0)} MF vs{" "}
              {formatPercent(data.fdReturnPct, 0)} FD can reverse after{" "}
              {formatPercent(data.mfTaxPct, 0)} / {formatPercent(data.fdTaxPct, 0)} tax. Always
              compare post-tax legs before booking.
            </p>
          </div>
        </div>
      </AdvisoryNote>

      <AdvisorySection title="Post-tax return breakdown">
        <AdvisoryTable
          caption={
            <span>
              MF {formatPercent(data.mfReturnPct)} @ {formatPercent(data.mfTaxPct)} tax · FD{" "}
              {formatPercent(data.fdReturnPct)} @ {formatPercent(data.fdTaxPct)} tax ·{" "}
              {periodLabel(data.days)}
            </span>
          }
          columns={[
            { key: "label", header: "Particulars", align: "left" },
            { key: "mf", header: "Mutual Funds", align: "right" },
            { key: "fd", header: "Fixed Deposit", align: "right" },
            { key: "reading", header: "Reading", align: "right" },
          ]}
          rows={breakdownRows.map((row) => ({
            _tone: row.tone,
            label: row.label,
            mf: row.mf,
            fd: row.fd,
            reading: row.reading,
          }))}
        />
      </AdvisorySection>

      <AdvisoryPlaybook pillars={playbook} />
    </AdvisoryDossierSheet>
  );
}
