"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, BarChart3, PieChart, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePdfFromElement } from "@/lib/pdf-generator";
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
  VEHICLE_LOAN_REPORT_ID,
  VehicleLoanDossier,
} from "@/components/reports/vehicle-loan-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import {
  AgeInput,
  ageError,
  BentoGroup,
  BentoSection,
  ChartPane,
  ClientProfileBar,
  CompareChart,
  ComplianceFootnote,
  CompositionChart,
  emailError,
  Field,
  formatCompactINR,
  formatINRCurrency,
  formatPercent,
  GrowthChart,
  META_TEXT,
  MoneyInput,
  nameError,
  PercentInput,
  phoneError,
  rateError,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ResultsSection,
  ScheduleTable,
  Stack,
  StackedAreaChart,
  StackedBarChart,
  StatCard,
  StatusNote,
  SegmentedChartControl,
  TextInput,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";

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
  taxOnInterest: number;
  taxOnDepreciation: number;
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

const MODE_COPY: Record<
  Mode,
  { description: string; strategy: string; goal: string; assumptions: string }
> = {
  emi: {
    description: "Monthly EMI, amortisation, and the SIP needed to offset total loan interest.",
    strategy: "EMI amortisation",
    goal: "Interest recovery SIP",
    assumptions: "Principal, tenure, rate, and recover-return assumptions for EMI and interest SIP",
  },
  prepay: {
    description: "Annual extra payments versus the scheduled loan, with interest and tenure savings.",
    strategy: "Annual prepayment",
    goal: "Interest and tenure savings",
    assumptions: "Loan terms, yearly extra payment, and investment return used to recover interest",
  },
  "extra-vs-invest": {
    description: "Compare using a lump-sum extra to prepay the loan versus investing it instead.",
    strategy: "Prepay vs invest",
    goal: "Extra payment decision",
    assumptions: "Loan terms, extra payment timing, investment return, and tax assumptions",
  },
  recovery: {
    description: "Shorten tenure, raise EMI, and redirect the difference into a recovery SIP.",
    strategy: "Tenure acceleration",
    goal: "Interest recovery wealth",
    assumptions: "Baseline versus proposed tenure and SIP return for interest recovery",
  },
  vehicle: {
    description: "Compare financing paths for a vehicle purchase, including tax shield and invested loan proceeds.",
    strategy: "Vehicle financing",
    goal: "Best net benefit",
    assumptions: "On-road cost, loan terms, depreciation, and option return or tax assumptions",
  },
};

