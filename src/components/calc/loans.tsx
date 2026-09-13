"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateCalculatorReport,
  generatePdfFromElement,
  type PdfTableData,
} from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  LOAN_EMI_REPORT_ID,
  LoanEmiDossier,
} from "@/components/reports/loan-emi-dossier";
import {
  LOAN_EXTRA_VS_INVEST_REPORT_ID,
  LoanExtraVsInvestDossier,
} from "@/components/reports/loan-extra-vs-invest-dossier";
import {
  LOAN_INTEREST_RECOVERY_REPORT_ID,
  LoanInterestRecoveryDossier,
} from "@/components/reports/loan-interest-recovery-dossier";
import {
  LOAN_PREPAY_REPORT_ID,
  LoanPrepayDossier,
} from "@/components/reports/loan-prepay-dossier";
import {
  ClientHeader,
  CompareChart,
  CompositionChart,
  formatCompactINR,
  formatINRCurrency,
  formatPercent,
  GrowthChart,
  META_TEXT,
  MoneyInput,
  PercentInput,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  StackedAreaChart,
  StackedBarChart,
  StatCard,
  StatusNote,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] items-start gap-x-3 gap-y-3";

const MODES = [
  { id: "emi", label: "EMI" },
  { id: "prepay", label: "Prepay" },
  { id: "extra-vs-invest", label: "Extra vs invest" },
  { id: "recovery", label: "Interest recovery" },
  { id: "vehicle", label: "Vehicle" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);
const CALCULATOR_ID: Record<Mode, string> = {
  emi: "loan-emi",
  prepay: "loan-prepay",
  "extra-vs-invest": "loan-extra-vs-invest",
  recovery: "loan-interest-recovery",
  vehicle: "vehicle-loan",
};

type AmortRow = { month: number; emi: number; principal: number; interest: number; balance: number; extra?: number };

type EmiResult = {
  emi: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortRow[];
  recoverReturnPct: number;
  delayMonths: number;
  recoverMonths: number;
  delayedRecoverMonths: number;
  recoverMonthlySip: number;
  recoverInvested: number;
  delayedRecoverMonthlySip: number;
  delayedRecoverInvested: number;
};

type PrepayResult = EmiResult & {
  monthsPaid: number;
  totalExtra: number;
  originalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  recoverSip: number;
  revisedRecoverSip: number;
  originalSchedule: AmortRow[];
};

type ExtraVsInvestResult = {
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
  path: Array<{ month: number; outstandingPrepay: number; investment: number }>;
};

type RecoveryResult = {
  baselineEmi: number;
  baselineInterest: number;
  baselinePaid: number;
  proposedEmi: number;
  proposedInterest: number;
  proposedPaid: number;
  monthlySip: number;
  sipInvested: number;
  sipAtHorizon: number;
  wealthCreated: number;
  totalAssetPlusWealth: number;
  additionalWealth: number;
  savingsVsBaselinePaid: number;
  totalInvestedLoanPlusSip: number;
  schedule: Array<{ year: number; baseline: number; proposed: number; sip: number; loanPlusSip: number }>;
};

type VehicleOptionRow = {
  name: string;
  invested: number;
  maturity: number;
  profit: number;
  netProfit: number;
  outOfPocket: number;
  netOutOfPocket: number;
  financialBenefit: number;
};

type VehicleResult = {
  emi: number;
  totalInterest: number;
  totalDepreciation: number;
  totalTaxSaved: number;
  best: string | null;
  compare: Array<{ category: string; benefit: number }>;
  stacked: Array<{
    category: string;
    taxShield: number;
    opportunity: number;
    netBenefit: number;
  }>;
  options: VehicleOptionRow[];
  depreciation: Array<{
    year: number;
    value: number;
    depreciation: number;
    balance: number;
  }>;
};

type LoanResult = EmiResult & Partial<PrepayResult> & Partial<ExtraVsInvestResult> & Partial<RecoveryResult> & Partial<VehicleResult>;

export function LoansCalculator() {
  const [mode] = useCalculatorMode(MODE_IDS, "emi");
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(40);

  const [principal, setPrincipal] = useState(7_500_000);
  const [years, setYears] = useState(20);
  const [interest, setInterest] = useState(9.2);
  const [emiRecoverReturn, setEmiRecoverReturn] = useState(12);
  const [emiDelayMonths, setEmiDelayMonths] = useState(12);

  const [prepayPrincipal, setPrepayPrincipal] = useState(15_000_000);
  const [prepayYears, setPrepayYears] = useState(5);
  const [prepayRate, setPrepayRate] = useState(10);
  const [yearlyExtra, setYearlyExtra] = useState(318705.67);
  const [recoverReturn, setRecoverReturn] = useState(12);

  const [vsPrincipal, setVsPrincipal] = useState(20_000_000);
  const [vsYears, setVsYears] = useState(20);
  const [vsRate, setVsRate] = useState(8.5);
  const [extraAmount, setExtraAmount] = useState(5_000_000);
  const [extraMonth, setExtraMonth] = useState(49);
  const [investReturn, setInvestReturn] = useState(9);
  const [cgTax, setCgTax] = useState(12.5);
  const [incomeTax, setIncomeTax] = useState(20);

  const [recPrincipal, setRecPrincipal] = useState(20_000_000);
  const [recYears, setRecYears] = useState(20);
  const [recRate, setRecRate] = useState(8.5);
  const [proposedYears, setProposedYears] = useState(15);
  const [sipReturn, setSipReturn] = useState(12);

  const [onRoad, setOnRoad] = useState(3_500_000);
  const [vehLoan, setVehLoan] = useState(2_800_000);
  const [vehRate, setVehRate] = useState(8.5);
  const [vehYears, setVehYears] = useState(5);
  const [vehTax, setVehTax] = useState(20);
  const [depPct, setDepPct] = useState(15);
  const [fdRet, setFdRet] = useState(7);
  const [debtRet, setDebtRet] = useState(8);
  const [consRet, setConsRet] = useState(9);
  const [eqRet, setEqRet] = useState(12);
  const [fdTax, setFdTax] = useState(20);
  const [debtTax, setDebtTax] = useState(25);
  const [consTax, setConsTax] = useState(12.5);
  const [eqTax, setEqTax] = useState(12.5);

  const emiPrincipalError =
    principal <= 0 ? "Enter a principal greater than zero." : undefined;
  const emiYearsError =
    years <= 0
      ? "Enter a loan tenure greater than zero."
      : years > 50
        ? "Loan tenure cannot exceed 50 years."
        : undefined;
  const emiInterestError =
    interest <= 0
      ? "Loan interest rate must be above 0%."
      : interest > 100
        ? "Loan interest rate cannot exceed 100%."
        : undefined;
  const emiRecoverError =
    emiRecoverReturn <= 0
      ? "Investment return must be above 0%."
      : emiRecoverReturn > 100
        ? "Investment return cannot exceed 100%."
        : undefined;
  const emiDelayError =
    emiDelayMonths < 0
      ? "Delay cannot be negative."
      : emiDelayMonths >= years * 12
        ? "Delay must leave at least one investment month within the loan term."
        : undefined;
  const emiCanCalculate =
    !emiPrincipalError &&
    !emiYearsError &&
    !emiInterestError &&
    !emiRecoverError &&
    !emiDelayError;

  const vsTermMonths = Math.round(vsYears * 12);
  const vsPrincipalError =
    !(vsPrincipal > 0) ? "Loan principal must be greater than 0." : undefined;
  const vsYearsError =
    !(vsYears > 0) ? "Tenure must be greater than 0." : undefined;
  const vsRateError =
    !(vsRate > 0)
      ? "Loan interest rate must be above 0%."
      : vsRate > 100
        ? "Loan interest rate cannot exceed 100%."
        : undefined;
  const vsExtraError =
    extraAmount < 0
      ? "Extra payment cannot be negative."
      : extraAmount > vsPrincipal
        ? "Extra payment cannot exceed the loan principal."
        : undefined;
  const vsExtraMonthError =
    !(extraMonth >= 1)
      ? "Extra payment month must be at least 1."
      : extraMonth > vsTermMonths
        ? `Extra payment month cannot exceed the loan term (${vsTermMonths} months).`
        : undefined;
  const vsInvestError =
    !(investReturn > 0)
      ? "Investment return must be above 0%."
      : investReturn > 100
        ? "Investment return cannot exceed 100%."
        : undefined;
  const vsCgTaxError =
    cgTax < 0
      ? "Capital gains tax cannot be negative."
      : cgTax > 100
        ? "Capital gains tax cannot exceed 100%."
        : undefined;
  const vsIncomeTaxError =
    incomeTax < 0
      ? "Income tax rate cannot be negative."
      : incomeTax > 100
        ? "Income tax rate cannot exceed 100%."
        : undefined;
  const vsCanCalculate =
    !vsPrincipalError &&
    !vsYearsError &&
    !vsRateError &&
    !vsExtraError &&
    !vsExtraMonthError &&
    !vsInvestError &&
    !vsCgTaxError &&
    !vsIncomeTaxError;

  const recPrincipalError =
    !(recPrincipal > 0) ? "Loan principal must be greater than 0." : undefined;
  const recYearsError =
    !(recYears > 0) ? "Baseline tenure must be greater than 0." : undefined;
  const recRateError =
    !(recRate > 0)
      ? "Loan interest rate must be above 0%."
      : recRate > 100
        ? "Loan interest rate cannot exceed 100%."
        : undefined;
  const recProposedError =
    !(proposedYears > 0)
      ? "Proposed tenure must be greater than 0."
      : proposedYears >= recYears
        ? "Proposed tenure must be shorter than the baseline tenure."
        : undefined;
  const recSipError =
    !(sipReturn > 0)
      ? "SIP return must be above 0%."
      : sipReturn > 100
        ? "SIP return cannot exceed 100%."
        : undefined;
  const recCanCalculate =
    !recPrincipalError &&
    !recYearsError &&
    !recRateError &&
    !recProposedError &&
    !recSipError;

  const prepayPrincipalError =
    !(prepayPrincipal > 0) ? "Loan principal must be greater than 0." : undefined;
  const prepayYearsError =
    !(prepayYears > 0) ? "Loan tenure must be greater than 0." : undefined;
  const prepayRateError =
    !(prepayRate > 0)
      ? "Loan interest rate must be above 0%."
      : prepayRate > 100
        ? "Loan interest rate cannot exceed 100%."
        : undefined;
  const prepayExtraError =
    yearlyExtra < 0
      ? "Yearly extra payment cannot be negative."
      : yearlyExtra > prepayPrincipal
        ? "Yearly extra payment cannot exceed the loan principal."
        : undefined;
  const prepayRecoverError =
    !(recoverReturn > 0)
      ? "Investment return must be above 0%."
      : recoverReturn > 100
        ? "Investment return cannot exceed 100%."
        : undefined;
  const prepayCanCalculate =
    !prepayPrincipalError &&
    !prepayYearsError &&
    !prepayRateError &&
    !prepayExtraError &&
    !prepayRecoverError;

  const vehPctError = (value: number, label: string) =>
    value < 0
      ? `${label} cannot be negative.`
      : value > 100
        ? `${label} cannot exceed 100%.`
        : undefined;
  const vehOnRoadError =
    !(onRoad > 0) ? "On-road cost must be greater than 0." : undefined;
  const vehLoanError =
    vehLoan < 0
      ? "Loan amount cannot be negative."
      : vehLoan > onRoad
        ? "Loan amount cannot exceed on-road cost."
        : undefined;
  const vehRateError =
    !(vehRate > 0)
      ? "Loan interest rate must be above 0%."
      : vehRate > 100
        ? "Loan interest rate cannot exceed 100%."
        : undefined;
  const vehYearsError =
    !(vehYears > 0) ? "Loan tenure must be greater than 0." : undefined;
  const vehTaxError = vehPctError(vehTax, "Income tax rate");
  const depPctError = vehPctError(depPct, "Depreciation rate");
  const fdRetError = vehPctError(fdRet, "FD return");
  const debtRetError = vehPctError(debtRet, "MF debt return");
  const consRetError = vehPctError(consRet, "Conservative return");
  const eqRetError = vehPctError(eqRet, "Equity return");
  const fdTaxError = vehPctError(fdTax, "FD tax rate");
  const debtTaxError = vehPctError(debtTax, "MF debt tax rate");
  const consTaxError = vehPctError(consTax, "Conservative tax rate");
  const eqTaxError = vehPctError(eqTax, "Equity tax rate");
  const vehCanCalculate =
    !vehOnRoadError &&
    !vehLoanError &&
    !vehRateError &&
    !vehYearsError &&
    !vehTaxError &&
    !depPctError &&
    !fdRetError &&
    !debtRetError &&
    !consRetError &&
    !eqRetError &&
    !fdTaxError &&
    !debtTaxError &&
    !consTaxError &&
    !eqTaxError;

  const input = useMemo(() => {
    const client = { clientName: name, age };
    switch (mode) {
      case "emi":
        return {
          ...client,
          principal,
          years,
          interestPct: interest,
          recoverReturnPct: emiRecoverReturn,
          delayMonths: emiDelayMonths,
        };
      case "prepay":
        return {
          ...client,
          principal: prepayPrincipal,
          years: prepayYears,
          interestPct: prepayRate,
          yearlyExtra,
          recoverReturnPct: recoverReturn,
        };
      case "extra-vs-invest":
        return {
          ...client,
          principal: vsPrincipal,
          years: vsYears,
          interestPct: vsRate,
          extraAmount,
          extraMonth,
          investReturnPct: investReturn,
          taxPct: cgTax,
          incomeTaxPct: incomeTax,
        };
      case "recovery":
        return {
          ...client,
          principal: recPrincipal,
          years: recYears,
          interestPct: recRate,
          proposedYears,
          sipReturnPct: sipReturn,
        };
      case "vehicle":
        return {
          ...client,
          onRoadCost: onRoad,
          loanAmount: vehLoan,
          interestPct: vehRate,
          years: vehYears,
          incomeTaxPct: vehTax,
          depreciationPct: depPct,
          fdReturnPct: fdRet,
          debtReturnPct: debtRet,
          conservativeReturnPct: consRet,
          equityReturnPct: eqRet,
          fdTaxPct: fdTax,
          debtTaxPct: debtTax,
          conservativeTaxPct: consTax,
          equityTaxPct: eqTax,
        };
    }
  }, [
    mode, name, age, principal, years, interest, emiRecoverReturn, emiDelayMonths,
    prepayPrincipal, prepayYears, prepayRate, yearlyExtra, recoverReturn,
    vsPrincipal, vsYears, vsRate, extraAmount, extraMonth, investReturn, cgTax, incomeTax,
    recPrincipal, recYears, recRate, proposedYears, sipReturn,
    onRoad, vehLoan, vehRate, vehYears, vehTax, depPct, fdRet, debtRet, consRet, eqRet, fdTax, debtTax, consTax, eqTax,
  ]);

  const { result, error, loading } = useCalculate<LoanResult>(
    CALCULATOR_ID[mode],
    input,
    mode === "emi"
      ? emiCanCalculate
      : mode === "extra-vs-invest"
        ? vsCanCalculate
        : mode === "recovery"
          ? recCanCalculate
          : mode === "prepay"
            ? prepayCanCalculate
            : mode === "vehicle"
              ? vehCanCalculate
              : true,
  );

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    if (mode === "emi") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          LOAN_EMI_REPORT_ID,
          `loan-emi-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "extra-vs-invest") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          LOAN_EXTRA_VS_INVEST_REPORT_ID,
          `loan-extra-vs-invest-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "recovery") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          LOAN_INTEREST_RECOVERY_REPORT_ID,
          `loan-interest-recovery-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "prepay") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          LOAN_PREPAY_REPORT_ID,
          `loan-prepay-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    const tables: PdfTableData[] = [];
    const modeLabel =
      MODES.find((m) => m.id === mode)?.label ??
      MODES.find((m) => m.id === mode)?.label ??
      String(mode);

    let headlines = [
      { label: "Monthly EMI", value: result.emi ?? 0, highlight: true as const, hint: modeLabel },
      { label: "Total Interest", value: result.totalInterest ?? result.originalInterest ?? 0, hint: "Lifetime interest cost" },
    ];
    let metrics: Array<{ label: string; value: string | number; currency?: boolean; danger?: boolean }> = [
      { label: "Principal", value: result.totalPrincipal ?? principal },
      { label: "Tenure", value: `${years} yrs`, currency: false },
      { label: "Rate", value: `${interest}%`, currency: false },
      { label: "Total Paid", value: result.totalPaid ?? 0 },
    ];
    const assumptions: Array<[string, string | number, boolean?]> = [
      ["Mode", modeLabel],
    ];

    if (mode === "vehicle" && result.depreciation) {
      headlines = [
        { label: "EMI", value: result.emi ?? 0, highlight: true, hint: "Vehicle loan EMI" },
        { label: "Tax Saved", value: result.totalTaxSaved ?? 0, hint: "Depreciation shield" },
      ];
      metrics = [
        { label: "Total Interest", value: result.totalInterest ?? 0 },
        { label: "Total Depreciation", value: result.totalDepreciation ?? 0 },
        { label: "On-Road Price", value: onRoad },
        { label: "Loan Amount", value: vehLoan },
      ];
      assumptions.push(
        ["On-Road", onRoad, true],
        ["Loan", vehLoan, true],
        ["Rate", `${vehRate}%`],
        ["Years", vehYears],
      );
      tables.push({
        title: "Depreciation Schedule",
        head: ["Year", "Value", "Depreciation", "Balance"],
        body: result.depreciation.map((row) => [row.year, row.value, row.depreciation, row.balance]),
        columnAlignments: ["left", "right", "right", "right"],
        currencyColumns: [1, 2, 3],
      });
    }

    generateCalculatorReport({
      title: "Loan Analysis Dossier",
      subtitle: `${modeLabel} · ${name}`,
      clientName: name,
      age,
      status: "Validated Model",
      filename: `loans-${name}`,
      headlines,
      metrics,
      assumptions,
      tables,
      playbook: playbookForPdf("loan-emi"),
    });
  };

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/loans", mode)}
      description={
        mode === "emi"
          ? "Monthly EMI, amortisation, and the SIP needed to offset total loan interest."
          : "Monthly EMI for a home or personal loan — principal, tenure, and interest rate."
      }
      actions={
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] transition-colors disabled:opacity-50"
          onClick={handleDownload}
          disabled={isDownloading || !result}
          title="Download Executive Dossier"
        >
          {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        </Button>
      }
      form={
        mode === "emi" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Principal"
              value={principal}
              onChange={setPrincipal}
              error={emiPrincipalError}
              align="right"
            />
            <YearInput
              label="Tenure"
              value={years}
              min={1}
              max={50}
              onChange={setYears}
              error={emiYearsError}
            />
            <PercentInput
              label="Loan rate"
              value={interest}
              onChange={setInterest}
              error={emiInterestError}
            />
            <PercentInput
              label="Recover return"
              value={emiRecoverReturn}
              onChange={setEmiRecoverReturn}
              error={emiRecoverError}
            />
            <YearInput
              label="Delay (mo)"
              value={emiDelayMonths}
              min={0}
              max={Math.max(0, years * 12 - 1)}
              onChange={setEmiDelayMonths}
              error={emiDelayError}
            />
          </div>
        ) : mode === "prepay" ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] items-start gap-x-3 gap-y-3">
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Loan principal"
              value={prepayPrincipal}
              onChange={setPrepayPrincipal}
              error={prepayPrincipalError}
            />
            <YearInput
              label="Loan tenure"
              value={prepayYears}
              min={1}
              max={50}
              onChange={setPrepayYears}
              error={prepayYearsError}
            />
            <PercentInput
              label="Loan interest (%)"
              value={prepayRate}
              onChange={setPrepayRate}
              error={prepayRateError}
            />
            <MoneyInput
              label="Yearly extra payment"
              value={yearlyExtra}
              onChange={setYearlyExtra}
              error={prepayExtraError}
              wrapLabel
            />
            <PercentInput
              label="Investment return (%)"
              value={recoverReturn}
              onChange={setRecoverReturn}
              error={prepayRecoverError}
              wrapLabel
            />
          </div>
        ) : mode === "extra-vs-invest" ? (
          <div className="grid grid-cols-2 items-start gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Loan principal"
              value={vsPrincipal}
              onChange={setVsPrincipal}
              error={vsPrincipalError}
            />
            <YearInput
              value={vsYears}
              min={1}
              max={50}
              onChange={setVsYears}
              error={vsYearsError}
            />
            <PercentInput
              label="Loan interest (%)"
              value={vsRate}
              onChange={setVsRate}
              error={vsRateError}
            />
            <MoneyInput
              label="Extra payment"
              value={extraAmount}
              onChange={setExtraAmount}
              error={vsExtraError}
            />
            <YearInput
              label="Extra payment month"
              value={extraMonth}
              min={1}
              max={vsTermMonths || 1200}
              onChange={setExtraMonth}
              hint="Of the loan term"
              error={vsExtraMonthError}
              wrapLabel
            />
            <PercentInput
              label="Investment return (%)"
              value={investReturn}
              onChange={setInvestReturn}
              error={vsInvestError}
              wrapLabel
            />
            <PercentInput
              label="Capital gains tax (%)"
              value={cgTax}
              onChange={setCgTax}
              error={vsCgTaxError}
              wrapLabel
            />
            <PercentInput
              label="Income tax rate (%)"
              value={incomeTax}
              onChange={setIncomeTax}
              error={vsIncomeTaxError}
              wrapLabel
            />
          </div>
        ) : mode === "recovery" ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] items-start gap-x-3 gap-y-3">
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Loan principal"
              value={recPrincipal}
              onChange={setRecPrincipal}
              error={recPrincipalError}
            />
            <YearInput
              label="Baseline tenure"
              value={recYears}
              min={1}
              max={50}
              onChange={setRecYears}
              error={recYearsError}
            />
            <PercentInput
              label="Loan interest (%)"
              value={recRate}
              onChange={setRecRate}
              error={recRateError}
            />
            <YearInput
              label="Proposed tenure"
              value={proposedYears}
              min={1}
              max={Math.max(1, recYears - 1)}
              onChange={setProposedYears}
              error={recProposedError}
            />
            <PercentInput
              label="SIP return (%)"
              value={sipReturn}
              onChange={setSipReturn}
              error={recSipError}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] items-start gap-x-3 gap-y-3">
              <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                Vehicle & loan
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] items-start gap-x-3 gap-y-3">
                <MoneyInput
                  label="On-road cost"
                  value={onRoad}
                  onChange={setOnRoad}
                  error={vehOnRoadError}
                />
                <MoneyInput
                  label="Loan amount"
                  value={vehLoan}
                  onChange={setVehLoan}
                  error={vehLoanError}
                />
                <PercentInput
                  label="Loan interest rate (%)"
                  value={vehRate}
                  onChange={setVehRate}
                  error={vehRateError}
                />
                <YearInput
                  label="Tenure"
                  value={vehYears}
                  min={1}
                  max={15}
                  onChange={setVehYears}
                  error={vehYearsError}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                Tax assumptions
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] items-start gap-x-3 gap-y-3">
                <PercentInput
                  label="Income tax rate (%)"
                  value={vehTax}
                  onChange={setVehTax}
                  error={vehTaxError}
                />
                <PercentInput
                  label="Depreciation rate (%)"
                  value={depPct}
                  onChange={setDepPct}
                  error={depPctError}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                Investment alternatives
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] items-start gap-x-3 gap-y-3">
                <PercentInput
                  label="FD return (%)"
                  value={fdRet}
                  onChange={setFdRet}
                  error={fdRetError}
                />
                <PercentInput
                  label="FD tax rate (%)"
                  value={fdTax}
                  onChange={setFdTax}
                  error={fdTaxError}
                />
                <PercentInput
                  label="MF debt return (%)"
                  value={debtRet}
                  onChange={setDebtRet}
                  error={debtRetError}
                />
                <PercentInput
                  label="MF debt tax rate (%)"
                  value={debtTax}
                  onChange={setDebtTax}
                  error={debtTaxError}
                />
                <PercentInput
                  label="MF conservative return (%)"
                  value={consRet}
                  onChange={setConsRet}
                  error={consRetError}
                />
                <PercentInput
                  label="Conservative tax rate (%)"
                  value={consTax}
                  onChange={setConsTax}
                  error={consTaxError}
                />
                <PercentInput
                  label="Equity return (%)"
                  value={eqRet}
                  onChange={setEqRet}
                  error={eqRetError}
                />
                <PercentInput
                  label="Equity tax rate (%)"
                  value={eqTax}
                  onChange={setEqTax}
                  error={eqTaxError}
                />
              </div>
            </div>
          </div>
        )
      }
      results={
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {mode === "emi" && !emiCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted principal, tenure, rate, or recovery fields before calculating.
            </StatusNote>
          ) : null}
          {mode === "extra-vs-invest" && !vsCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted loan, prepayment, or investment fields before calculating.
            </StatusNote>
          ) : null}
          {mode === "recovery" && !recCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted loan or SIP fields before calculating. Proposed tenure must be shorter than baseline.
            </StatusNote>
          ) : null}
          {mode === "prepay" && !prepayCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted loan, extra payment, or investment return fields before calculating.
            </StatusNote>
          ) : null}
          {mode === "vehicle" && !vehCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted vehicle, loan, tax, or investment fields before calculating. Loan amount cannot exceed on-road cost.
            </StatusNote>
          ) : null}
          {error ? <StatusNote tone="error">{error}</StatusNote> : null}
          {loading && !result ? (
            <StatusNote tone="pending">Calculating…</StatusNote>
          ) : null}
          {result && mode === "emi" && Array.isArray(result.schedule) ? (
            <EmiResults result={result as EmiResult} />
          ) : null}
          {result && mode === "prepay" && Array.isArray(result.originalSchedule) ? (
            <PrepayResults
              result={result as PrepayResult}
              yearlyExtra={yearlyExtra}
            />
          ) : null}
          {result && mode === "extra-vs-invest" && Array.isArray(result.path) ? (
            <ExtraVsInvestResults
              result={result as ExtraVsInvestResult}
              extraAmount={extraAmount}
              extraMonth={extraMonth}
              tenureYears={vsYears}
              investReturnPct={investReturn}
            />
          ) : null}
          {result && mode === "recovery" && result.baselineEmi != null ? (
            <RecoveryResults
              result={result as RecoveryResult}
              principal={recPrincipal}
              baselineYears={recYears}
              proposedYears={proposedYears}
            />
          ) : null}
          {result && mode === "vehicle" && Array.isArray(result.depreciation) ? (
            <VehicleResults
              result={result as VehicleResult}
              returnsByOption={{
                "No loan": null,
                FD: fdRet,
                "MF debt": debtRet,
                Conservative: consRet,
                Equity: eqRet,
              }}
            />
          ) : null}
        </div>
      }
    />
    {mode === "emi" && result && Array.isArray(result.schedule) ? (
      <LoanEmiDossier
        data={{
          clientName: name,
          age,
          principal,
          years,
          interestPct: interest,
          recoverReturnPct: result.recoverReturnPct ?? emiRecoverReturn,
          delayMonths: result.delayMonths ?? emiDelayMonths,
          emi: result.emi ?? 0,
          totalPrincipal: result.totalPrincipal ?? principal,
          totalInterest: result.totalInterest ?? 0,
          totalPaid: result.totalPaid ?? 0,
          recoverMonths: result.recoverMonths ?? years * 12,
          delayedRecoverMonths: result.delayedRecoverMonths ?? 0,
          recoverMonthlySip: result.recoverMonthlySip ?? 0,
          recoverInvested: result.recoverInvested ?? 0,
          delayedRecoverMonthlySip: result.delayedRecoverMonthlySip ?? 0,
          delayedRecoverInvested: result.delayedRecoverInvested ?? 0,
          schedule: result.schedule as EmiResult["schedule"],
        }}
      />
    ) : null}
    {mode === "extra-vs-invest" && result && Array.isArray(result.path) ? (
      <LoanExtraVsInvestDossier
        data={{
          clientName: name,
          age,
          principal: vsPrincipal,
          years: vsYears,
          interestPct: vsRate,
          extraAmount,
          extraMonth,
          investReturnPct: investReturn,
          taxPct: cgTax,
          incomeTaxPct: incomeTax,
          emi: result.emi ?? 0,
          originalInterest: result.originalInterest ?? 0,
          originalNetCost: result.originalNetCost ?? 0,
          option1Interest: result.option1Interest ?? 0,
          option1Saving: result.option1Saving ?? 0,
          option1NetCost: result.option1NetCost ?? 0,
          corpusAfterTax: result.corpusAfterTax ?? 0,
          option2Saving: result.option2Saving ?? 0,
          option2NetCost: result.option2NetCost ?? 0,
          remainingMonths: result.remainingMonths ?? 0,
          interestSavedVsOriginal: result.interestSavedVsOriginal ?? 0,
          path: result.path as ExtraVsInvestResult["path"],
        }}
      />
    ) : null}
    {mode === "recovery" && result && result.baselineEmi != null ? (
      <LoanInterestRecoveryDossier
        data={{
          clientName: name,
          age,
          principal: recPrincipal,
          baselineYears: recYears,
          proposedYears,
          interestPct: recRate,
          sipReturnPct: sipReturn,
          baselineEmi: result.baselineEmi ?? 0,
          baselineInterest: result.baselineInterest ?? 0,
          baselinePaid: result.baselinePaid ?? 0,
          proposedEmi: result.proposedEmi ?? 0,
          proposedInterest: result.proposedInterest ?? 0,
          proposedPaid: result.proposedPaid ?? 0,
          monthlySip: result.monthlySip ?? 0,
          sipInvested: result.sipInvested ?? 0,
          sipAtHorizon: result.sipAtHorizon ?? 0,
          wealthCreated: result.wealthCreated ?? 0,
          totalAssetPlusWealth: result.totalAssetPlusWealth ?? 0,
          additionalWealth: result.additionalWealth ?? 0,
          savingsVsBaselinePaid: result.savingsVsBaselinePaid ?? 0,
          totalInvestedLoanPlusSip: result.totalInvestedLoanPlusSip ?? 0,
          schedule: (result.schedule as RecoveryResult["schedule"]) ?? [],
        }}
      />
    ) : null}
    {mode === "prepay" && result && Array.isArray(result.originalSchedule) ? (
      <LoanPrepayDossier
        data={{
          clientName: name,
          age,
          principal: prepayPrincipal,
          years: prepayYears,
          interestPct: prepayRate,
          yearlyExtra,
          recoverReturnPct: recoverReturn,
          emi: result.emi ?? 0,
          monthsPaid: result.monthsPaid ?? 0,
          totalPrincipal: result.totalPrincipal ?? prepayPrincipal,
          totalInterest: result.totalInterest ?? 0,
          totalExtra: result.totalExtra ?? 0,
          originalInterest: result.originalInterest ?? 0,
          interestSaved: result.interestSaved ?? 0,
          monthsSaved: result.monthsSaved ?? 0,
          recoverSip: result.recoverSip ?? 0,
          revisedRecoverSip: result.revisedRecoverSip ?? 0,
          schedule: (result.schedule as PrepayResult["schedule"]) ?? [],
          originalScheduleLength: result.originalSchedule.length,
        }}
      />
    ) : null}
    </>
  );
}

