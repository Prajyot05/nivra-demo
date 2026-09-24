"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  ageError,
  emailError,
  formatINRCurrency,
  formatPercent,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageDescription, getCalculatorPageTitle } from "@/lib/calculator-nav";
import {
  ClientProfileFields,
  IconCalendar,
  IconChart,
  IconDonut,
  IconPerson,
  IconRates,
  IconRefresh,
  IconSip,
  IconTarget,
  IconTimeline,
  moneyCell,
  WEALTH_CONTENT_CLASS,
  WealthAnalyticsChrome,
  WealthAuditLedger,
  WealthCompareBars,
  WealthDataTable,
  WealthDisclaimer,
  WealthGrowthLine,
  WealthHero,
  WealthIconMark,
  WealthMetricCard,
  WealthMixDonut,
  WealthMoneyField,
  WealthPercentField,
  WealthProfileGrid,
  WealthSection,
  WealthSegmented,
  WealthStackedArea,
  WealthStackedBars,
  WealthStatusNote,
  WealthYearField,
  wealthChart,
  wealthMixColors,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
} from "@/components/wealth";

const PRINCIPAL_MIN = 10_000;
const PRINCIPAL_MAX = 10_00_00_000;
const YEARS_SLIDER_MAX = 40;
const VEHICLE_YEARS_MAX = 15;
const VEHICLE_YEAR_PRESETS = WEALTH_YEAR_PRESETS_DEFAULT.filter((p) => p.value <= VEHICLE_YEARS_MAX);

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
  const [openSchedule, setOpenSchedule] = useState(true);
  const assumptionsRef = useRef<HTMLDivElement>(null);

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

  const activeTenure =
    mode === "emi"
      ? years
      : mode === "prepay"
        ? prepayYears
        : mode === "extra-vs-invest"
          ? vsYears
          : mode === "recovery"
            ? recYears
            : vehYears;
  const activePrincipal =
    mode === "emi"
      ? principal
      : mode === "prepay"
        ? prepayPrincipal
        : mode === "extra-vs-invest"
          ? vsPrincipal
          : mode === "recovery"
            ? recPrincipal
            : onRoad;
  const activeRate =
    mode === "emi"
      ? interest
      : mode === "prepay"
        ? prepayRate
        : mode === "extra-vs-invest"
          ? vsRate
          : mode === "recovery"
            ? recRate
            : vehRate;
  const heroPrimary =
    mode === "vehicle"
      ? (result?.totalTaxSaved ?? 0)
      : mode === "extra-vs-invest"
        ? Math.max(result?.option1Saving ?? 0, result?.option2Saving ?? 0)
        : mode === "prepay"
          ? (result?.interestSaved ?? 0)
          : mode === "recovery"
            ? (result?.additionalWealth ?? 0)
            : (result?.totalPaid ?? activePrincipal);
  const heroSecondary =
    mode === "vehicle"
      ? (result?.emi ?? 0)
      : mode === "extra-vs-invest"
        ? extraAmount
        : mode === "prepay"
          ? yearlyExtra
          : mode === "recovery"
            ? (result?.monthlySip ?? 0)
            : (result?.emi ?? 0);

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/loans", mode)}
      description={getCalculatorPageDescription("/loans", mode)}
      contentClassName={WEALTH_CONTENT_CLASS}
      actions={
        <ReportDownloadButton
          onClick={handleDownload}
          disabled={!result}
          loading={isDownloading}
        />
      }
      header={
        <WealthHero
          clientName={name}
          age={age}
          email={email}
          phone={phone}
          goalLabel={MODE_COPY[mode].goal}
          tenure={activeTenure}
          strategy={MODE_COPY[mode].strategy}
          onEdit={scrollToAssumptions}
          metrics={[
            {
              label:
                mode === "vehicle"
                  ? "Tax saved"
                  : mode === "extra-vs-invest"
                    ? "Best saving"
                    : mode === "prepay"
                      ? "Interest saved"
                      : mode === "recovery"
                        ? "Additional wealth"
                        : "Total paid",
              value: canCalculate && result ? heroPrimary : activePrincipal,
              kind: "currency",
              tone: "emerald",
              mark: (
                <WealthIconMark tone="emerald" className="h-6 w-6">
                  <IconTarget className="h-3.5 w-3.5" />
                </WealthIconMark>
              ),
            },
            {
              label:
                mode === "vehicle"
                  ? "EMI"
                  : mode === "extra-vs-invest"
                    ? "Extra payment"
                    : mode === "prepay"
                      ? "Yearly extra"
                      : mode === "recovery"
                        ? "Monthly SIP"
                        : "EMI",
              value: canCalculate && result ? heroSecondary : 0,
              kind: "currency",
              tone: "slate",
              mark: (
                <WealthIconMark className="h-6 w-6">
                  <IconSip className="h-3.5 w-3.5" />
                </WealthIconMark>
              ),
            },
            {
              label: "Loan rate",
              value: activeRate,
              kind: "percent",
              tone: "slate",
              mark: (
                <WealthIconMark className="h-6 w-6">
                  <IconRates className="h-3.5 w-3.5" />
                </WealthIconMark>
              ),
            },
          ]}
        />
      }
      form={
        <div ref={assumptionsRef} className="space-y-4">
          <WealthSection
            id="assumptions"
            badge="01 · Profile"
            title="Loan Assumptions"
            subtitle={MODE_COPY[mode].assumptions}
            open={openAssumptions}
            onToggle={() => setOpenAssumptions((v) => !v)}
            mark={
              <WealthIconMark>
                <IconPerson />
              </WealthIconMark>
            }
            actions={
              <button
                type="button"
                onClick={resetDefaults}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <IconRefresh className="h-3.5 w-3.5" />
                Reset
              </button>
            }
          >
            <div className="w-full px-0">
              {mode === "emi" ? (
                <div className="py-2">
                  <WealthProfileGrid>
                    <ClientProfileFields
                      name={name}
                      onName={setName}
                      nameError={clientNameError}
                      age={age}
                      onAge={setAge}
                      ageError={clientAgeError}
                      email={email}
                      onEmail={setEmail}
                      emailError={clientEmailError}
                      phone={phone}
                      onPhone={setPhone}
                      phoneError={clientPhoneError}
                    />
                    <WealthMoneyField
                      label="Principal"
                      value={principal}
                      onChange={setPrincipal}
                      error={emiPrincipalError}
                      max={PRINCIPAL_MAX}
                      slider={{
                        min: PRINCIPAL_MIN,
                        max: PRINCIPAL_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthYearField
                      label="Tenure"
                      value={years}
                      min={1}
                      max={50}
                      onChange={setYears}
                      error={emiYearsError}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthPercentField
                      label="Loan rate"
                      value={interest}
                      onChange={setInterest}
                      error={emiInterestError}
                    />
                    <WealthPercentField
                      label="Recover return"
                      value={emiRecoverReturn}
                      onChange={setEmiRecoverReturn}
                      error={emiRecoverError}
                    />
                    <WealthYearField
                      label="Delay (mo)"
                      value={emiDelayMonths}
                      min={0}
                      max={Math.max(0, years * 12 - 1)}
                      suffix="Months"
                      onChange={setEmiDelayMonths}
                      error={emiDelayError}
                    />
                  </WealthProfileGrid>
                </div>
              ) : mode === "prepay" ? (
                <div className="py-2">
                  <WealthProfileGrid>
                    <ClientProfileFields
                      name={name}
                      onName={setName}
                      nameError={clientNameError}
                      age={age}
                      onAge={setAge}
                      ageError={clientAgeError}
                      email={email}
                      onEmail={setEmail}
                      emailError={clientEmailError}
                      phone={phone}
                      onPhone={setPhone}
                      phoneError={clientPhoneError}
                    />
                    <WealthMoneyField
                      label="Loan principal"
                      value={prepayPrincipal}
                      onChange={setPrepayPrincipal}
                      error={prepayPrincipalError}
                      max={PRINCIPAL_MAX}
                      slider={{
                        min: PRINCIPAL_MIN,
                        max: PRINCIPAL_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthYearField
                      label="Loan tenure"
                      value={prepayYears}
                      min={1}
                      max={50}
                      onChange={setPrepayYears}
                      error={prepayYearsError}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthPercentField
                      label="Loan interest"
                      value={prepayRate}
                      onChange={setPrepayRate}
                      error={prepayRateError}
                    />
                    <WealthMoneyField
                      label="Yearly extra payment"
                      value={yearlyExtra}
                      onChange={setYearlyExtra}
                      error={prepayExtraError}
                    />
                    <WealthPercentField
                      label="Investment return"
                      value={recoverReturn}
                      onChange={setRecoverReturn}
                      error={prepayRecoverError}
                    />
                  </WealthProfileGrid>
                </div>
              ) : mode === "extra-vs-invest" ? (
                <div className="py-2">
                  <WealthProfileGrid>
                    <ClientProfileFields
                      name={name}
                      onName={setName}
                      nameError={clientNameError}
                      age={age}
                      onAge={setAge}
                      ageError={clientAgeError}
                      email={email}
                      onEmail={setEmail}
                      emailError={clientEmailError}
                      phone={phone}
                      onPhone={setPhone}
                      phoneError={clientPhoneError}
                    />
                    <WealthMoneyField
                      label="Loan principal"
                      value={vsPrincipal}
                      onChange={setVsPrincipal}
                      error={vsPrincipalError}
                      max={PRINCIPAL_MAX}
                      slider={{
                        min: PRINCIPAL_MIN,
                        max: PRINCIPAL_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthYearField
                      label="Tenure"
                      value={vsYears}
                      min={1}
                      max={50}
                      onChange={setVsYears}
                      error={vsYearsError}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthPercentField
                      label="Loan interest"
                      value={vsRate}
                      onChange={setVsRate}
                      error={vsRateError}
                    />
                    <WealthMoneyField
                      label="Extra payment"
                      value={extraAmount}
                      onChange={setExtraAmount}
                      error={vsExtraError}
                    />
                    <WealthYearField
                      label="Extra payment month"
                      value={extraMonth}
                      min={1}
                      max={vsTermMonths || 1200}
                      suffix="Month"
                      onChange={setExtraMonth}
                      hint="Of the loan term"
                      error={vsExtraMonthError}
                    />
                    <WealthPercentField
                      label="Investment return"
                      value={investReturn}
                      onChange={setInvestReturn}
                      error={vsInvestError}
                    />
                    <WealthPercentField
                      label="Capital gains tax"
                      value={cgTax}
                      onChange={setCgTax}
                      error={vsCgTaxError}
                    />
                    <WealthPercentField
                      label="Income tax rate"
                      value={incomeTax}
                      onChange={setIncomeTax}
                      error={vsIncomeTaxError}
                    />
                  </WealthProfileGrid>
                </div>
              ) : mode === "recovery" ? (
                <div className="py-2">
                  <WealthProfileGrid>
                    <ClientProfileFields
                      name={name}
                      onName={setName}
                      nameError={clientNameError}
                      age={age}
                      onAge={setAge}
                      ageError={clientAgeError}
                      email={email}
                      onEmail={setEmail}
                      emailError={clientEmailError}
                      phone={phone}
                      onPhone={setPhone}
                      phoneError={clientPhoneError}
                    />
                    <WealthMoneyField
                      label="Loan principal"
                      value={recPrincipal}
                      onChange={setRecPrincipal}
                      error={recPrincipalError}
                      max={PRINCIPAL_MAX}
                      slider={{
                        min: PRINCIPAL_MIN,
                        max: PRINCIPAL_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthYearField
                      label="Baseline tenure"
                      value={recYears}
                      min={1}
                      max={50}
                      onChange={setRecYears}
                      error={recYearsError}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthPercentField
                      label="Loan interest"
                      value={recRate}
                      onChange={setRecRate}
                      error={recRateError}
                    />
                    <WealthYearField
                      label="Proposed tenure"
                      value={proposedYears}
                      min={1}
                      max={Math.max(1, recYears - 1)}
                      onChange={setProposedYears}
                      error={recProposedError}
                      slider={{
                        min: 1,
                        max: Math.min(YEARS_SLIDER_MAX, Math.max(1, recYears - 1)),
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT.filter(
                          (p) => p.value <= Math.max(1, recYears - 1),
                        ),
                      }}
                    />
                    <WealthPercentField
                      label="SIP return"
                      value={sipReturn}
                      onChange={setSipReturn}
                      error={recSipError}
                    />
                  </WealthProfileGrid>
                </div>
              ) : (
                <div className="py-2">
                  <WealthProfileGrid>
                    <ClientProfileFields
                      name={name}
                      onName={setName}
                      nameError={clientNameError}
                      age={age}
                      onAge={setAge}
                      ageError={clientAgeError}
                      email={email}
                      onEmail={setEmail}
                      emailError={clientEmailError}
                      phone={phone}
                      onPhone={setPhone}
                      phoneError={clientPhoneError}
                    />
                    <WealthMoneyField
                      label="On-road cost"
                      value={onRoad}
                      onChange={setOnRoad}
                      error={vehOnRoadError}
                      max={PRINCIPAL_MAX}
                      slider={{
                        min: PRINCIPAL_MIN,
                        max: PRINCIPAL_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthMoneyField
                      label="Loan amount"
                      value={vehLoan}
                      onChange={setVehLoan}
                      error={vehLoanError}
                      max={PRINCIPAL_MAX}
                      slider={{
                        min: PRINCIPAL_MIN,
                        max: PRINCIPAL_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthPercentField
                      label="Loan interest"
                      value={vehRate}
                      onChange={setVehRate}
                      error={vehRateError}
                    />
                    <WealthYearField
                      label="Tenure"
                      value={vehYears}
                      min={1}
                      max={VEHICLE_YEARS_MAX}
                      onChange={setVehYears}
                      error={vehYearsError}
                      slider={{
                        min: 1,
                        max: VEHICLE_YEARS_MAX,
                        step: 1,
                        presets: VEHICLE_YEAR_PRESETS,
                      }}
                    />
                    <WealthPercentField
                      label="Income tax"
                      value={vehTax}
                      onChange={setVehTax}
                      error={vehTaxError}
                    />
                    <WealthPercentField
                      label="Depreciation"
                      value={depPct}
                      onChange={setDepPct}
                      error={depPctError}
                    />
                    <WealthPercentField label="FD return" value={fdRet} onChange={setFdRet} error={fdRetError} />
                    <WealthPercentField label="FD tax" value={fdTax} onChange={setFdTax} error={fdTaxError} />
                    <WealthPercentField label="MF debt return" value={debtRet} onChange={setDebtRet} error={debtRetError} />
                    <WealthPercentField label="MF debt tax" value={debtTax} onChange={setDebtTax} error={debtTaxError} />
                    <WealthPercentField label="Cons. return" value={consRet} onChange={setConsRet} error={consRetError} />
                    <WealthPercentField label="Cons. tax" value={consTax} onChange={setConsTax} error={consTaxError} />
                    <WealthPercentField label="Equity return" value={eqRet} onChange={setEqRet} error={eqRetError} />
                    <WealthPercentField label="Equity tax" value={eqTax} onChange={setEqTax} error={eqTaxError} />
                  </WealthProfileGrid>
                </div>
              )}
            </div>
          </WealthSection>
        </div>
      }
      results={
        <div className="flex flex-col gap-4">
          {!canCalculate ? (
            <WealthStatusNote tone="error">
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  Fix the inputs above to refresh the calculation
                  {result ? ". Showing the last valid result." : "."}
                </span>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] font-normal">
                  {fieldErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            </WealthStatusNote>
          ) : null}
          {error ? <WealthStatusNote tone="error">{error}</WealthStatusNote> : null}
          {loading && !result && canCalculate ? (
            <WealthStatusNote tone="info">Calculating…</WealthStatusNote>
          ) : null}
          {result && mode === "emi" && Array.isArray(result.schedule) ? (
            <EmiResults
              result={result as EmiResult}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
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
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
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
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
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
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
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
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
            />
          ) : null}
        </div>
      }
      footer={
        result ? (
        <WealthDisclaimer
          notes={[
            "EMI and interest savings depend on the stated rate, tenure, and payment schedule.",
            "Prepayment benefits assume the lender applies surplus to principal as modeled.",
            "Investment-vs-prepay outcomes use assumed returns and tax; actual results can differ.",
          ]}
        >
          Figures are for illustration only. Loan EMIs, interest savings, and investment outcomes
          depend on assumed rates, taxes, and lender terms. Actual lender policies may differ.
        </WealthDisclaimer>
        ) : null
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


function WealthResultCard({
  title,
  items,
}: {
  title: string;
  accent?: boolean;
  items: Array<{
    label: string;
    value?: number;
    displayValue?: string;
    hint?: string;
    highlight?: boolean;
    tone?: string;
  }>;
}) {
  const hints = items.filter((item) => item.hint);
  return (
    <WealthAuditLedger
      tableTitle={title}
      columns={["Metric", "Amount"]}
      rows={items.map((item) => ({
        label: item.label,
        highlight: item.highlight,
        cells: [
          {
            text:
              item.displayValue ??
              (item.value != null ? formatINRCurrency(item.value) : "—"),
            tone: item.highlight
              ? ("pill" as const)
              : item.tone === "tax" || item.tone === "rose"
                ? ("rose" as const)
                : ("default" as const),
          },
        ],
      }))}
      note={
        hints.length > 0
          ? hints.map((item) => `${item.label}: ${item.hint}`).join(" ")
          : undefined
      }
    />
  );
}

function monthTickLabel(month: number, totalMonths: number): string {
  if (month === 1) return "M1";
  if (month === totalMonths) return `M${totalMonths}`;
  if (month % 12 === 0) return `Y${month / 12}`;
  return "";
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

function EmiResults({
  result,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  result: EmiResult;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const [chartTab, setChartTab] = useState<"payments" | "mix" | "balance">("payments");
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
    <div className="flex flex-col gap-4">
      <WealthSection
        badge="02 · Milestones"
        title="Loan Payment Milestones"
        subtitle="EMI, lifetime interest, recover SIP, and payoff timeline"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {totalMonths} months
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <WealthMetricCard
            title="EMI"
            value={result.emi}
            description="Monthly installment"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconSip />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Total interest"
            value={result.totalInterest}
            description={`${formatPercent(interestBurdenPct, 0)} of principal`}
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconRates />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Total paid"
            value={result.totalPaid}
            description="Principal plus interest"
            tone="positive"
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconChart />
              </WealthIconMark>
            }
          />
        </div>

        {first ? (
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                First EMI
              </span>
              <span>
                Principal{" "}
                <span className="font-medium tabular-nums text-slate-900">
                  {formatINRCurrency(first.principal)}
                </span>
              </span>
              <span>
                Interest{" "}
                <span className="font-medium tabular-nums text-amber-800">
                  {formatINRCurrency(first.interest)}
                </span>
              </span>
              <span className="text-xs text-slate-400">
                Interest = {formatPercent(interestBurdenPct, 0)} of principal
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <WealthAuditLedger
            tableTitle="Loan summary"
            columns={["Metric", "Amount"]}
            rows={[
              { label: "EMI", cells: [{ text: formatINRCurrency(result.emi) }] },
              { label: "Principal", cells: [{ text: formatINRCurrency(result.totalPrincipal) }] },
              {
                label: "Interest",
                tax: true,
                cells: [{ text: formatINRCurrency(result.totalInterest), tone: "rose" as const }],
              },
              {
                label: "Total paid",
                highlight: true,
                cells: [{ text: formatINRCurrency(result.totalPaid), tone: "pill" as const }],
              },
            ]}
            note={`Interest is ${formatPercent(interestBurdenPct, 0)} of principal.`}
          />
          <WealthAuditLedger
            tableTitle="Recover interest"
            columns={["Metric", "Amount"]}
            rows={[
              { label: "Total interest", cells: [{ text: formatINRCurrency(result.totalInterest) }] },
              {
                label: "Return / term",
                cells: [
                  {
                    text: `${formatPercent(result.recoverReturnPct, 0)} · ${result.recoverMonths / 12}y`,
                  },
                ],
              },
              {
                label: "SIP start now",
                highlight: true,
                cells: [{ text: formatINRCurrency(result.recoverMonthlySip), tone: "pill" as const }],
              },
              {
                label: "Total invested",
                cells: [{ text: formatINRCurrency(result.recoverInvested), tone: "emerald" as const }],
              },
            ]}
          />
        </div>
        {delayExtra > 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-rose-300 bg-rose-50/70 p-4">
            <p className="text-xs font-semibold text-rose-800">Cost of a delayed recovery SIP</p>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-700">
              Waiting {result.delayMonths} months raises the recovery SIP to{" "}
              {formatINRCurrency(result.delayedRecoverMonthlySip)}, about{" "}
              {formatINRCurrency(delayExtra)} more each month.
            </p>
          </div>
        ) : null}

        {milestones.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                Payoff timeline
              </div>
              <div className="text-xs text-slate-400">Remaining balance by year</div>
            </div>
            <div className="relative w-full pt-1">
              <div
                className="pointer-events-none absolute left-4 right-4 top-[0.95rem] h-0.5 bg-slate-200 sm:left-6 sm:right-6"
                aria-hidden
              />
              <div className="relative z-[1] flex w-full items-start justify-between gap-1">
                <div className="flex w-[4.5rem] shrink-0 flex-col items-center sm:w-[5rem]">
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-600 text-white">
                    <span className="text-[10px] font-bold">0</span>
                  </div>
                  <div className="mt-1.5 text-center">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Start
                    </div>
                    <div className="text-[11px] font-medium tabular-nums text-slate-900">
                      {formatINRCurrency(result.totalPrincipal)}
                    </div>
                  </div>
                </div>
                {milestones.map((m) => {
                  const repaid = m.balance <= 1e-6;
                  return (
                    <div key={m.year} className="flex min-w-0 flex-1 flex-col items-center">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                          repaid
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {repaid ? "✓" : m.year}
                      </div>
                      <div className="mt-1.5 max-w-full text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          Year {m.year}
                        </div>
                        <div
                          className={`truncate text-[11px] font-medium tabular-nums ${
                            repaid ? "text-emerald-700" : "text-slate-900"
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
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Loan Analytics"
        subtitle="Payment mix, balance path, and lifetime composition"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
        <WealthAnalyticsChrome
          tabs={
            <WealthSegmented
              variant="underline"
              fullWidth
              layoutId="emi-chart-tab"
              value={chartTab}
              onChange={setChartTab}
              options={[
                { id: "payments", label: "Payments", icon: <IconChart className="h-3.5 w-3.5" /> },
                { id: "mix", label: "Mix", icon: <IconDonut className="h-3.5 w-3.5" /> },
                { id: "balance", label: "Balance", icon: <IconTimeline className="h-3.5 w-3.5" /> },
              ]}
            />
          }
        >
        <AnimatePresence mode="wait">
          <motion.div
            key={chartTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
          {chartTab === "payments" ? (
            <WealthGrowthLine
              data={result.schedule.map((row) => ({
                year: row.month,
                principal: row.principal,
                interest: row.interest,
              }))}
              xTick={(month) => monthTickLabel(Number(month), totalMonths)}
              series={[
                { key: "principal", label: "Principal payment", color: wealthChart.invested, kind: "area" },
                { key: "interest", label: "Interest payment", color: wealthChart.tax, kind: "line" },
              ]}
            />
          ) : null}
          {chartTab === "mix" ? (
            <WealthMixDonut
              title="Lifetime mix"
              centerLabel="Total paid"
              centerValue={result.totalPaid}
              slices={[
                { name: "Principal", value: result.totalPrincipal, color: wealthMixColors.invested },
                { name: "Interest", value: result.totalInterest, color: wealthMixColors.tax },
              ]}
            />
          ) : null}
          {chartTab === "balance" ? (
            <WealthStackedArea
              data={area}
              xTick={(month) => monthTickLabel(Number(month), totalMonths)}
              series={[
                { key: "remaining", label: "Remaining principal", color: wealthChart.invested },
                {
                  key: "interestPaid",
                  label: "Cumulative interest paid",
                  color: wealthChart.tax,
                },
              ]}
            />
          ) : null}
          </motion.div>
        </AnimatePresence>
        </WealthAnalyticsChrome>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Amortisation Schedule"
        subtitle="Month-wise EMI split into principal, interest, and remaining balance"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthAuditLedger
          className="mb-5"
          stats={[
            { label: "Tenure", value: `${totalMonths} mo` },
            { label: "Monthly EMI", value: formatINRCurrency(result.emi), tone: "emerald" },
            { label: "Total interest", value: formatINRCurrency(result.totalInterest) },
          ]}
          columns={["Metric", "Amount"]}
          rows={[
            { label: "Principal", cells: [{ text: formatINRCurrency(result.totalPrincipal) }] },
            { label: "Interest", cells: [{ text: formatINRCurrency(result.totalInterest) }] },
            { label: "Total paid", cells: [{ text: formatINRCurrency(result.totalPaid) }], highlight: true },
          ]}
          note="Month rows below split each EMI into principal, interest, and remaining balance."
        />
        <WealthDataTable
          rows={scheduleRows}
          getRowKey={(row, i) => `${row.month}-${row.marker}-${i}`}
          filterPlaceholder="Filter by month…"
          summary={[
            { label: "Months", value: String(totalMonths) },
            { label: "EMI", value: formatINRCurrency(result.emi) },
            { label: "Interest", value: formatINRCurrency(result.totalInterest), tone: "step" },
            { label: "Final balance", value: "₹0" },
          ]}
          note="Each row is one EMI month. Year markers highlight completed years; the last row totals principal and interest paid."
          columns={[
            {
              key: "month",
              header: "Mo",
              sticky: true,
              searchValue: (row) => String(row.month),
              render: (row) => {
                if (row.marker === "TOTAL") return "TOTAL";
                if (!row.marker) return String(row.month);
                return (
                  <span className="inline-flex flex-col leading-tight">
                    <span>{row.month}</span>
                    <span className="text-[9px] font-medium text-slate-400">{row.marker}</span>
                  </span>
                );
              },
            },
            {
              key: "emi",
              header: "EMI",
              align: "right",
              render: (row) => (row.marker === "TOTAL" ? "—" : moneyCell(row.emi)),
            },
            {
              key: "principal",
              header: "Principal",
              align: "right",
              render: (row) => moneyCell(row.principal),
            },
            {
              key: "interest",
              header: "Interest",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.interest),
            },
            {
              key: "balance",
              header: "Balance",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.balance),
            },
          ]}
        />
      </WealthSection>
    </div>
  );
}

function PrepayResults({
  result,
  yearlyExtra,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  result: PrepayResult;
  yearlyExtra: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const originalMonths = result.originalSchedule.length;
  const monthsPaid = result.monthsPaid;
  const paidIn = formatLoanRemaining(monthsPaid);
  const originalTerm = formatLoanRemaining(originalMonths);
  const timeSaved = formatLoanRemaining(result.monthsSaved);
  const sipLower = Math.max(0, result.recoverSip - result.revisedRecoverSip);
  const [prepayTab, setPrepayTab] = useState<"path" | "compare" | "results">("path");

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

  return (
    <div className="flex flex-col gap-4">
      <WealthSection
        badge="02 · Milestones"
        title="Prepayment Milestones"
        subtitle="Interest saved, time saved, and yearly extra payment timeline"
        open={openMilestones}
        onToggle={onToggleMilestones}
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {monthsPaid} of {originalMonths} mo
          </span>
        }
      >
      <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="relative flex min-h-[5.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Yearly extra payments
          </div>
          {result.monthsSaved > 0 || result.interestSaved > 0 ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                  Debt-free sooner
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-900">
                  {timeSaved.primary} saved
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-emerald-700">
                  {originalMonths}m → {monthsPaid}m
                </div>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                  Interest saved
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-900">
                  {formatINRCurrency(result.interestSaved)}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-emerald-700">
                  Paid in {paidIn.primary}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-sm font-semibold leading-snug text-emerald-900">
              Add a yearly extra payment to shorten the loan and reduce interest.
            </div>
          )}
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard title="Interest saved" value={result.interestSaved} description="" tone="positive" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard title="Total extra payments" value={result.totalExtra} description="" tone="neutral" />
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
        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 sm:px-4">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Extra payment timeline
            </div>
            <div className="text-xs text-slate-400">
              {formatINRCurrency(yearlyExtra)} each year · repaid in month {monthsPaid}
            </div>
          </div>
          <div className="relative w-full overflow-x-auto pt-1">
            <div
              className="pointer-events-none absolute left-6 right-6 top-[0.95rem] h-0.5 bg-slate-200"
              aria-hidden
            />
            <div className="relative z-[1] flex min-w-[28rem] items-start justify-between gap-2">
              {extraMonths.map((month, index) => (
                <div
                  key={month}
                  className="flex min-w-0 flex-1 flex-col items-center"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50 text-amber-800">
                    <span className="text-[10px] font-bold">Y{index + 1}</span>
                  </div>
                  <div className="mt-1.5 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Month {month}
                    </div>
                    <div className="text-[11px] font-semibold tabular-nums text-amber-800">
                      +{formatINRCurrency(yearlyExtra)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-50 text-emerald-900">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Paid off
                  </div>
                  <div className="text-[11px] font-semibold tabular-nums text-emerald-900">
                    Month {monthsPaid}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Prepayment Analytics"
        subtitle="Outstanding path and interest compare with yearly extras"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
      <WealthAnalyticsChrome
        tabs={
          <WealthSegmented
            variant="underline"
            layoutId="prepay-analytics"
            value={prepayTab}
            onChange={setPrepayTab}
            options={[
              { id: "path", label: "Path", icon: <IconTimeline className="h-3.5 w-3.5" /> },
              { id: "compare", label: "Compare", icon: <IconChart className="h-3.5 w-3.5" /> },
              { id: "results", label: "Results", icon: <IconRates className="h-3.5 w-3.5" /> },
            ]}
          />
        }
      >
      <AnimatePresence mode="wait">
        <motion.div
          key={prepayTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
      {prepayTab === "path" ? (
        <div className="space-y-4">
          <WealthGrowthLine
            data={line}
            xTick={(month) => {
              const m = Number(month);
              if (m === 1) return "M1";
              if (m === monthsPaid) return `M${monthsPaid}`;
              if (m === originalMonths) return `M${originalMonths}`;
              if (m % 12 === 0) return `Y${m / 12}`;
              return `M${m}`;
            }}
            series={[
              { key: "scheduled", label: "Scheduled loan", color: wealthChart.tax, kind: "line" },
              {
                key: "prepaid",
                label: "With annual extra payments",
                color: wealthChart.invested,
                kind: "area",
              },
            ]}
          />
          <div className="px-0.5 text-xs text-slate-400">
            Debt-free in {monthsPaid} months ({paidIn.primary}). Scheduled term was{" "}
            {originalTerm.primary}.
          </div>
        </div>
      ) : null}
      {prepayTab === "results" ? (
          <WealthResultCard
            title="Results"
            items={[
              { label: "EMI", value: result.emi },
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
              { label: "Total extra payments", value: result.totalExtra },
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
      ) : null}
      {prepayTab === "compare" ? (
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        <WealthCompareBars
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
          series={[{ key: "value", label: "Interest", color: wealthChart.tax }]}
        />
        <div className="flex min-h-[240px] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white">
          <div className="border-b border-slate-200/80 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Loan duration
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 p-3">
            <div className="grid flex-1 grid-cols-2 gap-2.5">
              <div className="flex flex-col justify-center rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Original
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums leading-none text-slate-900">
                  {originalMonths}
                  <span className="ml-1 text-sm font-semibold text-slate-500">mo</span>
                </div>
                <div className="mt-1.5 text-xs text-slate-400">{originalTerm.primary}</div>
              </div>
              <div className="flex flex-col justify-center rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  With extra
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums leading-none text-emerald-900">
                  {monthsPaid}
                  <span className="ml-1 text-sm font-semibold text-emerald-700">mo</span>
                </div>
                <div className="mt-1.5 text-[11px] font-medium tabular-nums text-emerald-700">
                  {paidIn.primary}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold tabular-nums text-slate-500">
                <span>Paid off by</span>
                <span>
                  {monthsPaid}/{originalMonths} mo
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-50">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-emerald-600/70"
                  style={{
                    width: `${Math.min(100, (monthsPaid / Math.max(1, originalMonths)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-sm font-semibold text-emerald-900">
              {result.monthsSaved} month{result.monthsSaved === 1 ? "" : "s"} saved
              <span className="ml-1.5 font-normal text-emerald-700">
                · {originalMonths} → {monthsPaid} mo
              </span>
            </div>
          </div>
        </div>
      </div>
      ) : null}
      </motion.div>
      </AnimatePresence>
      </WealthAnalyticsChrome>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Prepaid Amortisation Schedule"
        subtitle="Month-wise EMI, yearly extras, interest, and balance until payoff"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthAuditLedger
          className="mb-5"
          stats={[
            { label: "Months paid", value: String(monthsPaid) },
            { label: "EMI", value: formatINRCurrency(result.emi) },
            {
              label: "Interest saved",
              value: formatINRCurrency(result.interestSaved),
              tone: "emerald",
            },
          ]}
          columns={["Metric", "Amount"]}
          rows={[
            { label: "Total extra paid", cells: [{ text: formatINRCurrency(result.totalExtra) }] },
            { label: "Months saved", cells: [{ text: String(result.monthsSaved) }], highlight: true },
          ]}
          note="The schedule below shows each EMI month after the yearly extra is applied."
        />
        <WealthDataTable
          rows={scheduleRows}
          getRowKey={(row) => row.month}
          filterPlaceholder="Filter by month…"
          summary={[
            { label: "Months paid", value: String(monthsPaid) },
            { label: "EMI", value: formatINRCurrency(result.emi) },
            { label: "Total extra", value: formatINRCurrency(result.totalExtra), tone: "step" },
            {
              label: "Interest saved",
              value: formatINRCurrency(result.interestSaved),
              tone: "std",
            },
          ]}
          note={`Rows stop at month ${monthsPaid} when the loan is repaid. Highlighted Extra cells are the yearly prepayments of ${formatINRCurrency(yearlyExtra)}.`}
          columns={[
            {
              key: "month",
              header: "Month",
              sticky: true,
              searchValue: (row) => String(row.month),
              render: (row) => row.month,
            },
            {
              key: "emi",
              header: "EMI",
              align: "right",
              render: (row) => moneyCell(row.emi),
            },
            {
              key: "extra",
              header: "Extra",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.extra ?? 0),
            },
            {
              key: "interest",
              header: "Interest",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.interest),
            },
            {
              key: "balance",
              header: "Balance",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.balance),
            },
          ]}
        />
      </WealthSection>
    </div>
  );
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
  openSchedule,
  onToggleSchedule,
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
  openSchedule: boolean;
  onToggleSchedule: () => void;
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
  const [extraTab, setExtraTab] = useState<"compare" | "path" | "results">("compare");
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
    <div className="flex flex-col gap-4">
      <WealthSection
        badge="02 · Milestones"
        title="Decision Milestones"
        subtitle="Prepay versus invest savings and which path wins on net outcome"
        open={openMilestones}
        onToggle={onToggleMilestones}
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Extra at M{decisionMonth}
          </span>
        }
      >
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col justify-center rounded-xl border border-slate-200/80 bg-white px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Which is financially better?
          </div>
          <div className="mt-1 text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">
            {decisionTitle}
          </div>
          {!tie ? (
            <div className="mt-1.5 text-[12px] font-semibold tabular-nums text-emerald-700">
              Advantage {formatINRCurrency(advantage)}
              <span className="ml-1.5 font-normal text-xs text-slate-400">
                · {formatPercent(investReturnPct, 1)}
                {crossover ? ` · M${crossover.month}` : ""}
              </span>
            </div>
          ) : (
            <div className="mt-1.5 text-xs text-slate-400">
              Similar outcomes at {formatPercent(investReturnPct, 1)}
            </div>
          )}
        </div>
        <WealthMetricCard title="Prepay saving" value={result.option1Saving} description={prepayWins ? "Best financial outcome" : debtFreeFaster ? "Debt-free faster" : undefined} tone={prepayWins ? "positive" : "neutral"} />
        <WealthMetricCard title="Invest saving" value={result.option2Saving} description={investWins ? "Best financial outcome" : undefined} tone={investWins || tie ? "positive" : "neutral"} />
      </div>
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Decision Analytics"
        subtitle="Compare charts and outstanding versus investment path"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
      <WealthAnalyticsChrome
        tabs={
          <WealthSegmented
            variant="underline"
            layoutId="extra-analytics"
            value={extraTab}
            onChange={setExtraTab}
            options={[
              { id: "compare", label: "Compare", icon: <IconChart className="h-3.5 w-3.5" /> },
              { id: "path", label: "Path", icon: <IconTimeline className="h-3.5 w-3.5" /> },
              { id: "results", label: "Results", icon: <IconRates className="h-3.5 w-3.5" /> }
            ]}
          />
        }
      >
      <AnimatePresence mode="wait">
        <motion.div
          key={extraTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
      {extraTab === "compare" ? (
        <div className="space-y-4">
          <WealthCompareBars
            data={[
              {
                category: "Interest saved",
                prepay: result.interestSavedVsOriginal,
                invest: 0,
              },
              {
                category: "After-tax corpus",
                prepay: 0,
                invest: result.corpusAfterTax,
              },
              {
                category: "Net advantage",
                prepay: result.option1Saving,
                invest: result.option2Saving,
              },
            ]}
            series={[
              { key: "prepay", label: "Prepay", color: wealthChart.invested },
              { key: "invest", label: "Invest extra", color: wealthChart.stepUp },
            ]}
          />
        </div>
      ) : null}
      {extraTab === "path" ? (
        <div className="space-y-4">
<div className="flex flex-col gap-1.5">
            <WealthGrowthLine
              data={result.path.map((row) => ({
                year: row.month,
                outstanding: row.outstandingPrepay,
                investment: row.investment,
              }))}
              xTick={(month) => {
                const m = Number(month);
                if (m === decisionMonth) return `M${m}`;
                return monthTickLabel(m, result.path.length);
              }}
              series={[
                { key: "outstanding", label: "Loan outstanding", color: wealthChart.tax, kind: "line" },
                { key: "investment", label: "Investment", color: wealthChart.stepUp, kind: "area" },
              ]}
            />
            <div className="px-0.5 text-xs text-slate-400">
              {formatINRCurrency(extraAmount)} invested at Month {decisionMonth}
              {endPoint
                ? `. At month ${endPoint.month}: loan ${formatINRCurrency(endPoint.outstandingPrepay)}, investment ${formatINRCurrency(endPoint.investment)}.`
                : "."}
            </div>
          </div>
        </div>
      ) : null}
      {extraTab === "results" ? (
        <div className="space-y-4">
<div className="space-y-4 lg:col-span-5">
          <WealthResultCard
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
          <WealthResultCard
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
        </div>
        </div>
      ) : null}
        </motion.div>
      </AnimatePresence>
      </WealthAnalyticsChrome>

      </WealthSection>

      <WealthSection
        badge="04 · Audit"
        title="Decision Comparison Ledger"
        subtitle="Side-by-side metrics for prepay versus invest the extra amount"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthAuditLedger
          className="mb-5"
          stats={[
            { label: "Extra amount", value: formatINRCurrency(extraAmount) },
            { label: "Decision month", value: `M${decisionMonth}` },
            {
              label: prepayWins ? "Prepay saving" : "Invest saving",
              value: formatINRCurrency(prepayWins ? result.option1Saving : result.option2Saving),
              tone: "emerald",
            },
          ]}
          columns={["Metric", "Prepay", "Invest"]}
          rows={[
            {
              label: "Saving vs original",
              cells: [
                { text: formatINRCurrency(result.option1Saving), tone: prepayWins ? "emerald" : "default" },
                { text: formatINRCurrency(result.option2Saving), tone: investWins ? "emerald" : "default" },
              ],
              highlight: true,
            },
          ]}
          note="The table below lists every compared metric for the two uses of the extra amount."
        />
        <WealthDataTable
          rows={compareRows}
          getRowKey={(row) => row.label}
          filterPlaceholder="Filter metrics…"
          summary={[
            { label: "Extra amount", value: formatINRCurrency(extraAmount) },
            { label: "Decision month", value: `M${decisionMonth}` },
            {
              label: "Prepay saving",
              value: formatINRCurrency(result.option1Saving),
              tone: prepayWins ? "step" : "std",
            },
            {
              label: "Invest saving",
              value: formatINRCurrency(result.option2Saving),
              tone: investWins || tie ? "step" : "std",
            },
          ]}
          note="Each row compares one decision metric. Net saving is versus the original loan without the extra payment."
          columns={[
            {
              key: "label",
              header: "Metric",
              sticky: true,
              searchValue: (row) => row.label,
              render: (row) => row.label,
            },
            {
              key: "prepay",
              header: "Prepay",
              align: "right",
              searchValue: (row) => row.prepay,
              render: (row) => row.prepay,
            },
            {
              key: "invest",
              header: "Invest",
              align: "right",
              searchValue: (row) => row.invest,
              render: (row) => row.invest,
            },
          ]}
        />
      </WealthSection>
    </div>
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
  openSchedule,
  onToggleSchedule,
}: {
  result: RecoveryResult;
  principal: number;
  baselineYears: number;
  proposedYears: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const yearsSaved = Math.max(0, baselineYears - proposedYears);
  const interestSaved = Math.max(0, result.baselineInterest - result.proposedInterest);
  const loanPaymentSaved = Math.max(0, result.baselinePaid - result.proposedPaid);
  const totalInvested =
    result.totalInvestedLoanPlusSip ?? result.proposedPaid + result.sipInvested;
  const accelerated = yearsSaved > 0;
  const [recoveryTab, setRecoveryTab] = useState<"path" | "compare" | "results">("path");

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
    <div className="flex flex-col gap-4">
      <WealthSection
        badge="02 · Milestones"
        title="Recovery Milestones"
        subtitle="Baseline versus proposed EMI and the SIP redirected from tenure savings"
        open={openMilestones}
        onToggle={onToggleMilestones}
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {baselineYears}y → {proposedYears}y
          </span>
        }
      >
      <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="relative flex min-h-[5.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Loan shortening strategy
          </div>
          {accelerated ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                  Debt-free sooner
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-900">
                  {yearsSaved}y earlier
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-emerald-700">
                  {baselineYears}y → {proposedYears}y
                </div>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                  Extra wealth
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-900">
                  +{formatINRCurrency(result.additionalWealth)}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-emerald-700">
                  Interest saved {formatINRCurrency(interestSaved)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-sm font-semibold leading-snug text-emerald-900">
              Shorten tenure to accelerate payoff and build SIP wealth
            </div>
          )}
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard title="Baseline EMI" value={result.baselineEmi} description="" tone="neutral" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard title="Proposed EMI" value={result.proposedEmi} description="" tone="neutral" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard
            title="Monthly SIP"
            value={result.monthlySip}
            description={accelerated ? `${yearsSaved}y faster` : "Redirected from tenure savings"}
            tone="positive"
          />
        </div>
      </div>
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Recovery Analytics"
        subtitle="Wealth path, horizon compare, and baseline versus proposed detail cards"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
      <WealthAnalyticsChrome
        tabs={
          <WealthSegmented
            variant="underline"
            layoutId="recovery-analytics"
            value={recoveryTab}
            onChange={setRecoveryTab}
            options={[
              { id: "path", label: "Path", icon: <IconTimeline className="h-3.5 w-3.5" /> },
              { id: "compare", label: "Compare", icon: <IconChart className="h-3.5 w-3.5" /> },
              { id: "results", label: "Results", icon: <IconRates className="h-3.5 w-3.5" /> }
            ]}
          />
        }
      >
      <AnimatePresence mode="wait">
        <motion.div
          key={recoveryTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
      {recoveryTab === "path" ? (
        <div className="space-y-4">
<WealthGrowthLine
            height="h-[420px] sm:h-[460px]"
            data={result.schedule.map((row) => ({
              year: row.year,
              baseline: row.baseline,
              sip: row.sip,
              proposed: row.loanPlusSip,
            }))}
            xTick={(year) => {
              const y = Number(year);
              if (y === proposedYears || y === baselineYears) return `Y${y}`;
              if (y === 1) return "Y1";
              if (y % 5 === 0) return `Y${y}`;
              return `Y${y}`;
            }}
            series={[
              { key: "baseline", label: "Baseline loan outstanding", color: wealthChart.tax, kind: "line" },
              { key: "sip", label: "SIP value", color: wealthChart.stepUp, kind: "area" },
              {
                key: "proposed",
                label: "Proposed wealth (loan + SIP)",
                color: wealthChart.invested,
                kind: "line",
              },
            ]}
          />
<div className="px-0.5 text-xs text-slate-400">
            Accelerated payoff at year {proposedYears}. Baseline repaid at year {baselineYears}.
          </div>
        </div>
      ) : null}
      {recoveryTab === "compare" ? (
        <div className="space-y-4">
<WealthCompareBars
            data={[
              {
                category: "Baseline",
                asset: principal,
                sip: 0,
              },
              {
                category: "Proposed",
                asset: principal,
                sip: result.sipAtHorizon,
              },
            ]}
            series={[
              { key: "asset", label: "Asset (principal)", color: wealthChart.invested },
              { key: "sip", label: "SIP wealth", color: wealthChart.stepUp },
            ]}
          />
          <div className="px-0.5 text-xs text-slate-400">
            Proposed total {formatINRCurrency(result.totalAssetPlusWealth)}. Additional wealth{" "}
            {formatINRCurrency(result.additionalWealth)}.
          </div>
        </div>
      ) : null}
      {recoveryTab === "results" ? (
        <div className="space-y-4">
<WealthResultCard
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
          <WealthResultCard
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
          <WealthResultCard
            title="Baseline"
            items={[
              { label: "Tenure", displayValue: `${baselineYears} years` },
              { label: "EMI", value: result.baselineEmi },
              { label: "Interest", value: result.baselineInterest },
              { label: "Total paid", value: result.baselinePaid },
            ]}
          />
        </div>
      ) : null}
        </motion.div>
      </AnimatePresence>
      </WealthAnalyticsChrome>

      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Recovery Path Schedule"
        subtitle="Year-wise baseline outstanding, SIP value, and proposed loan-plus-SIP wealth"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthAuditLedger
          className="mb-5"
          stats={[
            { label: "Baseline", value: `${baselineYears} yr` },
            { label: "Proposed", value: `${proposedYears} yr`, tone: "emerald" },
            { label: "Extra wealth", value: formatINRCurrency(result.additionalWealth) },
          ]}
          columns={["Metric", "Amount"]}
          rows={[
            { label: "Baseline interest", cells: [{ text: formatINRCurrency(result.baselineInterest) }] },
            { label: "Proposed interest", cells: [{ text: formatINRCurrency(result.proposedInterest) }] },
            {
              label: "Additional wealth",
              cells: [{ text: formatINRCurrency(result.additionalWealth) }],
              highlight: true,
            },
          ]}
          note="Year rows below track baseline outstanding, SIP value, and proposed loan-plus-SIP wealth."
        />
        <WealthDataTable
          rows={result.schedule}
          getRowKey={(row) => row.year}
          filterPlaceholder="Filter by year…"
          summary={[
            { label: "Years", value: String(result.schedule.length) },
            { label: "Baseline", value: `${baselineYears}y` },
            { label: "Proposed", value: `${proposedYears}y`, tone: "step" },
            {
              label: "Extra wealth",
              value: formatINRCurrency(result.additionalWealth),
              tone: "std",
            },
          ]}
          note="Baseline is outstanding under the longer tenure. SIP grows from the EMI difference. Proposed wealth is remaining loan balance plus SIP corpus."
          columns={[
            {
              key: "year",
              header: "Year",
              sticky: true,
              searchValue: (row) => String(row.year),
              render: (row) => row.year,
            },
            {
              key: "baseline",
              header: "Baseline outstanding",
              align: "right",
              render: (row) => moneyCell(row.baseline),
            },
            {
              key: "sip",
              header: "SIP value",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.sip),
            },
            {
              key: "loanPlusSip",
              header: "Loan + SIP",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.loanPlusSip),
            },
          ]}
        />
        <div className="mt-5 pt-0.5">
          <WealthDataTable
            rows={compareRows}
            getRowKey={(row) => row.label}
            hideFilter
            highlightLast
            note="Baseline is the original loan path. Proposed redirects EMI savings into SIP."
            columns={[
              {
                key: "label",
                header: "Metric",
                sticky: true,
                render: (row) => row.label,
              },
              {
                key: "baseline",
                header: "Baseline",
                align: "right",
                render: (row) => row.baseline,
              },
              {
                key: "proposed",
                header: "Proposed + SIP",
                align: "right",
                tone: "emerald",
                render: (row) => row.proposed,
              },
            ]}
          />
        </div>
      </WealthSection>
    </div>
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
  openSchedule,
  onToggleSchedule,
}: {
  result: VehicleResult;
  onRoadCost: number;
  loanAmount: number;
  returnsByOption: Record<string, number | null>;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
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
  const [vehicleTab, setVehicleTab] = useState<"compare" | "stack" | "results">("compare");
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
      fill: isBest ? wealthChart.stepUp : wealthChart.invested,
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
    <div className="flex flex-col gap-4">
      <WealthSection
        badge="02 · Milestones"
        title="Vehicle Financing Milestones"
        subtitle="Best path, EMI, tax saved, and top ranked options"
        open={openMilestones}
        onToggle={onToggleMilestones}
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {best ? best.name : "Compare options"}
          </span>
        }
      >
      <div className="grid w-full grid-cols-1 gap-2 min-[640px]:grid-cols-4">
        <div className="relative flex min-h-[5.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Best financing path
          </div>
          {best ? (
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                  Rank #1
                </div>
                <div className="mt-0.5 text-sm font-semibold text-emerald-900">
                  {best.name}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-emerald-700">
                  {formatINRCurrency(best.financialBenefit)}
                </div>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                  {vsNoLoan > 0 ? "Vs no loan" : "Edge vs #2"}
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-900">
                  {vsNoLoan > 0
                    ? formatINRCurrency(vsNoLoan)
                    : vsRunnerUp > 0
                      ? formatINRCurrency(vsRunnerUp)
                      : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-700">
                  {vsNoLoan > 0
                    ? "Extra benefit"
                    : runnerUp
                      ? `Over ${runnerUp.name}`
                      : "Lead"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-sm font-semibold leading-snug text-emerald-900">
              Compare loan-plus-invest options against paying cash.
            </div>
          )}
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard title="EMI" value={result.emi} description="" tone="neutral" />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard
            title="Total tax saved"
            value={result.totalTaxSaved}
            description="Loan interest + depreciation"
            tone="positive"
          />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <WealthMetricCard
            title="Down payment"
            value={downPayment}
            description={`${formatINRCurrency(loanAmount)} financed`}
          />
        </div>
      </div>

      {ranked.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ranked.slice(0, 3).map((opt) => {
            const rank = rankByName[opt.name] ?? 0;
            const isBest = rank === 1;
            return (
              <div
                key={opt.name}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${
                  isBest
                    ? "border-emerald-200/80 bg-emerald-50 text-emerald-900"
                    : "border-slate-200/80 bg-white text-slate-900"
                }`}
              >
                <span className="font-semibold">#{rank} {opt.name}</span>
                <span className="ml-1.5 tabular-nums text-slate-500">
                  {formatINRCurrency(opt.financialBenefit)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Vehicle Analytics"
        subtitle="Benefit charts and financing breakdown"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
      <WealthAnalyticsChrome
        tabs={
          <WealthSegmented
            variant="underline"
            layoutId="vehicle-analytics"
            value={vehicleTab}
            onChange={setVehicleTab}
            options={[
              { id: "compare", label: "Compare", icon: <IconChart className="h-3.5 w-3.5" /> },
              { id: "stack", label: "Breakdown", icon: <IconDonut className="h-3.5 w-3.5" /> },
              { id: "results", label: "Results", icon: <IconRates className="h-3.5 w-3.5" /> }
            ]}
          />
        }
      >
      <AnimatePresence mode="wait">
        <motion.div
          key={vehicleTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
      {vehicleTab === "compare" ? (
        <div className="space-y-4">
<WealthCompareBars
            showBarLabels
            height="h-[360px] sm:h-[400px]"
            data={compareData.map((row) => ({
              category: row.category,
              benefit: row.benefit,
            }))}
            series={[
              {
                key: "benefit",
                label: "Financial benefit",
                color: wealthChart.stepUp,
              },
            ]}
          />
          <div className="-mt-1 px-0.5 text-xs text-slate-400">
            Sorted best to worst. Assumes the loan amount is invested at each option&apos;s return
            while the EMI runs.
          </div>
        </div>
      ) : null}
      {vehicleTab === "stack" ? (
        <div className="space-y-4">
<WealthStackedBars
            height="h-[320px] sm:h-[360px]"
            data={stackedData}
            series={[
              {
                key: "taxShield",
                label: "Tax shield",
                color: wealthChart.invested,
              },
              {
                key: "opportunity",
                label: "After-tax investment gain",
                color: wealthChart.stepUp,
              },
              {
                key: "netBenefit",
                label: "Net financial benefit",
                color: wealthChart.tax,
              },
            ]}
          />
          <div className="-mt-1 px-0.5 text-xs text-slate-400">
            Tax shield is the loan interest and depreciation tax benefit. Investment gain is
            after-tax profit on deploying the loan. Net benefit is the final outcome per option.
            Segments are shown for comparison and are not strictly additive.
          </div>
        </div>
      ) : null}
      {vehicleTab === "results" ? (
        <div className="space-y-4">
<div className="space-y-4 lg:col-span-5">
          <WealthResultCard
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
        </div>
        </div>
      ) : null}
        </motion.div>
      </AnimatePresence>
      </WealthAnalyticsChrome>

      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Ranking and Depreciation Schedule"
        subtitle="Investment option ranking and year-wise vehicle depreciation ledger"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthAuditLedger
          className="mb-5"
          stats={[
            { label: "Options", value: String(ranked.length) },
            {
              label: "Best benefit",
              value: best ? formatINRCurrency(best.financialBenefit) : "—",
              tone: "emerald",
            },
            { label: "Tax saved", value: formatINRCurrency(result.totalTaxSaved) },
          ]}
          columns={["Metric", "Amount"]}
          rows={[
            {
              label: "Best option",
              cells: [{ text: best?.name ?? "—" }],
              highlight: true,
            },
            {
              label: "Total tax saved",
              cells: [{ text: formatINRCurrency(result.totalTaxSaved) }],
            },
          ]}
          note="Ranking rows below compare each financing path. Depreciation follows in the second table."
        />
        <WealthDataTable
          rows={ranked.map((opt) => ({
            rank: rankByName[opt.name] ?? 0,
            name: opt.name,
            returnPct: returnsByOption[opt.name],
            maturity: opt.maturity,
            netProfit: opt.netProfit,
            financialBenefit: opt.financialBenefit,
            isBest: best?.name === opt.name,
          }))}
          getRowKey={(row) => row.name}
          filterPlaceholder="Filter options…"
          summary={[
            { label: "Options", value: String(ranked.length) },
            {
              label: "Best benefit",
              value: best ? formatINRCurrency(best.financialBenefit) : "—",
              tone: "step",
            },
            {
              label: "Tax saved",
              value: formatINRCurrency(result.totalTaxSaved),
              tone: "std",
            },
            { label: "EMI", value: formatINRCurrency(result.emi) },
          ]}
          note="Rank sorts by financial benefit. Investment value is the projected corpus if the loan amount is invested at that option's return."
          columns={[
            {
              key: "rank",
              header: "Rank",
              sticky: true,
              searchValue: (row) => String(row.rank),
              render: (row) => `#${row.rank}`,
            },
            {
              key: "name",
              header: "Option",
              searchValue: (row) => row.name,
              render: (row) => (
                <span>
                  {row.name}
                  {row.isBest ? (
                    <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Best
                    </span>
                  ) : null}
                </span>
              ),
            },
            {
              key: "returnPct",
              header: "Return",
              align: "right",
              render: (row) =>
                row.returnPct == null ? "—" : formatPercent(row.returnPct, 0),
            },
            {
              key: "maturity",
              header: "Investment value",
              align: "right",
              render: (row) =>
                row.maturity > 0 ? moneyCell(row.maturity) : "—",
            },
            {
              key: "netProfit",
              header: "Net profit",
              align: "right",
              render: (row) =>
                row.name === "No loan" && row.netProfit === 0
                  ? "—"
                  : moneyCell(row.netProfit),
            },
            {
              key: "financialBenefit",
              header: "Benefit",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.financialBenefit),
            },
          ]}
        />

        <div className="mt-6">
          <WealthDataTable
            rows={depRows as Array<{
              year: number | string;
              value: number | null;
              depreciation: number;
              balance: number;
            }>}
            getRowKey={(row, i) => `${row.year}-${i}`}
            filterPlaceholder="Filter by year…"
            summary={[
              { label: "Years", value: String(result.depreciation.length) },
              {
                label: "Total depreciation",
                value: formatINRCurrency(result.totalDepreciation),
                tone: "std",
              },
              {
                label: "Ending balance",
                value: formatINRCurrency(lastDep?.balance ?? 0),
                tone: "step",
              },
            ]}
            note="Value is opening book value for the year. Depreciation and closing balance follow the vehicle loan schedule assumptions."
            columns={[
              {
                key: "year",
                header: "Year",
                sticky: true,
                searchValue: (row) => String(row.year),
                render: (row) => row.year,
              },
              {
                key: "value",
                header: "Value",
                align: "right",
                render: (row) =>
                  typeof row.value === "number" ? moneyCell(row.value) : "—",
              },
              {
                key: "depreciation",
                header: "Depreciation",
                align: "right",
                tone: "amber",
                render: (row) => moneyCell(row.depreciation),
              },
              {
                key: "balance",
                header: "Balance",
                align: "right",
                tone: "emerald",
                render: (row) => moneyCell(row.balance),
              },
            ]}
          />
        </div>
      </WealthSection>
    </div>
  );
}