export function LoansCalculator() {
  const [mode] = useCalculatorMode(MODE_IDS, "emi");
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(40);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);

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

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const contactErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
  ].filter((msg): msg is string => Boolean(msg));

  const emiPrincipalError =
    principal <= 0 ? "Enter a principal greater than zero." : undefined;
  const emiYearsError =
    years <= 0
      ? "Enter a loan tenure greater than zero."
      : years > 50
        ? "Loan tenure cannot exceed 50 years."
        : undefined;
  const emiInterestError =
    rateError(interest, "Loan interest rate") ??
    (interest <= 0 ? "Loan interest rate must be above 0%." : undefined);
  const emiRecoverError =
    rateError(emiRecoverReturn, "Investment return") ??
    (emiRecoverReturn <= 0 ? "Investment return must be above 0%." : undefined);
  const emiDelayError =
    emiDelayMonths < 0
      ? "Delay cannot be negative."
      : emiDelayMonths >= years * 12
        ? "Delay must leave at least one investment month within the loan term."
        : undefined;
  const emiFieldErrors = [
    ...contactErrors,
    emiPrincipalError,
    emiYearsError,
    emiInterestError,
    emiRecoverError,
    emiDelayError,
  ].filter((msg): msg is string => Boolean(msg));

  const vsTermMonths = Math.round(vsYears * 12);
  const vsPrincipalError =
    !(vsPrincipal > 0) ? "Loan principal must be greater than 0." : undefined;
  const vsYearsError =
    !(vsYears > 0) ? "Tenure must be greater than 0." : undefined;
  const vsRateError =
    rateError(vsRate, "Loan interest rate") ??
    (vsRate <= 0 ? "Loan interest rate must be above 0%." : undefined);
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
    rateError(investReturn, "Investment return") ??
    (investReturn <= 0 ? "Investment return must be above 0%." : undefined);
  const vsCgTaxError = rateError(cgTax, "Capital gains tax");
  const vsIncomeTaxError = rateError(incomeTax, "Income tax rate");
  const vsFieldErrors = [
    ...contactErrors,
    vsPrincipalError,
    vsYearsError,
    vsRateError,
    vsExtraError,
    vsExtraMonthError,
    vsInvestError,
    vsCgTaxError,
    vsIncomeTaxError,
  ].filter((msg): msg is string => Boolean(msg));

  const recPrincipalError =
    !(recPrincipal > 0) ? "Loan principal must be greater than 0." : undefined;
  const recYearsError =
    !(recYears > 0) ? "Baseline tenure must be greater than 0." : undefined;
  const recRateError =
    rateError(recRate, "Loan interest rate") ??
    (recRate <= 0 ? "Loan interest rate must be above 0%." : undefined);
  const recProposedError =
    !(proposedYears > 0)
      ? "Proposed tenure must be greater than 0."
      : proposedYears >= recYears
        ? "Proposed tenure must be shorter than the baseline tenure."
        : undefined;
  const recSipError =
    rateError(sipReturn, "SIP return") ??
    (sipReturn <= 0 ? "SIP return must be above 0%." : undefined);
  const recFieldErrors = [
    ...contactErrors,
    recPrincipalError,
    recYearsError,
    recRateError,
    recProposedError,
    recSipError,
  ].filter((msg): msg is string => Boolean(msg));

  const prepayPrincipalError =
    !(prepayPrincipal > 0) ? "Loan principal must be greater than 0." : undefined;
  const prepayYearsError =
    !(prepayYears > 0) ? "Loan tenure must be greater than 0." : undefined;
  const prepayRateError =
    rateError(prepayRate, "Loan interest rate") ??
    (prepayRate <= 0 ? "Loan interest rate must be above 0%." : undefined);
  const prepayExtraError =
    yearlyExtra < 0
      ? "Yearly extra payment cannot be negative."
      : yearlyExtra > prepayPrincipal
        ? "Yearly extra payment cannot exceed the loan principal."
        : undefined;
  const prepayRecoverError =
    rateError(recoverReturn, "Investment return") ??
    (recoverReturn <= 0 ? "Investment return must be above 0%." : undefined);
  const prepayFieldErrors = [
    ...contactErrors,
    prepayPrincipalError,
    prepayYearsError,
    prepayRateError,
    prepayExtraError,
    prepayRecoverError,
  ].filter((msg): msg is string => Boolean(msg));

  const vehOnRoadError =
    !(onRoad > 0) ? "On-road cost must be greater than 0." : undefined;
  const vehLoanError =
    vehLoan < 0
      ? "Loan amount cannot be negative."
      : vehLoan > onRoad
        ? "Loan amount cannot exceed on-road cost."
        : undefined;
  const vehRateError =
    rateError(vehRate, "Loan interest rate") ??
    (vehRate <= 0 ? "Loan interest rate must be above 0%." : undefined);
  const vehYearsError =
    !(vehYears > 0) ? "Loan tenure must be greater than 0." : undefined;
  const vehTaxError = rateError(vehTax, "Income tax rate");
  const depPctError = rateError(depPct, "Depreciation rate");
  const fdRetError = rateError(fdRet, "FD return");
  const debtRetError = rateError(debtRet, "MF debt return");
  const consRetError = rateError(consRet, "Conservative return");
  const eqRetError = rateError(eqRet, "Equity return");
  const fdTaxError = rateError(fdTax, "FD tax rate");
  const debtTaxError = rateError(debtTax, "MF debt tax rate");
  const consTaxError = rateError(consTax, "Conservative tax rate");
  const eqTaxError = rateError(eqTax, "Equity tax rate");
  const vehFieldErrors = [
    ...contactErrors,
    vehOnRoadError,
    vehLoanError,
    vehRateError,
    vehYearsError,
    vehTaxError,
    depPctError,
    fdRetError,
    debtRetError,
    consRetError,
    eqRetError,
    fdTaxError,
    debtTaxError,
    consTaxError,
    eqTaxError,
  ].filter((msg): msg is string => Boolean(msg));

  const fieldErrors =
    mode === "emi"
      ? emiFieldErrors
      : mode === "prepay"
        ? prepayFieldErrors
        : mode === "extra-vs-invest"
          ? vsFieldErrors
          : mode === "recovery"
            ? recFieldErrors
            : vehFieldErrors;
  const canCalculate = fieldErrors.length === 0;

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
    canCalculate,
  );

  const [isDownloading, setIsDownloading] = useState(false);

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(40);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);

    if (mode === "emi") {
      setPrincipal(7_500_000);
      setYears(20);
      setInterest(9.2);
      setEmiRecoverReturn(12);
      setEmiDelayMonths(12);
      return;
    }
    if (mode === "prepay") {
      setPrepayPrincipal(15_000_000);
      setPrepayYears(5);
      setPrepayRate(10);
      setYearlyExtra(318705.67);
      setRecoverReturn(12);
      return;
    }
    if (mode === "extra-vs-invest") {
      setVsPrincipal(20_000_000);
      setVsYears(20);
      setVsRate(8.5);
      setExtraAmount(5_000_000);
      setExtraMonth(49);
      setInvestReturn(9);
      setCgTax(12.5);
      setIncomeTax(20);
      return;
    }
    if (mode === "recovery") {
      setRecPrincipal(20_000_000);
      setRecYears(20);
      setRecRate(8.5);
      setProposedYears(15);
      setSipReturn(12);
      return;
    }
    setOnRoad(3_500_000);
    setVehLoan(2_800_000);
    setVehRate(8.5);
    setVehYears(5);
    setVehTax(20);
    setDepPct(15);
    setFdRet(7);
    setDebtRet(8);
    setConsRet(9);
    setEqRet(12);
    setFdTax(20);
    setDebtTax(25);
    setConsTax(12.5);
    setEqTax(12.5);
  };

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

    if (mode === "vehicle") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          VEHICLE_LOAN_REPORT_ID,
          `vehicle-loan-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/loans", mode)}
      description={MODE_COPY[mode].description}
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
      header={
        <ClientProfileBar
          name={name}
          age={age}
          email={email}
          phone={phone}
          strategy={MODE_COPY[mode].strategy}
          goal={MODE_COPY[mode].goal}
        />
      }
      form={
        <BentoSection
          sectionId="01"
          title="Financial Assumptions & Modeling Suite"
          description={MODE_COPY[mode].assumptions}
          collapsible
          open={openAssumptions}
          onToggle={() => setOpenAssumptions((v) => !v)}
          actions={
            <button
              type="button"
              onClick={resetDefaults}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-emerald-700"
            >
              Reset to Baseline
            </button>
          }
        >
          <BentoGroup
            num="01"
            title="Investor Profile"
            colSpan={4}
            footer={
              <>
                <span>Horizon:</span>
                <span className="font-bold text-slate-700">
                  {age} →{" "}
                  {age +
                    (mode === "emi"
                      ? years
                      : mode === "prepay"
                        ? prepayYears
                        : mode === "extra-vs-invest"
                          ? vsYears
                          : mode === "recovery"
                            ? recYears
                            : vehYears)}
                </span>
              </>
            }
          >
            <div className="mb-4">
              <Field label="Client Name" error={clientNameError}>
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={clientNameError ? "border-[var(--app-danger)]" : undefined}
                />
              </Field>
            </div>
            <div className="mb-4">
              <AgeInput value={age} onChange={setAge} error={clientAgeError} />
            </div>
            <div className="mb-4">
              <Field label="Email" error={clientEmailError}>
                <TextInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@email.com"
                  className={clientEmailError ? "border-[var(--app-danger)]" : undefined}
                />
              </Field>
            </div>
            <Field label="Phone" error={clientPhoneError}>
              <TextInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={clientPhoneError ? "border-[var(--app-danger)]" : undefined}
              />
            </Field>
          </BentoGroup>

          {mode === "emi" ? (
            <>
              <BentoGroup
                num="02"
                title="Loan Parameters"
                colSpan={5}
                footer={
                  <>
                    <span>Term:</span>
                    <span className="font-bold text-emerald-700">{years} years</span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <MoneyInput
                    label="Principal"
                    value={principal}
                    onChange={setPrincipal}
                    error={emiPrincipalError}
                    align="right"
                  />
                </div>
                <div className="mb-3.5">
                  <YearInput
                    label="Tenure"
                    value={years}
                    min={1}
                    max={50}
                    onChange={setYears}
                    error={emiYearsError}
                  />
                </div>
                <PercentInput
                  label="Loan rate"
                  value={interest}
                  onChange={setInterest}
                  error={emiInterestError}
                />
              </BentoGroup>
              <BentoGroup
                num="03"
                title="Rate Assumptions"
                subtitle="Recover & Delay"
                colSpan={3}
                footer={
                  <>
                    <span>Recover:</span>
                    <span className="font-bold text-emerald-700">{emiRecoverReturn}%</span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <PercentInput
                    label="Recover return"
                    value={emiRecoverReturn}
                    onChange={setEmiRecoverReturn}
                    error={emiRecoverError}
                  />
                </div>
                <YearInput
                  label="Delay (mo)"
                  value={emiDelayMonths}
                  min={0}
                  max={Math.max(0, years * 12 - 1)}
                  onChange={setEmiDelayMonths}
                  error={emiDelayError}
                />
              </BentoGroup>
            </>
          ) : mode === "prepay" ? (
            <>
              <BentoGroup
                num="02"
                title="Loan Parameters"
                colSpan={5}
                footer={
                  <>
                    <span>Extra:</span>
                    <span className="font-bold text-emerald-700">yearly</span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <MoneyInput
                    label="Loan principal"
                    value={prepayPrincipal}
                    onChange={setPrepayPrincipal}
                    error={prepayPrincipalError}
                  />
                </div>
                <div className="mb-3.5">
                  <YearInput
                    label="Loan tenure"
                    value={prepayYears}
                    min={1}
                    max={50}
                    onChange={setPrepayYears}
                    error={prepayYearsError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Loan interest (%)"
                    value={prepayRate}
                    onChange={setPrepayRate}
                    error={prepayRateError}
                  />
                </div>
                <MoneyInput
                  label="Yearly extra payment"
                  value={yearlyExtra}
                  onChange={setYearlyExtra}
                  error={prepayExtraError}
                  wrapLabel
                />
              </BentoGroup>
              <BentoGroup
                num="03"
                title="Rate Assumptions"
                subtitle="Recover Return"
                colSpan={3}
                footer={
                  <>
                    <span>Return:</span>
                    <span className="font-bold text-emerald-700">{recoverReturn}%</span>
                  </>
                }
              >
                <PercentInput
                  label="Investment return (%)"
                  value={recoverReturn}
                  onChange={setRecoverReturn}
                  error={prepayRecoverError}
                  wrapLabel
                />
              </BentoGroup>
            </>
          ) : mode === "extra-vs-invest" ? (
            <>
              <BentoGroup
                num="02"
                title="Loan Parameters"
                colSpan={5}
                footer={
                  <>
                    <span>Extra at:</span>
                    <span className="font-bold text-emerald-700">M{extraMonth}</span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <MoneyInput
                    label="Loan principal"
                    value={vsPrincipal}
                    onChange={setVsPrincipal}
                    error={vsPrincipalError}
                  />
                </div>
                <div className="mb-3.5">
                  <YearInput
                    value={vsYears}
                    min={1}
                    max={50}
                    onChange={setVsYears}
                    error={vsYearsError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Loan interest (%)"
                    value={vsRate}
                    onChange={setVsRate}
                    error={vsRateError}
                  />
                </div>
                <div className="mb-3.5">
                  <MoneyInput
                    label="Extra payment"
                    value={extraAmount}
                    onChange={setExtraAmount}
                    error={vsExtraError}
                  />
                </div>
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
              </BentoGroup>
              <BentoGroup
                num="03"
                title="Rate Assumptions"
                subtitle="Return & Tax"
                colSpan={3}
                footer={
                  <>
                    <span>Invest:</span>
                    <span className="font-bold text-emerald-700">{investReturn}%</span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <PercentInput
                    label="Investment return (%)"
                    value={investReturn}
                    onChange={setInvestReturn}
                    error={vsInvestError}
                    wrapLabel
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Capital gains tax (%)"
                    value={cgTax}
                    onChange={setCgTax}
                    error={vsCgTaxError}
                    wrapLabel
                  />
                </div>
                <PercentInput
                  label="Income tax rate (%)"
                  value={incomeTax}
                  onChange={setIncomeTax}
                  error={vsIncomeTaxError}
                  wrapLabel
                />
              </BentoGroup>
            </>
          ) : mode === "recovery" ? (
            <>
              <BentoGroup
                num="02"
                title="Loan Parameters"
                colSpan={5}
                footer={
                  <>
                    <span>Path:</span>
                    <span className="font-bold text-emerald-700">
                      {recYears}y → {proposedYears}y
                    </span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <MoneyInput
                    label="Loan principal"
                    value={recPrincipal}
                    onChange={setRecPrincipal}
                    error={recPrincipalError}
                  />
                </div>
                <div className="mb-3.5">
                  <YearInput
                    label="Baseline tenure"
                    value={recYears}
                    min={1}
                    max={50}
                    onChange={setRecYears}
                    error={recYearsError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Loan interest (%)"
                    value={recRate}
                    onChange={setRecRate}
                    error={recRateError}
                  />
                </div>
                <YearInput
                  label="Proposed tenure"
                  value={proposedYears}
                  min={1}
                  max={Math.max(1, recYears - 1)}
                  onChange={setProposedYears}
                  error={recProposedError}
                />
              </BentoGroup>
              <BentoGroup
                num="03"
                title="Rate Assumptions"
                subtitle="SIP Return"
                colSpan={3}
                footer={
                  <>
                    <span>SIP:</span>
                    <span className="font-bold text-emerald-700">{sipReturn}%</span>
                  </>
                }
              >
                <PercentInput
                  label="SIP return (%)"
                  value={sipReturn}
                  onChange={setSipReturn}
                  error={recSipError}
                />
              </BentoGroup>
            </>
          ) : (
            <>
              <BentoGroup
                num="02"
                title="Loan Parameters"
                colSpan={5}
                footer={
                  <>
                    <span>Finance:</span>
                    <span className="font-bold text-emerald-700">{vehYears}y loan</span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <MoneyInput
                    label="On-road cost"
                    value={onRoad}
                    onChange={setOnRoad}
                    error={vehOnRoadError}
                  />
                </div>
                <div className="mb-3.5">
                  <MoneyInput
                    label="Loan amount"
                    value={vehLoan}
                    onChange={setVehLoan}
                    error={vehLoanError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Loan interest (%)"
                    value={vehRate}
                    onChange={setVehRate}
                    error={vehRateError}
                  />
                </div>
                <div className="mb-3.5">
                  <YearInput
                    label="Tenure"
                    value={vehYears}
                    min={1}
                    max={15}
                    onChange={setVehYears}
                    error={vehYearsError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Income tax (%)"
                    value={vehTax}
                    onChange={setVehTax}
                    error={vehTaxError}
                  />
                </div>
                <PercentInput
                  label="Depreciation (%)"
                  value={depPct}
                  onChange={setDepPct}
                  error={depPctError}
                />
              </BentoGroup>
              <BentoGroup
                num="03"
                title="Rate Assumptions"
                subtitle="Options & Tax"
                colSpan={3}
                footer={
                  <>
                    <span>Equity:</span>
                    <span className="font-bold text-emerald-700">{eqRet}%</span>
                  </>
                }
              >
                <div className="mb-3.5">
                  <PercentInput
                    label="FD return (%)"
                    value={fdRet}
                    onChange={setFdRet}
                    error={fdRetError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="FD tax (%)"
                    value={fdTax}
                    onChange={setFdTax}
                    error={fdTaxError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="MF debt return (%)"
                    value={debtRet}
                    onChange={setDebtRet}
                    error={debtRetError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="MF debt tax (%)"
                    value={debtTax}
                    onChange={setDebtTax}
                    error={debtTaxError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Cons. return (%)"
                    value={consRet}
                    onChange={setConsRet}
                    error={consRetError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Cons. tax (%)"
                    value={consTax}
                    onChange={setConsTax}
                    error={consTaxError}
                  />
                </div>
                <div className="mb-3.5">
                  <PercentInput
                    label="Equity return (%)"
                    value={eqRet}
                    onChange={setEqRet}
                    error={eqRetError}
                  />
                </div>
                <PercentInput
                  label="Equity tax (%)"
                  value={eqTax}
                  onChange={setEqTax}
                  error={eqTaxError}
                />
              </BentoGroup>
            </>
          )}
        </BentoSection>
      }
      results={
        <div className="flex flex-col gap-3">
          {!canCalculate ? (
            <StatusNote tone="error">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  Fix the inputs above to refresh the calculation
                  {result ? ". Showing the last valid result." : "."}
                </span>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] font-normal">
                  {fieldErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            </StatusNote>
          ) : null}
          {error ? <StatusNote tone="error">{error}</StatusNote> : null}
          {loading && !result && canCalculate ? (
            <StatusNote tone="pending">Calculating…</StatusNote>
          ) : null}
          {result && mode === "emi" && Array.isArray(result.schedule) ? (
            <EmiResults
              result={result as EmiResult}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
            />
          ) : null}
          {result && mode === "prepay" && Array.isArray(result.originalSchedule) ? (
            <PrepayResults
              result={result as PrepayResult}
              yearlyExtra={yearlyExtra}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
            />
          ) : null}
          {result && mode === "extra-vs-invest" && Array.isArray(result.path) ? (
            <ExtraVsInvestResults
              result={result as ExtraVsInvestResult}
              extraAmount={extraAmount}
              extraMonth={extraMonth}
              tenureYears={vsYears}
              investReturnPct={investReturn}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
            />
          ) : null}
          {result && mode === "recovery" && result.baselineEmi != null ? (
            <RecoveryResults
              result={result as RecoveryResult}
              principal={recPrincipal}
              baselineYears={recYears}
              proposedYears={proposedYears}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
            />
          ) : null}
          {result && mode === "vehicle" && Array.isArray(result.depreciation) ? (
            <VehicleResults
              result={result as VehicleResult}
              onRoadCost={onRoad}
              loanAmount={vehLoan}
              returnsByOption={{
                "No loan": null,
                FD: fdRet,
                "MF debt": debtRet,
                Conservative: consRet,
                Equity: eqRet,
              }}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
            />
          ) : null}
        </div>
      }
      footer={
        <ComplianceFootnote>
          Calculations shown are for illustration purposes only. Loan EMIs, interest savings, and
          investment outcomes depend on assumed rates, taxes, and lender terms. Actual results can
          differ.
        </ComplianceFootnote>
      }
    />
    {mode === "emi" && result && Array.isArray(result.schedule) ? (
      <LoanEmiDossier
        data={{
          clientName: name,
          age,
          email,
          phone,
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
          email,
          phone,
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
          email,
          phone,
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
          email,
          phone,
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
    {mode === "vehicle" && result && Array.isArray(result.depreciation) ? (
      <VehicleLoanDossier
        data={{
          clientName: name,
          age,
          email,
          phone,
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
          emi: result.emi ?? 0,
          totalInterest: result.totalInterest ?? 0,
          totalDepreciation: result.totalDepreciation ?? 0,
          taxOnInterest: result.taxOnInterest ?? 0,
          taxOnDepreciation: result.taxOnDepreciation ?? 0,
          totalTaxSaved: result.totalTaxSaved ?? 0,
          best: result.best ?? null,
          options: (result.options as VehicleOptionRow[]) ?? [],
          stacked: result.stacked ?? [],
          depreciation: result.depreciation,
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

function EmiResults({
  result,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
}: {
  result: EmiResult;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
}) {
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
    <Stack>
      <ResultsSection
        sectionId="02"
        title="Loan Payment Milestones"
        description="EMI, lifetime interest, recover SIP, and payoff timeline"
        open={openMilestones}
        onToggle={onToggleMilestones}
        meta={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {totalMonths} months
          </span>
        }
      >
      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
        <StatCard title="EMI" value={result.emi} tone="neutral" />
        <StatCard title="Total interest" value={result.totalInterest} tone="negative" />
        <StatCard title="Total paid" value={result.totalPaid} tone="neutral" />
      </div>

      {first ? (
        <div className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-2">
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

      <div className={`${RESULTS_SPLIT} mt-3 gap-2.5`}>
        <div className={`${RESULTS_LEFT} gap-2.5`}>
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
        </div>
        <div className={`${RESULTS_RIGHT} gap-2.5`}>
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
      </ResultsSection>

      <ResultsSection
        sectionId="03"
        title="Loan Analytics"
        description="Payment mix, balance path, and full amortisation schedule"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
      >
          <SegmentedChartControl
            variant="pill"
            tabs={[
              {
                id: "payments",
                label: "Payments",
                icon: <BarChart3 className="h-3.5 w-3.5" />,
                content: (
                  <ChartPane>
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
                  </ChartPane>
                )
              },
              {
                id: "mix",
                label: "Mix",
                icon: <PieChart className="h-3.5 w-3.5" />,
                content: (
                  <ChartPane>
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
                  </ChartPane>
                )
              },
              {
                id: "balance",
                label: "Balance",
                icon: <LineChart className="h-3.5 w-3.5" />,
                content: (
                  <ChartPane>
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
                  </ChartPane>
                )
              }
            ]}
          />

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
      </ResultsSection>
    </Stack>
  );
}

function PrepayResults({
  result,
  yearlyExtra,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
}: {
  result: PrepayResult;
  yearlyExtra: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
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
    <Stack>
      <ResultsSection
        sectionId="02"
        title="Prepayment Milestones"
        description="Interest saved, time saved, and yearly extra payment timeline"
        open={openMilestones}
        onToggle={onToggleMilestones}
        meta={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {monthsPaid} of {originalMonths} mo
          </span>
        }
      >
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
          <StatCard title="Interest saved" value={result.interestSaved} tone="positive" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="Total extra payments" value={result.totalExtra} tone="neutral" />
        </div>
        <div className="flex min-h-[5.5rem] min-w-0 flex-col justify-center rounded-2xl border-[1.5px] border-dashed border-emerald-500 bg-[linear-gradient(180deg,rgba(236,253,245,0.45)_0%,rgba(255,255,255,0.95)_100%)] px-5 py-5 sm:px-6">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Time saved
          </div>
          <div className="mt-2 text-2xl font-extrabold leading-tight tabular-nums text-slate-900 sm:text-3xl">
            {originalMonths} → {monthsPaid} mo
          </div>
          <div className="mt-2 text-xs font-medium text-emerald-800/80">
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
      </ResultsSection>

      <ResultsSection
        sectionId="03"
        title="Prepayment Analytics"
        description="Outstanding path, interest compare, and prepaid schedule"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
      >
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
      </ResultsSection>
    </Stack>
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
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
}: {
  result: ExtraVsInvestResult;
  extraAmount: number;
  extraMonth: number;
  tenureYears: number;
  investReturnPct: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
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
    <Stack>
      <ResultsSection
        sectionId="02"
        title="Decision Milestones"
        description="Prepay versus invest savings and which path wins on net outcome"
        open={openMilestones}
        onToggle={onToggleMilestones}
        meta={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Extra at M{decisionMonth}
          </span>
        }
      >
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
      </ResultsSection>

      <ResultsSection
        sectionId="03"
        title="Decision Analytics"
        description="Compare charts, outstanding versus investment path, and option cards"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
      >
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
            <div className="overflow-x-auto">
              <table className="mx-auto w-max max-w-full border-collapse text-left text-[12px]">
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
      </ResultsSection>
    </Stack>
  );
}

function RecoveryResults({
  result,
  principal,
  baselineYears,
  proposedYears,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
}: {
  result: RecoveryResult;
  principal: number;
  baselineYears: number;
  proposedYears: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
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
    <Stack>
      <ResultsSection
        sectionId="02"
        title="Recovery Milestones"
        description="Baseline versus proposed EMI and the SIP redirected from tenure savings"
        open={openMilestones}
        onToggle={onToggleMilestones}
        meta={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {baselineYears}y → {proposedYears}y
          </span>
        }
      >
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
          <StatCard title="Baseline EMI" value={result.baselineEmi} tone="neutral" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="Proposed EMI" value={result.proposedEmi} tone="default" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Monthly SIP"
            value={result.monthlySip}
            hint={accelerated ? `${yearsSaved}y faster` : undefined}
            tone="positive"
          />
        </div>
      </div>
      </ResultsSection>

      <ResultsSection
        sectionId="03"
        title="Recovery Analytics"
        description="Wealth path, horizon compare, and baseline versus proposed detail cards"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
      >
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
            <div className="overflow-x-auto">
              <table className="mx-auto w-max max-w-full border-collapse text-left text-[12px]">
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
      </ResultsSection>
    </Stack>
  );
}

function VehicleResults({
  result,
  onRoadCost,
  loanAmount,
  returnsByOption,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
}: {
  result: VehicleResult;
  onRoadCost: number;
  loanAmount: number;
  returnsByOption: Record<string, number | null>;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
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
  const runnerUp = ranked[1] ?? null;
  const vsNoLoan =
    best && noLoan ? best.financialBenefit - noLoan.financialBenefit : 0;
  const vsRunnerUp =
    best && runnerUp ? best.financialBenefit - runnerUp.financialBenefit : 0;
  const downPayment = Math.max(0, onRoadCost - loanAmount);
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

  const compareData = ranked.map((opt) => {
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
        ...(opt.name === "No loan" && opt.netProfit === 0
          ? []
          : [
              {
                label: "Net profit",
                value: formatINRCurrency(opt.netProfit),
              },
            ]),
        { label: "Rank", value: `#${rank}` },
      ],
    };
  });

  const stackedData = ranked.map((opt) => {
    const base = result.stacked.find((row) => row.category === opt.name);
    return {
      category: opt.name,
      taxShield: base?.taxShield ?? result.totalTaxSaved,
      opportunity: base?.opportunity ?? opt.netProfit,
      netBenefit: base?.netBenefit ?? opt.financialBenefit,
    };
  });

  return (
    <Stack>
      <ResultsSection
        sectionId="02"
        title="Vehicle Financing Milestones"
        description="Best path, EMI, tax saved, and top ranked options"
        open={openMilestones}
        onToggle={onToggleMilestones}
        meta={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {best ? best.name : "Compare options"}
          </span>
        }
      >
      <div className="grid w-full grid-cols-1 gap-2 min-[640px]:grid-cols-4">
        <div className="relative flex min-h-[5.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-[var(--app-step-text)]/30 bg-[var(--app-step-bg)] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
            Best financing path
          </div>
          {best ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[var(--app-surface)]/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  Rank #1
                </div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--app-step-text-strong)]">
                  {best.name}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-[var(--app-step-text)]">
                  {formatINRCurrency(best.financialBenefit)}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--app-surface)]/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  {vsNoLoan > 0 ? "Vs no loan" : "Edge vs #2"}
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                  {vsNoLoan > 0
                    ? formatINRCurrency(vsNoLoan)
                    : vsRunnerUp > 0
                      ? formatINRCurrency(vsRunnerUp)
                      : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--app-step-text)]">
                  {vsNoLoan > 0
                    ? "Extra benefit"
                    : runnerUp
                      ? `Over ${runnerUp.name}`
                      : "Lead"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-sm font-semibold leading-snug text-[var(--app-step-text-strong)]">
              Compare loan-plus-invest options against paying cash.
            </div>
          )}
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard title="EMI" value={result.emi} tone="neutral" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Total tax saved"
            value={result.totalTaxSaved}
            hint="Loan interest + depreciation"
            tone="positive"
          />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Down payment"
            value={downPayment}
            hint={`${formatINRCurrency(loanAmount)} financed`}
            tone="neutral"
          />
        </div>
      </div>

      {ranked.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {ranked.slice(0, 3).map((opt) => {
            const rank = rankByName[opt.name] ?? 0;
            const isBest = rank === 1;
            return (
              <div
                key={opt.name}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${
                  isBest
                    ? "border-[var(--app-step-text)]/35 bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
                }`}
              >
                <span className="font-semibold">#{rank} {opt.name}</span>
                <span className="ml-1.5 tabular-nums text-[var(--app-text-muted)]">
                  {formatINRCurrency(opt.financialBenefit)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      </ResultsSection>

      <ResultsSection
        sectionId="03"
        title="Vehicle Analytics"
        description="Benefit charts, financing breakdown, ranking table, and depreciation"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
      >
      <div className={`${RESULTS_SPLIT} gap-3 lg:items-start`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <CompareChart
            title="Financial benefit by option"
            className="h-[360px] min-h-[360px] w-full flex-none sm:h-[400px] sm:min-h-[400px]"
            data={compareData}
            series={[
              {
                key: "benefit",
                label: "Financial benefit",
                color: "var(--app-chart-gain)",
              },
            ]}
            showBarLabels
            showLegend={false}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Sorted best to worst. Assumes the loan amount is invested at each option&apos;s return
            while the EMI runs.
          </div>

          <StackedBarChart
            title="Tax shield, investment gain, and net benefit"
            className="h-[320px] min-h-[320px] w-full flex-none sm:h-[360px] sm:min-h-[360px]"
            data={stackedData}
            series={[
              {
                key: "taxShield",
                label: "Tax shield",
                color: "var(--app-chart-invested)",
              },
              {
                key: "opportunity",
                label: "After-tax investment gain",
                color: "var(--app-chart-gain)",
              },
              {
                key: "netBenefit",
                label: "Net financial benefit",
                color: "var(--app-chart-tax)",
              },
            ]}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Tax shield is the loan interest and depreciation tax benefit. Investment gain is
            after-tax profit on deploying the loan. Net benefit is the final outcome per option.
            Segments are shown for comparison and are not strictly additive.
          </div>
        </div>

        <div className={`${RESULTS_RIGHT} gap-3`}>
          <ResultCard
            title="Financing breakdown"
            items={[
              {
                label: "On-road cost",
                value: onRoadCost,
              },
              {
                label: "Loan amount",
                value: loanAmount,
              },
              {
                label: "Down payment",
                value: downPayment,
                hint: "On-road less loan",
              },
              {
                label: "Interest paid",
                value: result.totalInterest,
              },
              {
                label: "Tax saved on interest",
                value: result.taxOnInterest ?? 0,
              },
              {
                label: "Tax saved on depreciation",
                value: result.taxOnDepreciation ?? 0,
              },
              {
                label: "Total tax saved",
                value: result.totalTaxSaved,
                highlight: true,
                tone: "gain",
              },
            ]}
          />

          <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Investment ranking
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left text-[11px] sm:text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--app-border)] text-[10px] uppercase tracking-wider text-[var(--app-text-muted)]">
                    <th className="px-2.5 py-2 font-semibold sm:px-3">Rank</th>
                    <th className="px-2.5 py-2 font-semibold sm:px-3">Option</th>
                    <th className="px-2.5 py-2 font-semibold sm:px-3">Return</th>
                    <th className="px-2.5 py-2 text-right font-semibold sm:px-3">
                      Investment value
                    </th>
                    <th className="px-2.5 py-2 text-right font-semibold sm:px-3">Net profit</th>
                    <th className="px-2.5 py-2 text-right font-semibold sm:px-3">Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((opt) => {
                    const rank = rankByName[opt.name] ?? 0;
                    const returnPct = returnsByOption[opt.name];
                    const isBest = best?.name === opt.name;
                    return (
                      <tr
                        key={opt.name}
                        className={`border-b border-[var(--app-border)] last:border-b-0 ${
                          isBest ? "bg-[var(--app-step-bg)] font-semibold" : ""
                        }`}
                      >
                        <td
                          className={`px-2.5 py-2 tabular-nums sm:px-3 ${
                            isBest
                              ? "text-[var(--app-step-text-strong)]"
                              : "text-[var(--app-text-muted)]"
                          }`}
                        >
                          #{rank}
                        </td>
                        <td className="px-2.5 py-2 text-[var(--app-text)] sm:px-3">
                          {opt.name}
                          {isBest ? (
                            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                              Best
                            </span>
                          ) : null}
                        </td>
                        <td className="px-2.5 py-2 tabular-nums text-[var(--app-text)] sm:px-3">
                          {returnPct == null ? "—" : formatPercent(returnPct, 0)}
                        </td>
                        <td className="px-2.5 py-2 text-right tabular-nums text-[var(--app-text)] sm:px-3">
                          {opt.maturity > 0 ? formatINRCurrency(opt.maturity) : "—"}
                        </td>
                        <td className="px-2.5 py-2 text-right tabular-nums text-[var(--app-text)] sm:px-3">
                          {opt.name === "No loan" && opt.netProfit === 0
                            ? "—"
                            : formatINRCurrency(opt.netProfit)}
                        </td>
                        <td
                          className={`px-2.5 py-2 text-right tabular-nums sm:px-3 ${
                            isBest
                              ? "text-[var(--app-step-text-strong)]"
                              : "text-[var(--app-text)]"
                          }`}
                        >
                          {formatINRCurrency(opt.financialBenefit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ScheduleTable
            caption="Depreciation schedule"
            meta={`Total ${formatINRCurrency(result.totalDepreciation)}`}
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
      </div>
      </ResultsSection>
    </Stack>
  );
}
