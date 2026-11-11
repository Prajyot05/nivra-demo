"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";
import {
  DUMMY_REPORT_CONTACT,
  type ExecutiveContact,
} from "@/components/reports/executive-dossier";
import {
  type SipCalculatorReportData,
} from "@/components/reports/sip-calculator-dossier";
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

export const V2_SIP_CALCULATOR_REPORT_ID = "v2-sip-calculator-report";

type Props = {
  id?: string;
  data: SipCalculatorReportData;
};

/**
 * V2-only SIP PDF dossier. Classic /growth continues to use SipCalculatorDossier.
 */
export function V2SipAdvisoryDossier({
  id = V2_SIP_CALCULATOR_REPORT_ID,
  data,
}: Props) {
  const endAge = data.age + data.investYears;
  const contact: ExecutiveContact = {
    email: data.email || DUMMY_REPORT_CONTACT.email,
    phone: data.phone || DUMMY_REPORT_CONTACT.phone,
  };
  const hasDelay =
    data.delayMonths > 0 && data.costOfDelay != null && data.delayedMaturity != null;
  const inflGain =
    data.inflationAdjustedGain ?? data.inflationAdjusted - data.totalInvested;

  const playbook = getReportPlaybook("investment-growth").map((p) =>
    p.id === "01"
      ? {
          ...p,
          title: "Automate the Monthly SIP",
          description: `Lock ${formatINRCurrency(data.monthlyInvestment)}/mo on ECS / OTM for ${data.sipYears} contribution years. Missed months permanently reduce the ${data.investYears}-year terminal corpus under the same return path.`,
        }
      : p.id === "02"
        ? {
            ...p,
            title: "Inflation Reality Check",
            description: `Headline maturity of ${formatINRCurrency(data.maturity)} is ${formatINRCurrency(data.inflationAdjusted)} in today rupees at ${formatPercent(data.inflationPct)} inflation. Frame client conversations on purchasing power, not nominal corpus alone.`,
          }
        : p.id === "03"
          ? {
              ...p,
              title: `Glidepath Before Year ${data.investYears}`,
              description: `Begin shifting equity exposure toward short-duration debt or hybrids via STP in the final 2 to 3 years so the planned redemption is not hostage to a late-cycle drawdown.`,
            }
          : p,
  );

  const mid = Math.ceil(data.investYears / 2);

  return (
    <AdvisoryDossierSheet
      id={id}
      title="SIP Calculator Dossier"
      subtitle={`${data.clientName || "Client"} · Age ${data.age}`}
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        {
          label: "Timeline",
          value: `Age ${data.age} to ${endAge} (${data.investYears} yrs)`,
        },
        {
          label: "Monthly SIP",
          value: formatINRCurrency(data.monthlyInvestment),
          accent: true,
        },
        {
          label: "Return CAGR",
          value: formatPercent(data.returnPct),
          accent: true,
        },
      ]}
    >
      <AdvisoryHero
        left={{
          label: "Nominal maturity",
          value: formatINRCurrency(data.maturity),
          hint: `${formatPercent(data.returnPct)} CAGR over ${data.investYears} years`,
        }}
        right={{
          label: "Inflation-adjusted",
          value: formatINRCurrency(data.inflationAdjusted),
          hint: `Today rupees at ${formatPercent(data.inflationPct)} inflation`,
        }}
      />
      <AdvisoryStatRow
        items={[
          { label: "Invested", value: formatINRCurrency(data.totalInvested) },
          { label: "Pre-tax gain", value: formatINRCurrency(data.gain) },
          { label: "Net after tax", value: formatINRCurrency(data.netAfterTax) },
          { label: "Tax on gains", value: formatINRCurrency(data.tax) },
        ]}
      />
      <AdvisoryReading
        items={[
          {
            title: "Purchasing power",
            body: `${formatINRCurrency(data.monthlyInvestment)} a month for ${data.sipYears} years grows to ${formatINRCurrency(data.maturity)} on paper. At ${formatPercent(data.inflationPct)} inflation over ${data.investYears} years, that is ${formatINRCurrency(data.inflationAdjusted)} in today's rupees. Discuss the real figure with the client, not the headline corpus alone.`,
          },
          {
            title: "Tax on the gain",
            body: `Pre-tax gain is ${formatINRCurrency(data.gain)}. Tax at ${formatPercent(data.taxPct)} takes ${formatINRCurrency(data.tax)}, leaving ${formatINRCurrency(data.netAfterTax)} after tax. The real gain, after inflation, is ${formatINRCurrency(inflGain)}.`,
          },
          {
            title: "How the path is built",
            body: `Contributions run for ${data.sipYears} years inside a ${data.investYears}-year tenure at ${formatPercent(data.returnPct)} CAGR. From age ${data.age} the horizon ends at age ${endAge}. A late shift toward debt in the final two to three years keeps the planned redemption from sitting fully in equity.`,
          },
        ]}
      />

      <AdvisorySection title="Assumptions" keepTogether>
        <AdvisoryAssumptions
          items={[
            { label: "Client age", value: `${data.age} yrs` },
            { label: "Monthly SIP", value: formatINRCurrency(data.monthlyInvestment) },
            { label: "SIP years", value: `${data.sipYears} yrs` },
            { label: "Tenure", value: `${data.investYears} yrs` },
            {
              label: "Return CAGR",
              value: formatPercent(data.returnPct),
              accent: true,
            },
            { label: "Inflation", value: formatPercent(data.inflationPct) },
            { label: "Tax on gains", value: formatPercent(data.taxPct) },
            { label: "Delay", value: `${data.delayMonths} mo` },
          ]}
        />
      </AdvisorySection>

      <AdvisorySection
        title="Corpus composition"
        hint="Invested · Pre-tax gain · Tax"
        keepTogether
      >
        <div className="grid grid-cols-2 gap-10">
          <AdvisoryComposition
            title="Nominal mix"
            centerLabel="Maturity"
            centerValue={data.maturity}
            invested={data.totalInvested}
            gain={data.gain}
            tax={data.tax}
            taxLabel="Capital tax"
          />
          <AdvisoryComposition
            title="Real purchasing power"
            centerLabel="Today Rs"
            centerValue={data.inflationAdjusted}
            invested={data.totalInvested}
            gain={Math.max(0, inflGain)}
            tax={data.tax}
            taxLabel="Capital tax"
          />
        </div>
      </AdvisorySection>

      {hasDelay ? (
        <AdvisoryNote title="Cost of delay" tone="friction">
          Delaying SIP inception by {data.delayMonths} months shortens the compounding window and
          reduces terminal wealth under identical return assumptions. On-time maturity{" "}
          {formatINRCurrency(data.maturity)}. Delayed maturity{" "}
          {formatINRCurrency(data.delayedMaturity!)}. Capital penalty{" "}
          {formatINRCurrency(data.costOfDelay!)}.
        </AdvisoryNote>
      ) : null}

      <AdvisorySection title="Yearly accumulation schedule">
        <AdvisoryTable
          caption={<span>{data.investYears} cycles · full return vs inflation-adjusted</span>}
          columns={[
            { key: "year", header: "Yr", align: "center" },
            { key: "monthly", header: "SIP (Mo)", align: "right" },
            { key: "invested", header: "Invested", align: "right" },
            { key: "full", header: "Full return (end)", align: "right" },
            { key: "real", header: "Inflation-adjusted", align: "right" },
            { key: "note", header: "Milestone", align: "right" },
          ]}
          rows={data.schedule.map((row, i) => {
            const isLast = row.year === data.investYears;
            const isMid = row.year === mid;
            const infl = row.inflationAdjusted ?? row.yearEnd;
            return {
              _tone: isLast ? "final" : isMid ? "mid" : "default",
              year: row.year,
              monthly: formatINRCurrency(row.monthly),
              invested: formatINRCurrency(row.investedToDate),
              full: formatINRCurrency(row.yearEnd),
              real: formatINRCurrency(infl),
              note: isLast
                ? "Final year"
                : isMid
                  ? "Midpoint"
                  : i === 0
                    ? "Initiation"
                    : "Compounding",
            };
          })}
        />
      </AdvisorySection>

      <AdvisoryPlaybook pillars={playbook} />
    </AdvisoryDossierSheet>
  );
}