function monthTickLabel(month: number, totalMonths: number): string {
  if (month === 1) return "M1";
  if (month === totalMonths) return `M${totalMonths}`;
  if (month % 12 === 0) return `Y${month / 12}`;
  return "";
}

function EmiResults({ result }: { result: EmiResult }) {
  let interestToDate = 0;
  const area = result.schedule.map((row) => {
    interestToDate += row.interest;
    return { year: row.month, remaining: row.balance, interestPaid: interestToDate };
  });
  const totalMonths = result.schedule.length;
  const first = result.schedule[0];
  const interestBurdenPct =
    result.totalPrincipal > 0 ? (result.totalInterest / result.totalPrincipal) * 100 : 0;
  const delayExtra = Math.max(
    0,
    result.delayedRecoverMonthlySip - result.recoverMonthlySip,
  );
  const scheduleRows = [
    ...result.schedule.map((row) => ({
      ...row,
      marker:
        row.month % 12 === 0 && row.month < totalMonths
          ? `Year ${row.month / 12} complete`
          : row.month === totalMonths
            ? "Loan fully repaid"
            : "",
    })),
    {
      month: 0,
      emi: 0,
      principal: result.totalPrincipal,
      interest: result.totalInterest,
      balance: 0,
      marker: "TOTAL",
    },
  ];
  const loanYears = Math.max(1, Math.round(totalMonths / 12));
  const milestones = [1, 5, 10, 15, 20]
    .filter((year) => year <= loanYears)
    .map((year) => {
      const month = Math.min(year * 12, totalMonths);
      const row = result.schedule[month - 1];
      if (!row) return null;
      return { year, month, balance: row.balance };
    })
    .filter((row): row is { year: number; month: number; balance: number } => row != null);

  return (
    <div className="flex flex-col gap-2.5">
      <div className={`${RESULTS_SPLIT} gap-2.5`}>
        <div className={`${RESULTS_LEFT} gap-2.5`}>
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <StatCard title="EMI" value={result.emi} />
            <StatCard title="Total interest" value={result.totalInterest} variant="soft" />
            <StatCard title="Total paid" value={result.totalPaid} />
          </div>

          {first ? (
            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[12px]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                  First EMI
                </span>
                <span>
                  Principal{" "}
                  <span className="font-semibold tabular-nums text-[var(--app-std-text)]">
                    {formatINRCurrency(first.principal)}
                  </span>
                </span>
                <span>
                  Interest{" "}
                  <span className="font-semibold tabular-nums text-[var(--app-warn-text)]">
                    {formatINRCurrency(first.interest)}
                  </span>
                </span>
                <span className={META_TEXT}>
                  Interest = {formatPercent(interestBurdenPct, 0)} of principal
                </span>
              </div>
            </div>
          ) : null}

          <GrowthChart
            title="Principal vs interest payment by month"
            className="min-h-[200px] sm:min-h-[220px]"
            data={result.schedule.map((row) => ({
              year: row.month,
              principal: row.principal,
              interest: row.interest,
            }))}
            series={[
              { key: "principal", label: "Principal payment", color: "var(--app-chart-invested)" },
              { key: "interest", label: "Interest payment", color: "var(--app-chart-tax)" },
            ]}
            xTickFormatter={(month) => monthTickLabel(month, totalMonths)}
          />
          <CompositionChart
            title="Lifetime mix"
            compact
            showPercentages
            slices={[
              { name: "Principal", value: result.totalPrincipal, color: "var(--app-chart-invested)" },
              { name: "Interest", value: result.totalInterest, color: "var(--app-chart-tax)" },
            ]}
            centerLabel="Total paid"
            centerValue={result.totalPaid}
          />
          <StackedAreaChart
            title="Remaining principal vs cumulative interest paid"
            className="min-h-[200px]"
            data={area}
            series={[
              { key: "remaining", label: "Remaining principal", color: "var(--app-chart-invested)" },
              {
                key: "interestPaid",
                label: "Cumulative interest paid",
                color: "var(--app-chart-tax)",
              },
            ]}
            xTickFormatter={(month) => monthTickLabel(month, totalMonths)}
          />
        </div>
        <div className={`${RESULTS_RIGHT} gap-2.5`}>
          <ResultCard
            title="Loan summary"
            items={[
              { label: "EMI", value: result.emi },
              { label: "Principal", value: result.totalPrincipal },
              {
                label: "Interest",
                value: result.totalInterest,
                hint: `${formatPercent(interestBurdenPct, 0)} of principal`,
              },
              { label: "Total paid", value: result.totalPaid },
            ]}
          />
          <ResultCard
            title="Recover interest"
            items={[
              { label: "Total interest", value: result.totalInterest },
              {
                label: "Return / term",
                displayValue: `${formatPercent(result.recoverReturnPct, 0)} · ${result.recoverMonths / 12}y`,
              },
              {
                label: "SIP start now",
                value: result.recoverMonthlySip,
                highlight: true,
              },
              { label: "Total invested", value: result.recoverInvested },
              {
                label: `SIP after ${result.delayMonths} mo`,
                value: result.delayedRecoverMonthlySip,
                hint:
                  delayExtra > 0
                    ? `+${formatINRCurrency(delayExtra)}/mo if you wait`
                    : undefined,
                tone: "delay",
              },
            ]}
          />
        </div>
      </div>

      {milestones.length > 0 ? (
        <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Payoff timeline
            </div>
            <div className={META_TEXT}>Remaining balance by year</div>
          </div>
          <div className="relative w-full pt-1">
            <div
              className="pointer-events-none absolute left-4 right-4 top-[0.95rem] h-0.5 bg-[var(--app-border)] sm:left-6 sm:right-6"
              aria-hidden
            />
            <div className="relative z-[1] flex w-full items-start justify-between gap-1">
              <div className="flex w-[4.5rem] shrink-0 flex-col items-center sm:w-[5rem]">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--app-primary)] bg-[var(--app-primary)] text-[var(--app-primary-fg)]">
                  <span className="text-[10px] font-bold">0</span>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                    Start
                  </div>
                  <div className="text-[11px] font-semibold tabular-nums text-[var(--app-text)]">
                    {formatINRCurrency(result.totalPrincipal)}
                  </div>
                </div>
              </div>

              {milestones.map((m) => {
                const repaid = m.balance <= 1e-6;
                return (
                  <div
                    key={m.year}
                    className="flex min-w-0 flex-1 flex-col items-center"
                  >
                    <div
                      className={`flex size-8 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                        repaid
                          ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                          : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]"
                      }`}
                    >
                      {repaid ? "✓" : m.year}
                    </div>
                    <div className="mt-1.5 max-w-full text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                        Year {m.year}
                      </div>
                      <div
                        className={`truncate text-[11px] font-semibold tabular-nums ${
                          repaid ? "text-[var(--app-step-text)]" : "text-[var(--app-text)]"
                        }`}
                      >
                        {repaid ? "Repaid" : formatINRCurrency(m.balance)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <ScheduleTable
        caption="Amortisation"
        meta={`${totalMonths} mo · final balance ₹0`}
        zebra
        highlightLastRow
        className="max-h-[420px]"
        dense
        emphasizeRow={(row) =>
          Number(row.month) > 0 &&
          (Number(row.month) % 12 === 0 || Number(row.month) === totalMonths)
        }
        columns={[
          {
            key: "month",
            header: "Mo",
            sticky: true,
            render: (value, row) => {
              if (row.marker === "TOTAL") return "TOTAL";
              const label = String(value ?? "");
              if (!row.marker || row.marker === "TOTAL") return label;
              return (
                <span className="inline-flex flex-col leading-tight">
                  <span>{label}</span>
                  <span className="text-[9px] font-medium text-[var(--app-text-subtle)]">
                    {String(row.marker)}
                  </span>
                </span>
              );
            },
          },
          {
            key: "emi",
            header: "EMI",
            format: "inr",
            align: "right",
            tone: "std",
            render: (value, row) =>
              row.marker === "TOTAL" ? "—" : formatINRCurrency(Number(value ?? 0)),
          },
          {
            key: "principal",
            header: "Principal",
            format: "inr",
            align: "right",
            tone: "std",
          },
          {
            key: "interest",
            header: "Interest",
            format: "inr",
            align: "right",
            tone: "warn",
          },
          {
            key: "balance",
            header: "Balance",
            format: "inr",
            align: "right",
            tone: "step",
          },
        ]}
        rows={scheduleRows}
      />
    </div>
  );
}

function PrepayResults({
  result,
  yearlyExtra,
}: {
  result: PrepayResult;
  yearlyExtra: number;
}) {
  const originalMonths = result.originalSchedule.length;
  const monthsPaid = result.monthsPaid;
  const paidIn = formatLoanRemaining(monthsPaid);
  const originalTerm = formatLoanRemaining(originalMonths);
  const timeSaved = formatLoanRemaining(result.monthsSaved);
  const sipLower = Math.max(0, result.recoverSip - result.revisedRecoverSip);

  const scheduleRows = result.schedule as Array<
    AmortRow & { extra?: number }
  >;
  const extraMonths = scheduleRows
    .filter((row) => (row.extra ?? 0) > 0)
    .map((row) => row.month);

  const origByMonth = new Map(result.originalSchedule.map((row) => [row.month, row.balance]));
  const last = Math.max(originalMonths, monthsPaid);
  const line = Array.from({ length: last }, (_, i) => {
    const month = i + 1;
    return {
      year: month,
      scheduled: origByMonth.get(month) ?? 0,
      prepaid: scheduleRows[i]?.balance ?? 0,
    };
  });

  const pathReferenceLines = [
    ...(extraMonths[0] != null
      ? [
          {
            x: extraMonths[0],
            label: `M${extraMonths[0]} · Yearly extras`,
            color: "var(--app-text-muted)",
          },
        ]
      : []),
    ...extraMonths.slice(1).map((month) => ({
      x: month,
      color: "var(--app-text-muted)",
    })),
    {
      x: monthsPaid,
      label: `Loan paid off · M${monthsPaid}`,
      color: "var(--app-chart-gain)",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-4 gap-2">
        <div className="relative flex min-h-[5.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-[var(--app-step-text)]/30 bg-[var(--app-step-bg)] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
            Yearly extra payments
          </div>
          {result.monthsSaved > 0 || result.interestSaved > 0 ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[var(--app-surface)]/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  Debt-free sooner
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                  {timeSaved.primary} saved
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-[var(--app-step-text)]">
                  {originalMonths}m → {monthsPaid}m
                </div>
              </div>
              <div className="rounded-lg bg-[var(--app-surface)]/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  Interest saved
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                  {formatINRCurrency(result.interestSaved)}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-[var(--app-step-text)]">
                  Paid in {paidIn.primary}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-sm font-semibold leading-snug text-[var(--app-step-text-strong)]">
              Add a yearly extra payment to shorten the loan and reduce interest.
            </div>
          )}
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="Interest saved" value={result.interestSaved} />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="Total extra payments" value={result.totalExtra} variant="soft" />
        </div>
        <div className="flex min-h-[5.25rem] min-w-0 flex-col justify-center rounded-xl bg-[var(--app-primary)] px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)] sm:text-[11px]">
            Time saved
          </div>
          <div className="mt-1 text-lg font-semibold leading-tight tabular-nums text-[var(--app-primary-fg)] sm:text-xl">
            {originalMonths} → {monthsPaid} mo
          </div>
          <div className="mt-1 text-[11px] leading-snug text-[var(--app-primary-fg-muted)]">
            {result.monthsSaved} month{result.monthsSaved === 1 ? "" : "s"} saved
          </div>
        </div>
      </div>

      {extraMonths.length > 0 ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 sm:px-4">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Extra payment timeline
            </div>
            <div className={META_TEXT}>
              {formatINRCurrency(yearlyExtra)} each year · repaid in month {monthsPaid}
            </div>
          </div>
          <div className="relative w-full overflow-x-auto pt-1">
            <div
              className="pointer-events-none absolute left-6 right-6 top-[0.95rem] h-0.5 bg-[var(--app-border)]"
              aria-hidden
            />
            <div className="relative z-[1] flex min-w-[28rem] items-start justify-between gap-2">
              {extraMonths.map((month, index) => (
                <div
                  key={month}
                  className="flex min-w-0 flex-1 flex-col items-center"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] text-[var(--app-warn-text-strong)]">
                    <span className="text-[10px] font-bold">Y{index + 1}</span>
                  </div>
                  <div className="mt-1.5 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                      Month {month}
                    </div>
                    <div className="text-[11px] font-semibold tabular-nums text-[var(--app-warn-text)]">
                      +{formatCompactINR(yearlyExtra)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)]">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                    Paid off
                  </div>
                  <div className="text-[11px] font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                    Month {monthsPaid}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`${RESULTS_SPLIT} gap-3 lg:items-start`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <GrowthChart
            title="Outstanding: scheduled vs extra"
            className="h-[340px] min-h-[340px] w-full flex-none sm:h-[360px] sm:min-h-[360px]"
            data={line}
            series={[
              { key: "scheduled", label: "Scheduled loan", color: "var(--app-chart-tax)" },
              { key: "prepaid", label: "With annual extra payments", color: "var(--app-chart-invested)" },
            ]}
            showEndLabels
            endpointDots
            xTickFormatter={(month) => {
              if (month === 1) return "M1";
              if (month === monthsPaid) return `M${monthsPaid}`;
              if (month === originalMonths) return `M${originalMonths}`;
              if (month % 12 === 0) return `Y${month / 12}`;
              return "";
            }}
            referenceLines={pathReferenceLines}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Debt-free in {monthsPaid} months ({paidIn.primary}). Scheduled term was{" "}
            {originalTerm.primary}.
          </div>
        </div>

        <div className={`${RESULTS_RIGHT} gap-3`}>
          <ResultCard
            title="Results"
            items={[
              {
                label: "EMI",
                value: result.emi,
              },
              {
                label: "Loan paid in",
                displayValue: `${paidIn.primary} (${monthsPaid} months)`,
                highlight: true,
              },
              {
                label: "Time saved",
                displayValue: `${result.monthsSaved} months`,
                hint: `${originalMonths} → ${monthsPaid} months`,
              },
              {
                label: "Interest saved",
                value: result.interestSaved,
                tone: "gain",
                highlight: true,
              },
              {
                label: "Total extra payments",
                value: result.totalExtra,
              },
              {
                label: "SIP to recover original interest",
                value: result.recoverSip,
                hint: "Monthly",
              },
              {
                label: "SIP to recover revised interest",
                value: result.revisedRecoverSip,
                hint:
                  sipLower > 0
                    ? `${formatINRCurrency(sipLower)}/mo lower investment required`
                    : "Monthly",
              },
            ]}
          />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        <CompareChart
          title="Interest"
          className="min-h-[240px] flex-none"
          data={[
            {
              category: "Original",
              value: result.originalInterest,
            },
            {
              category: "With extra",
              value: result.totalInterest,
            },
          ]}
          series={[{ key: "value", label: "Interest", color: "var(--app-chart-tax)" }]}
        />
        <div className="flex min-h-[240px] flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Loan duration
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 p-3">
            <div className="grid flex-1 grid-cols-2 gap-2.5">
              <div className="flex flex-col justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                  Original
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums leading-none text-[var(--app-text)]">
                  {originalMonths}
                  <span className="ml-1 text-sm font-semibold text-[var(--app-text-muted)]">mo</span>
                </div>
                <div className={`mt-1.5 ${META_TEXT}`}>{originalTerm.primary}</div>
              </div>
              <div className="flex flex-col justify-center rounded-lg border border-[var(--app-step-text)]/30 bg-[var(--app-step-bg)] px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  With extra
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums leading-none text-[var(--app-step-text-strong)]">
                  {monthsPaid}
                  <span className="ml-1 text-sm font-semibold text-[var(--app-step-text)]">mo</span>
                </div>
                <div className="mt-1.5 text-[11px] font-medium tabular-nums text-[var(--app-step-text)]">
                  {paidIn.primary}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold tabular-nums text-[var(--app-text-muted)]">
                <span>Paid off by</span>
                <span>
                  {monthsPaid}/{originalMonths} mo
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[var(--app-step-text)]/70"
                  style={{
                    width: `${Math.min(100, (monthsPaid / Math.max(1, originalMonths)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-[var(--app-step-text)]/30 bg-[var(--app-step-bg)] px-3 py-2 text-sm font-semibold text-[var(--app-step-text-strong)]">
              {result.monthsSaved} month{result.monthsSaved === 1 ? "" : "s"} saved
              <span className="ml-1.5 font-normal text-[var(--app-step-text)]">
                · {originalMonths} → {monthsPaid} mo
              </span>
            </div>
          </div>
        </div>
      </div>

      <ScheduleTable
        caption="Prepaid schedule"
        meta={`Repaid in month ${monthsPaid}; remaining scheduled months ${monthsPaid + 1}–${originalMonths} not shown.`}
        zebra
        dense
        highlightLastRow
        emphasizeRow={(row) => Number(row.extra ?? 0) > 0}
        columns={[
          { key: "month", header: "Month", sticky: true },
          { key: "emi", header: "EMI", format: "inr", align: "right", tone: "std" },
          { key: "extra", header: "Extra", format: "inr", align: "right", tone: "warn" },
          { key: "interest", header: "Interest", format: "inr", align: "right", tone: "warn" },
          { key: "balance", header: "Balance", format: "inr", align: "right", tone: "step" },
        ]}
        rows={scheduleRows}
      />
    </div>
  );
}

function formatLoanRemaining(months: number): { primary: string; secondary: string } {
  const rounded = Math.max(0, Math.round(months));
  const years = Math.floor(rounded / 12);
  const rem = rounded % 12;
  const primary =
    years === 0 ? `${rem}m` : rem === 0 ? `${years}y` : `${years}y ${rem}m`;
  return {
    primary,
    secondary: `${months.toFixed(1)} months`,
  };
}

function ExtraVsInvestResults({
  result,
  extraAmount,
  extraMonth,
  tenureYears,
  investReturnPct,
}: {
  result: ExtraVsInvestResult;
  extraAmount: number;
  extraMonth: number;
  tenureYears: number;
  investReturnPct: number;
}) {
  const decisionMonth = result.path[0]
    ? Math.min(
        Math.max(1, Math.round(extraMonth)),
        result.path[result.path.length - 1]?.month ?? extraMonth,
      )
    : extraMonth;
  const remaining = formatLoanRemaining(result.remainingMonths);
  const advantage = Math.abs(result.option2Saving - result.option1Saving);
  const investWins = result.option2Saving > result.option1Saving + 1e-6;
  const prepayWins = result.option1Saving > result.option2Saving + 1e-6;
  const tie = !investWins && !prepayWins;
  const originalMonths = tenureYears * 12;
  const debtFreeFaster = result.remainingMonths + decisionMonth < originalMonths;

  const crossover = result.path.find(
    (row) => row.investment > 0 && row.investment >= row.outstandingPrepay,
  );
  const endPoint = result.path[result.path.length - 1];

  const decisionTitle = tie
    ? "Both options deliver a similar financial outcome"
    : investWins
      ? `Investing the extra ${formatINRCurrency(extraAmount)} wins`
      : `Prepaying with the extra ${formatINRCurrency(extraAmount)} wins`;
  const pathReferenceLines = [
    {
      x: decisionMonth,
      label: `Month ${decisionMonth} · Decision`,
      color: "var(--app-text-muted)",
    },
    ...(crossover
      ? [
          {
            x: crossover.month,
            label: "Investment overtakes loan",
            color: "var(--app-chart-gain)",
          },
        ]
      : []),
  ];

  const compareRows: Array<{
    label: string;
    prepay: string;
    invest: string;
  }> = [
    {
      label: "Initial amount",
      prepay: formatINRCurrency(extraAmount),
      invest: formatINRCurrency(extraAmount),
    },
    {
      label: "Loan interest benefit",
      prepay: formatINRCurrency(result.interestSavedVsOriginal),
      invest: "n/a",
    },
    {
      label: "Investment corpus after tax",
      prepay: "n/a",
      invest: formatINRCurrency(result.corpusAfterTax),
    },
    {
      label: "Net cost",
      prepay: formatINRCurrency(result.option1NetCost),
      invest: formatINRCurrency(result.option2NetCost),
    },
    {
      label: "Net saving",
      prepay: formatINRCurrency(result.option1Saving),
      invest: formatINRCurrency(result.option2Saving),
    },
    {
      label: "Remaining loan",
      prepay: `~${remaining.primary}`,
      invest: `${tenureYears}y`,
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
            Which is financially better?
          </div>
          <div className="mt-1 text-sm font-semibold leading-snug text-[var(--app-text)] sm:text-[15px]">
            {decisionTitle}
          </div>
          {!tie ? (
            <div className="mt-1.5 text-[12px] font-semibold tabular-nums text-[var(--app-step-text)]">
              Advantage {formatINRCurrency(advantage)}
              <span className={`ml-1.5 font-normal ${META_TEXT}`}>
                · {formatPercent(investReturnPct, 1)}
                {crossover ? ` · M${crossover.month}` : ""}
              </span>
            </div>
          ) : (
            <div className={`mt-1.5 ${META_TEXT}`}>
              Similar outcomes at {formatPercent(investReturnPct, 1)}
            </div>
          )}
        </div>
        <StatCard
          title="Prepay saving"
          value={result.option1Saving}
          hint={prepayWins ? "Best financial outcome" : debtFreeFaster ? "Debt-free faster" : undefined}
          variant={prepayWins ? "primary" : "soft"}
        />
        <StatCard
          title="Invest saving"
          value={result.option2Saving}
          hint={investWins ? "Best financial outcome" : undefined}
          variant={investWins || tie ? "primary" : "soft"}
        />
      </div>

      <div className={`${RESULTS_SPLIT} gap-3 lg:items-start`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <CompareChart
            title="Prepay vs invest"
            className="min-h-[300px] flex-none sm:min-h-[320px]"
            data={[
              {
                category: "Interest saved",
                sublabel: "By prepaying",
                prepay: result.interestSavedVsOriginal,
                invest: 0,
              },
              {
                category: "After-tax corpus",
                sublabel: "From investing",
                prepay: 0,
                invest: result.corpusAfterTax,
              },
              {
                category: "Net advantage",
                sublabel: "Vs original loan",
                prepay: result.option1Saving,
                invest: result.option2Saving,
              },
            ]}
            series={[
              { key: "prepay", label: "Prepay", color: "var(--app-chart-invested)" },
              { key: "invest", label: "Invest extra", color: "var(--app-chart-gain)" },
            ]}
          />
          <div className="flex flex-col gap-1.5">
            <GrowthChart
              title="Outstanding vs investment"
              className="min-h-[320px] flex-none sm:min-h-[360px]"
              data={result.path.map((row) => ({
                year: row.month,
                outstanding: row.outstandingPrepay,
                investment: row.investment,
              }))}
              series={[
                { key: "outstanding", label: "Loan outstanding", color: "var(--app-chart-tax)" },
                { key: "investment", label: "Investment", color: "var(--app-chart-gain)" },
              ]}
              showEndLabels
              endpointDots
              xTickFormatter={(month) => {
                if (month === decisionMonth) return `M${month}`;
                return monthTickLabel(month, result.path.length);
              }}
              referenceLines={pathReferenceLines}
            />
            <div className={`px-0.5 ${META_TEXT}`}>
              ₹{formatCompactINR(extraAmount)} invested at Month {decisionMonth}
              {endPoint
                ? `. At month ${endPoint.month}: loan ${formatINRCurrency(endPoint.outstandingPrepay)}, investment ${formatINRCurrency(endPoint.investment)}.`
                : "."}
            </div>
          </div>
        </div>

        <div className={`${RESULTS_RIGHT} gap-3`}>
          <ResultCard
            title="Option 1 · Prepay"
            items={[
              {
                label: "Interest after extra",
                value: result.option1Interest,
                hint: `Loan ends in ~${remaining.primary} (${remaining.secondary})`,
              },
              {
                label: "Net loan cost after prepayment",
                value: result.option1NetCost,
                hint: "Loan cost after tax benefit",
              },
              {
                label: "Net saving vs original",
                value: result.option1Saving,
                highlight: prepayWins,
                hint: prepayWins
                  ? "Best financial outcome"
                  : debtFreeFaster
                    ? "Debt-free faster"
                    : undefined,
              },
            ]}
          />
          <ResultCard
            title="Option 2 · Invest"
            accent={investWins}
            items={[
              {
                label: "Corpus after tax",
                value: result.corpusAfterTax,
              },
              {
                label: "Net cost after investment",
                value: result.option2NetCost,
                hint: "Net loan cost less after-tax investment value",
              },
              {
                label: "Net saving vs original",
                value: result.option2Saving,
                highlight: investWins,
                hint: investWins ? "Best financial outcome" : undefined,
              },
            ]}
          />
          <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Decision comparison
            </div>
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--app-border)] text-[10px] uppercase tracking-wider text-[var(--app-text-muted)]">
                  <th className="px-3 py-2 font-semibold">Metric</th>
                  <th className="px-3 py-2 font-semibold">Prepay</th>
                  <th className="px-3 py-2 font-semibold">Invest</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--app-border)] last:border-b-0">
                    <td className="px-3 py-2 text-[var(--app-text-muted)]">{row.label}</td>
                    <td className="px-3 py-2 tabular-nums text-[var(--app-text)]">{row.prepay}</td>
                    <td className="px-3 py-2 tabular-nums text-[var(--app-text)]">{row.invest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryResults({
  result,
  principal,
  baselineYears,
  proposedYears,
}: {
  result: RecoveryResult;
  principal: number;
  baselineYears: number;
  proposedYears: number;
}) {
  const yearsSaved = Math.max(0, baselineYears - proposedYears);
  const interestSaved = Math.max(0, result.baselineInterest - result.proposedInterest);
  const loanPaymentSaved = Math.max(0, result.baselinePaid - result.proposedPaid);
  const totalInvested =
    result.totalInvestedLoanPlusSip ?? result.proposedPaid + result.sipInvested;
  const accelerated = yearsSaved > 0;

  const pathReferenceLines = [
    {
      x: proposedYears,
      label: `${proposedYears}y · Proposed loan ends`,
      color: "var(--app-chart-invested)",
    },
    {
      x: baselineYears,
      label: `${baselineYears}y · Baseline loan ends`,
      color: "var(--app-chart-tax)",
    },
  ];

  const compareRows: Array<{ label: string; baseline: string; proposed: string }> = [
    {
      label: "Tenure",
      baseline: `${baselineYears} yrs`,
      proposed: `${proposedYears} yrs`,
    },
    {
      label: "EMI",
      baseline: formatINRCurrency(result.baselineEmi),
      proposed: formatINRCurrency(result.proposedEmi),
    },
    {
      label: "Monthly SIP",
      baseline: "n/a",
      proposed: formatINRCurrency(result.monthlySip),
    },
    {
      label: "Interest",
      baseline: formatINRCurrency(result.baselineInterest),
      proposed: formatINRCurrency(result.proposedInterest),
    },
    {
      label: "Interest saved",
      baseline: "n/a",
      proposed: formatINRCurrency(interestSaved),
    },
    {
      label: "SIP at horizon",
      baseline: "n/a",
      proposed: formatINRCurrency(result.sipAtHorizon),
    },
    {
      label: "Wealth at horizon",
      baseline: formatINRCurrency(principal),
      proposed: formatINRCurrency(result.totalAssetPlusWealth),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-4 gap-2">
        <div className="relative flex min-h-[5.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-[var(--app-step-text)]/30 bg-[var(--app-step-bg)] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
            Loan shortening strategy
          </div>
          {accelerated ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[var(--app-surface)]/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  Debt-free sooner
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                  {yearsSaved}y earlier
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-[var(--app-step-text)]">
                  {baselineYears}y → {proposedYears}y
                </div>
              </div>
              <div className="rounded-lg bg-[var(--app-surface)]/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  Extra wealth
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                  +{formatINRCurrency(result.additionalWealth)}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-[var(--app-step-text)]">
                  Interest saved {formatINRCurrency(interestSaved)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-sm font-semibold leading-snug text-[var(--app-step-text-strong)]">
              Shorten tenure to accelerate payoff and build SIP wealth
            </div>
          )}
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="Baseline EMI" value={result.baselineEmi} variant="soft" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="Proposed EMI" value={result.proposedEmi} />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Monthly SIP"
            value={result.monthlySip}
            hint={accelerated ? `${yearsSaved}y faster` : undefined}
            variant="soft"
          />
        </div>
      </div>

      <div className={`${RESULTS_SPLIT} gap-3 lg:items-start`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <GrowthChart
            title="Baseline vs proposed wealth path"
            className="h-[420px] min-h-[420px] w-full flex-none sm:h-[460px] sm:min-h-[460px]"
            data={result.schedule.map((row) => ({
              year: row.year,
              baseline: row.baseline,
              sip: row.sip,
              proposed: row.loanPlusSip,
            }))}
            series={[
              { key: "baseline", label: "Baseline loan outstanding", color: "var(--app-chart-tax)" },
              { key: "sip", label: "SIP value", color: "var(--app-chart-gain)" },
              {
                key: "proposed",
                label: "Proposed wealth (loan + SIP)",
                color: "var(--app-chart-invested)",
              },
            ]}
            showEndLabels
            endpointDots
            xTickFormatter={(year) => {
              if (year === proposedYears || year === baselineYears) return `Y${year}`;
              if (year === 1) return "Y1";
              if (year % 5 === 0) return `Y${year}`;
              return "";
            }}
            referenceLines={pathReferenceLines}
          />
          <div className={`px-0.5 ${META_TEXT}`}>
            Accelerated payoff at year {proposedYears}. Baseline repaid at year {baselineYears}.
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Strategy comparison
            </div>
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--app-border)] text-[10px] uppercase tracking-wider text-[var(--app-text-muted)]">
                  <th className="px-3 py-2 font-semibold">Metric</th>
                  <th className="px-3 py-2 font-semibold">Baseline</th>
                  <th className="px-3 py-2 font-semibold">Proposed + SIP</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--app-border)] last:border-b-0">
                    <td className="px-3 py-2 text-[var(--app-text-muted)]">{row.label}</td>
                    <td className="px-3 py-2 tabular-nums text-[var(--app-text)]">{row.baseline}</td>
                    <td className="px-3 py-2 tabular-nums text-[var(--app-text)]">{row.proposed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${RESULTS_RIGHT} gap-3`}>
          <CompareChart
            title="Wealth at horizon"
            className="min-h-[260px] flex-none"
            data={[
              {
                category: "Baseline",
                sublabel: "Asset only",
                asset: principal,
                sip: 0,
              },
              {
                category: "Proposed",
                sublabel: "Asset + SIP",
                asset: principal,
                sip: result.sipAtHorizon,
              },
            ]}
            series={[
              { key: "asset", label: "Asset (principal)", color: "var(--app-chart-invested)" },
              { key: "sip", label: "SIP wealth", color: "var(--app-chart-gain)" },
            ]}
          />
          <div className={`px-0.5 ${META_TEXT}`}>
            Proposed total {formatINRCurrency(result.totalAssetPlusWealth)}. Additional wealth{" "}
            {formatINRCurrency(result.additionalWealth)}.
          </div>
          <ResultCard
            title="Proposed + SIP"
            accent
            items={[
              {
                label: "Tenure",
                displayValue: `${proposedYears} years`,
                hint: accelerated ? `${yearsSaved}y faster` : undefined,
              },
              { label: "EMI", value: result.proposedEmi },
              { label: "Monthly SIP", value: result.monthlySip },
              {
                label: "Interest",
                value: result.proposedInterest,
                hint: `Saved ${formatINRCurrency(interestSaved)}`,
              },
            ]}
          />
          <ResultCard
            title="Horizon outcomes"
            items={[
              {
                label: "Interest saved",
                value: interestSaved,
                highlight: true,
                tone: "gain",
              },
              {
                label: "Loan payments saved",
                value: loanPaymentSaved,
                hint: "Baseline paid less proposed loan paid",
              },
              {
                label: "SIP at horizon",
                value: result.sipAtHorizon,
              },
              {
                label: "Additional wealth at horizon",
                value: result.additionalWealth,
                highlight: true,
                tone: "gain",
              },
              {
                label: "Total money invested",
                value: totalInvested,
                hint: "Proposed loan payments + SIP contributions",
              },
              {
                label: "Asset + wealth",
                value: result.totalAssetPlusWealth,
              },
            ]}
          />
          <ResultCard
            title="Baseline"
            items={[
              { label: "Tenure", displayValue: `${baselineYears} years` },
              { label: "EMI", value: result.baselineEmi },
              { label: "Interest", value: result.baselineInterest },
              { label: "Total paid", value: result.baselinePaid },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function VehicleResults({
  result,
  returnsByOption,
}: {
  result: VehicleResult;
  returnsByOption: Record<string, number | null>;
}) {
  const ranked = [...result.options].sort(
    (a, b) => b.financialBenefit - a.financialBenefit,
  );
  const rankByName = Object.fromEntries(
    ranked.map((opt, index) => [opt.name, index + 1]),
  ) as Record<string, number>;
  const best =
    result.options.find((opt) => opt.name === result.best) ?? ranked[0] ?? null;
  const noLoan = result.options.find((opt) => opt.name === "No loan");
  const vsNoLoan =
    best && noLoan ? best.financialBenefit - noLoan.financialBenefit : 0;
  const lastDep = result.depreciation[result.depreciation.length - 1];
  const depRows: Array<Record<string, unknown>> = [
    ...result.depreciation.map((row) => ({ ...row })),
    {
      year: "Total",
      value: null,
      depreciation: result.totalDepreciation,
      balance: lastDep?.balance ?? 0,
    },
  ];

  const compareData = result.options.map((opt) => {
    const returnPct = returnsByOption[opt.name];
    const rank = rankByName[opt.name] ?? 0;
    const isBest = best?.name === opt.name;
    return {
      category: opt.name,
      benefit: opt.financialBenefit,
      sublabel:
        returnPct == null
          ? `Rank #${rank}`
          : `${formatPercent(returnPct, 0)} · #${rank}`,
      fill: isBest ? "var(--app-chart-gain)" : "var(--app-chart-invested)",
      tooltipDetails: [
        ...(returnPct == null
          ? []
          : [{ label: "Return", value: formatPercent(returnPct, 1) }]),
        ...(opt.maturity > 0
          ? [
              {
                label: "Investment value",
                value: formatINRCurrency(opt.maturity),
              },
            ]
          : []),
        ...(opt.netProfit > 0 || opt.name !== "No loan"
          ? [
              {
                label: "Net profit",
                value: formatINRCurrency(opt.netProfit),
              },
            ]
          : []),
        { label: "Rank", value: `#${rank}` },
      ],
    };
  });

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-1 gap-2 min-[640px]:grid-cols-3">
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="EMI" value={result.emi} />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Total tax saved"
            value={result.totalTaxSaved}
            hint="Loan interest + depreciation"
            variant="soft"
          />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Best financial benefit"
            value={best?.financialBenefit ?? 0}
            hint={best ? `${best.name} · Rank #1` : undefined}
          />
        </div>
      </div>

      {best ? (
        <div className="relative flex min-h-[5.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-[var(--app-step-text)]/30 bg-[var(--app-step-bg)] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
            Highest financial benefit
          </div>
          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-[var(--app-step-text-strong)]">
                {best.name} provides the highest financial benefit
              </div>
              <div className="mt-0.5 text-[12px] tabular-nums text-[var(--app-step-text)]">
                {formatINRCurrency(best.financialBenefit)}
                {vsNoLoan > 0 && noLoan ? (
                  <span className="ml-1.5 font-normal">
                    · {formatINRCurrency(vsNoLoan)} above No loan
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-md bg-[var(--app-surface)]/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[var(--app-step-text-strong)]">
              Rank #1
            </div>
          </div>
        </div>
      ) : null}

      <div className={`${RESULTS_SPLIT} gap-3 lg:items-start`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <CompareChart
            title="Financial benefit"
            className="min-h-[280px] flex-none sm:min-h-[300px]"
            data={compareData}
            series={[{ key: "benefit", label: "Financial benefit", color: "var(--app-chart-gain)" }]}
            showBarLabels
            showLegend={false}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Bars ranked by financial benefit. Hover for return, investment value, and net profit.
          </div>

          <StackedBarChart
            title="Tax shield vs opportunity vs net"
            className="min-h-[260px] flex-none"
            data={result.stacked}
            series={[
              { key: "taxShield", label: "Tax shield", color: "var(--app-chart-invested)" },
              { key: "opportunity", label: "Opportunity", color: "var(--app-chart-gain)" },
              { key: "netBenefit", label: "Net benefit", color: "var(--app-chart-tax)" },
            ]}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Tax shield = tax benefit from financing. Opportunity = investment gain after tax. Net
            benefit = final financial benefit for each option.
          </div>
        </div>

        <div className={`${RESULTS_RIGHT} gap-3`}>
          <ResultCard
            title="Loan summary"
            items={[
              { label: "EMI", value: result.emi },
              { label: "Interest paid", value: result.totalInterest },
              { label: "Total depreciation", value: result.totalDepreciation },
              {
                label: "Total tax saved",
                value: result.totalTaxSaved,
                highlight: true,
                tone: "gain",
              },
              ...(best
                ? [
                    {
                      label: `${best.name} benefit`,
                      value: best.financialBenefit,
                      hint: "Rank #1",
                      highlight: true,
                      tone: "gain" as const,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
          Investment option comparison
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[var(--app-border)] text-[10px] uppercase tracking-wider text-[var(--app-text-muted)]">
                <th className="px-3 py-2 font-semibold">Option</th>
                <th className="px-3 py-2 font-semibold">Return</th>
                <th className="px-3 py-2 text-right font-semibold">Investment value</th>
                <th className="px-3 py-2 text-right font-semibold">Net profit</th>
                <th className="px-3 py-2 text-right font-semibold">Financial benefit</th>
                <th className="px-3 py-2 text-right font-semibold">Rank</th>
              </tr>
            </thead>
            <tbody>
              {result.options.map((opt) => {
                const rank = rankByName[opt.name] ?? 0;
                const returnPct = returnsByOption[opt.name];
                const isBest = best?.name === opt.name;
                return (
                  <tr
                    key={opt.name}
                    className={`border-b border-[var(--app-border)] last:border-b-0 ${
                      isBest
                        ? "bg-[var(--app-step-bg)] font-semibold"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-[var(--app-text)]">
                      {opt.name}
                      {isBest ? (
                        <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                          Best
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[var(--app-text)]">
                      {returnPct == null ? "—" : formatPercent(returnPct, 0)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--app-text)]">
                      {opt.maturity > 0 ? formatINRCurrency(opt.maturity) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--app-text)]">
                      {opt.name === "No loan" && opt.netProfit === 0
                        ? "—"
                        : formatINRCurrency(opt.netProfit)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        isBest
                          ? "text-[var(--app-step-text-strong)]"
                          : "text-[var(--app-text)]"
                      }`}
                    >
                      {formatINRCurrency(opt.financialBenefit)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        isBest
                          ? "text-[var(--app-step-text-strong)]"
                          : "text-[var(--app-text-muted)]"
                      }`}
                    >
                      #{rank}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ScheduleTable
        caption="Depreciation"
        meta={`Total depreciation ${formatINRCurrency(result.totalDepreciation)}`}
        zebra
        dense
        highlightLastRow
        columns={[
          { key: "year", header: "Year", sticky: true },
          {
            key: "value",
            header: "Value",
            align: "right",
            tone: "std",
            render: (value) =>
              typeof value === "number" ? formatINRCurrency(value) : "—",
          },
          {
            key: "depreciation",
            header: "Depreciation",
            format: "inr",
            align: "right",
            tone: "warn",
          },
          {
            key: "balance",
            header: "Balance",
            format: "inr",
            align: "right",
            tone: "step",
          },
        ]}
        rows={depRows}
      />
    </div>
  );
}
