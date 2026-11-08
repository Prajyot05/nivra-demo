"use client";

import { formatINRCurrency, formatPercent } from "@nivra/ui";
import {
  DUMMY_REPORT_CONTACT,
  type ExecutiveContact,
} from "@/components/reports/executive-dossier";
import { type LoanEmiReportData } from "@/components/reports/loan-emi-dossier";
import { getReportPlaybook } from "@/lib/report-playbooks";
import {
  AdvisoryAssumptions,
  AdvisoryDossierSheet,
  AdvisoryHero,
  AdvisoryNote,
  AdvisoryPlaybook,
  AdvisoryReading,
  AdvisorySection,
  AdvisoryStatRow,
  AdvisoryTable,
} from "@/components/v2/reports/advisory-dossier";

export const V2_LOAN_EMI_REPORT_ID = "v2-loan-emi-report";

type Props = {
  id?: string;
  data: LoanEmiReportData;
};

function buildYearlyRows(schedule: LoanEmiReportData["schedule"]) {
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
      rows.push({ year, principal, interest, balance: row.balance });
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

/**
 * V2-only Loan EMI PDF dossier. Classic loans page keeps LoanEmiDossier.
 */
export function V2LoanEmiAdvisoryDossier({
  id = V2_LOAN_EMI_REPORT_ID,
  data,
}: Props) {
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

  const principalPct =
    data.totalPaid > 0 ? (data.totalPrincipal / data.totalPaid) * 100 : 0;
  const interestPct =
    data.totalPaid > 0 ? (data.totalInterest / data.totalPaid) * 100 : 0;

  return (
    <AdvisoryDossierSheet
      id={id}
      title="Loan Analysis Dossier"
      subtitle={`${data.clientName || "Client"} · Age ${data.age}`}
      contact={contact}
      meta={[
        { label: "Client", value: data.clientName || "Client" },
        { label: "Tenure", value: `${data.years} yrs` },
        { label: "Rate", value: formatPercent(data.interestPct), accent: true },
        { label: "EMI", value: formatINRCurrency(data.emi), accent: true },
      ]}
    >
      <AdvisoryHero
        left={{
          label: "Monthly EMI",
          value: formatINRCurrency(data.emi),
          hint: `${formatINRCurrency(data.totalPrincipal)} principal · ${data.years} years`,
        }}
        right={{
          label: "Total interest",
          value: formatINRCurrency(data.totalInterest),
          hint: `${formatPercent(interestBurdenPct, 0)} of principal over the full tenure`,
        }}
      />
      <AdvisoryStatRow
        items={[
          { label: "Principal", value: formatINRCurrency(data.totalPrincipal) },
          { label: "Total paid", value: formatINRCurrency(data.totalPaid) },
          { label: "Recovery SIP", value: formatINRCurrency(data.recoverMonthlySip) },
          { label: "Months", value: String(totalMonths) },
        ]}
      />
      <AdvisoryReading
        items={[
          {
            title: "What the EMI actually costs",
            body: `The monthly instalment is ${formatINRCurrency(data.emi)} on a ${formatINRCurrency(data.totalPrincipal)} loan at ${formatPercent(data.interestPct)} for ${data.years} years. Lifetime interest is ${formatINRCurrency(data.totalInterest)}, which is ${formatPercent(interestBurdenPct, 0)} of principal. Total paid is ${formatINRCurrency(data.totalPaid)}.`,
          },
          {
            title: "Recovering the interest",
            body: `A parallel SIP of ${formatINRCurrency(data.recoverMonthlySip)} a month at ${formatPercent(data.recoverReturnPct)} invests ${formatINRCurrency(data.recoverInvested)} over the loan and is sized to offset that interest bill. Waiting ${data.delayMonths} months raises the SIP to ${formatINRCurrency(data.delayedRecoverMonthlySip)} and the amount invested to ${formatINRCurrency(data.delayedRecoverInvested)}.`,
          },
          ...(first
            ? [
                {
                  title: "Early months are interest-heavy",
                  body: `The first EMI splits into principal ${formatINRCurrency(first.principal)} and interest ${formatINRCurrency(first.interest)}. Most of the early payment services interest. Principal share rises only as the balance falls.`,
                },
              ]
            : []),
        ]}
      />

      {delayExtra > 0 ? (
        <AdvisoryNote title="Cost of delay" tone="friction">
          Waiting {data.delayMonths} months before starting the recovery SIP raises the monthly
          amount by {formatINRCurrency(delayExtra)} (from{" "}
          {formatINRCurrency(data.recoverMonthlySip)} to{" "}
          {formatINRCurrency(data.delayedRecoverMonthlySip)}).
        </AdvisoryNote>
      ) : null}

      <AdvisorySection title="Assumptions" keepTogether>
        <AdvisoryAssumptions
          items={[
            { label: "Principal", value: formatINRCurrency(data.principal) },
            { label: "Tenure", value: `${data.years} yrs` },
            {
              label: "Loan rate",
              value: formatPercent(data.interestPct),
              accent: true,
            },
            { label: "Recover return", value: formatPercent(data.recoverReturnPct) },
            { label: "Delay", value: `${data.delayMonths} mo` },
            { label: "Months", value: String(totalMonths) },
            { label: "Client age", value: `${data.age} yrs` },
            { label: "EMI", value: formatINRCurrency(data.emi) },
          ]}
        />
      </AdvisorySection>

      <AdvisorySection title="Interest recovery" keepTogether>
        <AdvisoryTable
          columns={[
            { key: "label", header: "Item", align: "left" },
            { key: "now", header: "Start now", align: "right" },
            { key: "later", header: `After ${data.delayMonths} mo`, align: "right" },
          ]}
          rows={[
            {
              label: "Monthly SIP",
              now: formatINRCurrency(data.recoverMonthlySip),
              later: formatINRCurrency(data.delayedRecoverMonthlySip),
            },
            {
              label: "Total invested",
              now: formatINRCurrency(data.recoverInvested),
              later: formatINRCurrency(data.delayedRecoverInvested),
            },
            {
              label: "Return / term",
              now: `${formatPercent(data.recoverReturnPct, 0)} · ${data.recoverMonths / 12}y`,
              later: `${data.delayedRecoverMonths} mo`,
            },
            {
              label: "Interest burden",
              now: `${formatPercent(interestBurdenPct, 0)} of principal`,
              later: `${mixPct(data.totalInterest, data.totalPaid)} of total paid`,
            },
          ]}
        />
      </AdvisorySection>

      <AdvisorySection
        title="Lifetime cost mix"
        hint="Principal vs interest over the full tenure"
        keepTogether
      >
        <AdvisoryTable
          columns={[
            { key: "label", header: "Component", align: "left" },
            { key: "amount", header: "Amount", align: "right" },
            { key: "share", header: "Share of total paid", align: "right" },
          ]}
          rows={[
            {
              label: "Principal",
              amount: formatINRCurrency(data.totalPrincipal),
              share: formatPercent(principalPct, 0),
            },
            {
              label: "Interest",
              amount: formatINRCurrency(data.totalInterest),
              share: formatPercent(interestPct, 0),
            },
            {
              label: "Total paid",
              amount: formatINRCurrency(data.totalPaid),
              share: `${totalMonths} EMIs`,
              _tone: "final",
            },
          ]}
        />
      </AdvisorySection>

      {milestones.length > 0 ? (
        <AdvisorySection
          title="Payoff timeline"
          hint="Remaining balance at selected year marks"
          keepTogether
        >
          <AdvisoryTable
            columns={[
              { key: "milestone", header: "Milestone", align: "left" },
              { key: "month", header: "Month", align: "right" },
              { key: "balance", header: "Remaining balance", align: "right" },
            ]}
            rows={[
              {
                milestone: "Start",
                month: "0",
                balance: formatINRCurrency(data.totalPrincipal),
              },
              ...milestones.map((m) => ({
                _tone: (m.month === totalMonths ? "final" : "default") as
                  | "final"
                  | "default",
                milestone: `Year ${m.year}`,
                month: String(m.month),
                balance: formatINRCurrency(m.balance),
              })),
            ]}
          />
        </AdvisorySection>
      ) : null}

      <AdvisorySection title="Yearly amortisation">
        <AdvisoryTable
          caption={
            <span>
              {yearlyRows.length} years
              {truncated ? ` · showing ${shownYears.length}` : ""}
            </span>
          }
          columns={[
            { key: "year", header: "Yr", align: "center" },
            { key: "principal", header: "Principal paid", align: "right" },
            { key: "interest", header: "Interest paid", align: "right" },
            { key: "balance", header: "Ending balance", align: "right" },
          ]}
          rows={shownYears.flatMap((row, index) => {
            const omitRow =
              truncated && index === 8 && midOmit > 0
                ? [
                    {
                      year: `… ${midOmit} years omitted …`,
                      principal: "",
                      interest: "",
                      balance: "",
                    },
                  ]
                : [];
            return [
              ...omitRow,
              {
                _tone: (row.year === yearlyRows.length ? "final" : "default") as
                  | "final"
                  | "default",
                year: row.year,
                principal: formatINRCurrency(row.principal),
                interest: formatINRCurrency(row.interest),
                balance: formatINRCurrency(row.balance),
              },
            ];
          })}
        />
      </AdvisorySection>

      <AdvisoryPlaybook pillars={playbook} />
    </AdvisoryDossierSheet>
  );
}
