"use client";

import { useMemo, useRef, useState } from "react";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  INSURANCE_IRR_REPORT_ID,
  InsuranceIrrDossier,
} from "@/components/reports/insurance-irr-dossier";
import {
  INSURANCE_TP_REPORT_ID,
  InsuranceTpDossier,
} from "@/components/reports/insurance-tp-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import {
  formatINRCurrency,
  formatPercent,
  ageError,
  emailError,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageDescription, getCalculatorPageTitle } from "@/lib/calculator-nav";
import {
  IconCalendar,
  IconChart,
  IconChevron,
  IconDonut,
  IconPerson,
  IconRates,
  IconRefresh,
  IconStepUp,
  IconTarget,
  IconTimeline,
  WEALTH_CONTENT_CLASS,
  WealthAgeField,
  WealthCompareBars,
  WealthDataTable,
  WealthDisclaimer,
  WealthGrowthLine,
  WealthHero,
  WealthMetricCard,
  WealthMixDonut,
  WealthMoneyField,
  WealthPercentField,
  WealthProfileGrid,
  WealthSection,
  WealthSegmented,
  WealthStatusNote,
  WealthTextField,
  WealthYearField,
  WealthIconMark,
  wealthChart,
  wealthMixColors,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
} from "@/components/wealth";

const PREMIUM_MIN = 1_000;
const PREMIUM_MAX = 1_00_00_000;
const PREMIUM_PRESETS = [
  { label: "₹25k", value: 25_000 },
  { label: "₹50k", value: 50_000 },
  { label: "₹1L", value: 1_00_000 },
  { label: "₹2L", value: 2_00_000 },
  { label: "₹5L", value: 5_00_000 },
  { label: "₹10L", value: 10_00_000 },
];
const CORPUS_MIN = 10_000;
const CORPUS_MAX = 10_00_00_000;
const YEARS_SLIDER_MAX = 40;

const MODES = [
  { id: "irr", label: "IRR" },
  { id: "switch", label: "Term + invest" },
] as const;

const MODE_IDS = MODES.map((m) => m.id);

type IrrResult = {
  totalPremium: number;
  maturity: number;
  gain: number;
  tax: number;
  net: number;
  xirr: number;
  payTermRate: number;
};

type TpResult = {
  remainingPremiums: number;
  investmentPeriodYears: number;
  additionalWealth: number;
  termCover: number;
  keep: { totalPremium: number; maturity: number; tax: number; net: number; irr: number };
  switch: {
    surrenderValue: number;
    termCost: number;
    investMaturity: number;
    irr: number;
    surrenderIrr: number;
    totalPaidToDate: number;
    sipRedirectAnnual: number;
    corpusPath: Array<{ year: number; corpus: number }>;
  };
  compare: Array<{ category: string; keep: number; switch: number }>;
};

type IrrAnalyticsTab = "mix" | "compare";
type TpAnalyticsTab = "compare" | "growth" | "funding";

export function InsuranceCalculator() {
  const [mode] = useCalculatorMode(MODE_IDS, "irr");
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState(42);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);

  const [premium, setPremium] = useState(200_000);
  const [payTerm, setPayTerm] = useState(5);
  const [corpusAtPayEnd, setCorpusAtPayEnd] = useState(1_160_000);
  const [policyTerm, setPolicyTerm] = useState(20);
  const [ret, setRet] = useState(11);
  const [tax, setTax] = useState(12.5);

  const [tpName, setTpName] = useState("Lucky Singh");
  const [tpAge, setTpAge] = useState(51);
  const [tpEmail, setTpEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [tpPhone, setTpPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [tpPremium, setTpPremium] = useState(300_000);
  const [tpPay, setTpPay] = useState(5);
  const [yearsPaid, setYearsPaid] = useState(3);
  const [tpPol, setTpPol] = useState(20);
  const [yearsLeft, setYearsLeft] = useState(11);
  const [maturity, setMaturity] = useState(5_000_000);
  const [tpTax, setTpTax] = useState(20);
  const [surrender, setSurrender] = useState(3_000_000);
  const [termPrem, setTermPrem] = useState(10_000);
  const [termYears, setTermYears] = useState(11);
  const [termCover, setTermCover] = useState(10_000_000);
  const [tpRet, setTpRet] = useState(11.88);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const assumptionsRef = useRef<HTMLDivElement>(null);

  const irrNameError = nameError(name);
  const irrAgeError = ageError(age);
  const irrEmailError = emailError(email);
  const irrPhoneError = phoneError(phone);
  const irrPremiumError =
    !(premium > 0) ? "Annual premium must be greater than 0." : undefined;
  const irrPayTermError =
    !(payTerm > 0)
      ? "Premium payment term must be greater than 0."
      : payTerm > policyTerm
        ? "Premium payment term cannot exceed the policy term."
        : undefined;
  const irrCorpusError =
    !(corpusAtPayEnd > 0)
      ? "Corpus at payment end must be greater than 0."
      : undefined;
  const irrPolicyTermError =
    !(policyTerm > 0)
      ? "Policy term must be greater than 0."
      : policyTerm > 50
        ? "Policy term cannot exceed 50 years."
        : undefined;
  const irrReturnError = rateError(ret, "Expected return") ?? (
    ret <= 0 ? "Expected return must be above 0%." : undefined
  );
  const irrTaxError = rateError(tax, "Capital gains tax");

  const irrFieldErrors = [
    irrNameError,
    irrAgeError,
    irrEmailError,
    irrPhoneError,
    irrPremiumError,
    irrPayTermError,
    irrCorpusError,
    irrPolicyTermError,
    irrReturnError,
    irrTaxError,
  ].filter((msg): msg is string => Boolean(msg));
  const irrCanCalculate = irrFieldErrors.length === 0;

  const tpNameError = nameError(tpName);
  const tpAgeErr = ageError(tpAge);
  const tpEmailError = emailError(tpEmail);
  const tpPhoneError = phoneError(tpPhone);
  const tpPremiumError =
    !(tpPremium > 0) ? "Annual premium must be greater than 0." : undefined;
  const tpPayError =
    !(tpPay > 0)
      ? "Premium payment term must be greater than 0."
      : tpPay > tpPol
        ? "Premium payment term cannot exceed the policy term."
        : undefined;
  const tpYearsPaidError =
    yearsPaid < 0
      ? "Years paid cannot be negative."
      : yearsPaid > tpPay
        ? "Years paid cannot exceed the premium payment term."
        : undefined;
  const tpPolError =
    !(tpPol > 0)
      ? "Policy term must be greater than 0."
      : tpPol > 50
        ? "Policy term cannot exceed 50 years."
        : undefined;
  const tpYearsLeftError =
    !(yearsLeft > 0)
      ? "Years to maturity must be greater than 0."
      : yearsLeft > tpPol
        ? "Years to maturity cannot exceed the policy term."
        : undefined;
  const tpMaturityError =
    !(maturity > 0) ? "Maturity value must be greater than 0." : undefined;
  const tpSurrenderError =
    surrender < 0 ? "Surrender value cannot be negative." : undefined;
  const tpSurrenderWarn =
    surrender > maturity && maturity > 0
      ? "Surrender value is higher than maturity value. Confirm this matches the insurer quote."
      : undefined;
  const tpTermPremError =
    termPrem < 0 ? "Term premium cannot be negative." : undefined;
  const tpTermYearsError =
    !(termYears > 0) ? "Term years must be greater than 0." : undefined;
  const tpRetError = rateError(tpRet, "Expected investment return") ?? (
    tpRet <= 0 ? "Expected investment return must be above 0%." : undefined
  );
  const tpTaxError = rateError(tpTax, "Tax on gain");

  const tpFieldErrors = [
    tpNameError,
    tpAgeErr,
    tpEmailError,
    tpPhoneError,
    tpPremiumError,
    tpPayError,
    tpYearsPaidError,
    tpPolError,
    tpYearsLeftError,
    tpMaturityError,
    tpSurrenderError,
    tpTermPremError,
    tpTermYearsError,
    tpRetError,
    tpTaxError,
  ].filter((msg): msg is string => Boolean(msg));
  const tpCanCalculate = tpFieldErrors.length === 0;

  const fieldErrors = mode === "irr" ? irrFieldErrors : tpFieldErrors;
  const canCalculate = mode === "irr" ? irrCanCalculate : tpCanCalculate;

  const input = useMemo(() => {
    if (mode === "irr") {
      return {
        clientName: name,
        age,
        premium,
        payTerm,
        corpusAtPayEnd,
        policyTerm,
        returnPct: ret,
        taxPct: tax,
      };
    }
    return {
      clientName: tpName,
      age: tpAge,
      premium: tpPremium,
      payTerm: tpPay,
      yearsPaid,
      policyTerm: tpPol,
      yearsToMaturity: yearsLeft,
      maturityValue: maturity,
      taxPct: tpTax,
      surrenderValue: surrender,
      termPremium: termPrem,
      termYears,
      termCover,
      returnPct: tpRet,
    };
  }, [
    mode,
    name,
    age,
    premium,
    payTerm,
    corpusAtPayEnd,
    policyTerm,
    ret,
    tax,
    tpName,
    tpAge,
    tpPremium,
    tpPay,
    yearsPaid,
    tpPol,
    yearsLeft,
    maturity,
    tpTax,
    surrender,
    termPrem,
    termYears,
    termCover,
    tpRet,
  ]);

  const calculatorId = mode === "irr" ? "insurance-irr" : "insurance-tp";
  const { result, error, loading } = useCalculate<IrrResult & Partial<TpResult>>(
    calculatorId,
    input,
    canCalculate,
  );

  const resetDefaults = () => {
    if (mode === "irr") {
      setName("Mr. John Doe");
      setAge(42);
      setEmail(DUMMY_REPORT_CONTACT.email);
      setPhone(DUMMY_REPORT_CONTACT.phone);
      setPremium(200_000);
      setPayTerm(5);
      setCorpusAtPayEnd(1_160_000);
      setPolicyTerm(20);
      setRet(11);
      setTax(12.5);
      return;
    }
    setTpName("Lucky Singh");
    setTpAge(51);
    setTpEmail(DUMMY_REPORT_CONTACT.email);
    setTpPhone(DUMMY_REPORT_CONTACT.phone);
    setTpPremium(300_000);
    setTpPay(5);
    setYearsPaid(3);
    setTpPol(20);
    setYearsLeft(11);
    setMaturity(5_000_000);
    setTpTax(20);
    setSurrender(3_000_000);
    setTermPrem(10_000);
    setTermYears(11);
    setTermCover(10_000_000);
    setTpRet(11.88);
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    if (mode === "irr") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          INSURANCE_IRR_REPORT_ID,
          `insurance-irr-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "switch") {
      setIsDownloading(true);
      try {
        const safe = (tpName || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          INSURANCE_TP_REPORT_ID,
          `insurance-tp-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const profileName = mode === "irr" ? name : tpName;
  const profileAge = mode === "irr" ? age : tpAge;
  const profileEmail = mode === "irr" ? email : tpEmail;
  const profilePhone = mode === "irr" ? phone : tpPhone;
  const profileTenure = mode === "irr" ? policyTerm : yearsLeft;
  const strategy =
    mode === "irr" ? "Traditional policy IRR" : "Term plus invest switch";
  const goalLabel =
    mode === "irr" ? "Policy return clarity" : "Keep vs switch decision";

  const irrResult =
    mode === "irr" && result && "maturity" in result && "xirr" in result
      ? (result as IrrResult)
      : null;
  const tpResult =
    mode === "switch" && result && "keep" in result ? (result as TpResult) : null;

  const heroCorpus =
    irrResult?.maturity ??
    tpResult?.switch.investMaturity ??
    (mode === "irr" ? corpusAtPayEnd : maturity);
  const heroSecondary =
    irrResult?.net ??
    tpResult?.keep.net ??
    (mode === "irr" ? premium : tpPremium);
  const heroReturnPct = irrResult
    ? Number.isFinite(irrResult.xirr)
      ? irrResult.xirr * 100
      : ret
    : tpResult && Number.isFinite(tpResult.switch.irr)
      ? tpResult.switch.irr * 100
      : tpRet;

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <CalculatorPage
        title={getCalculatorPageTitle("/insurance", mode)}
        description={getCalculatorPageDescription("/insurance", mode)}
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
            clientName={profileName}
            age={profileAge}
            email={profileEmail}
            phone={profilePhone}
            tenure={profileTenure}
            strategy={strategy}
            goalLabel={goalLabel}
            onEdit={scrollToAssumptions}
            metrics={[
              {
                label: mode === "irr" ? "Gross maturity" : "Switch corpus",
                value: heroCorpus,
                kind: "currency",
                tone: "emerald",
                mark: (
                  <WealthIconMark tone="emerald" className="h-6 w-6">
                    <IconTarget className="h-3.5 w-3.5" />
                  </WealthIconMark>
                ),
              },
              {
                label: mode === "irr" ? "Net after tax" : "Keep net",
                value: heroSecondary,
                kind: "currency",
                tone: "slate",
                mark: (
                  <WealthIconMark className="h-6 w-6">
                    <IconRates className="h-3.5 w-3.5" />
                  </WealthIconMark>
                ),
              },
              {
                label: mode === "irr" ? "Policy XIRR" : "Switch IRR",
                value: heroReturnPct,
                kind: "percent",
                tone: "slate",
              },
            ]}
          />
        }
        form={
          <div ref={assumptionsRef}>
            {mode === "irr" ? (
              <WealthSection
                id="assumptions"
                badge="01 · Profile"
                title="Investor Profile and Assumptions"
                subtitle="Policy premium path, corpus at pay end, and return assumptions for XIRR"
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
                <div className="py-2">
                  <WealthProfileGrid>
                    <WealthTextField
                      label="Client name"
                      value={name}
                      onChange={setName}
                      error={irrNameError}
                      autoComplete="name"
                    />
                    <WealthAgeField
                      value={age}
                      onChange={setAge}
                      error={irrAgeError}
                    />
                    <WealthTextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      error={irrEmailError}
                      placeholder="client@email.com"
                      autoComplete="email"
                    />
                    <WealthTextField
                      label="Phone"
                      type="tel"
                      value={phone}
                      onChange={setPhone}
                      error={irrPhoneError}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                    <WealthMoneyField
                      label="Annual premium"
                      value={premium}
                      onChange={setPremium}
                      error={irrPremiumError}
                      max={PREMIUM_MAX}
                      slider={{
                        min: PREMIUM_MIN,
                        max: PREMIUM_MAX,
                        step: 10_000,
                        scale: "log",
                        presets: PREMIUM_PRESETS,
                      }}
                    />
                    <WealthYearField
                      label="Pay term"
                      value={payTerm}
                      min={1}
                      max={50}
                      onChange={setPayTerm}
                      error={irrPayTermError}
                      hint="Premium years"
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthMoneyField
                      label="Corpus at pay end"
                      value={corpusAtPayEnd}
                      onChange={setCorpusAtPayEnd}
                      error={irrCorpusError}
                      max={CORPUS_MAX}
                      slider={{
                        min: CORPUS_MIN,
                        max: CORPUS_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthYearField
                      label="Policy term"
                      value={policyTerm}
                      min={1}
                      max={50}
                      onChange={setPolicyTerm}
                      error={irrPolicyTermError}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthPercentField
                      label="Expected return"
                      value={ret}
                      onChange={(v) => setRet(Math.max(0, v))}
                      error={irrReturnError}
                    />
                    <WealthPercentField
                      label="Tax on gain"
                      value={tax}
                      onChange={(v) => setTax(Math.max(0, v))}
                      error={irrTaxError}
                    />
                  </WealthProfileGrid>
                </div>
              </WealthSection>
            ) : (
              <WealthSection
                id="assumptions"
                badge="01 · Profile"
                title="Investor Profile and Assumptions"
                subtitle="Current policy snapshot versus term cover plus redirected investment"
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
                <div className="py-2">
                  <WealthProfileGrid>
                    <WealthTextField
                      label="Client name"
                      value={tpName}
                      onChange={setTpName}
                      error={tpNameError}
                      autoComplete="name"
                    />
                    <WealthAgeField
                      value={tpAge}
                      onChange={setTpAge}
                      error={tpAgeErr}
                    />
                    <WealthTextField
                      label="Email"
                      type="email"
                      value={tpEmail}
                      onChange={setTpEmail}
                      error={tpEmailError}
                      placeholder="client@email.com"
                      autoComplete="email"
                    />
                    <WealthTextField
                      label="Phone"
                      type="tel"
                      value={tpPhone}
                      onChange={setTpPhone}
                      error={tpPhoneError}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                    <WealthMoneyField
                      label="Annual premium"
                      value={tpPremium}
                      onChange={setTpPremium}
                      error={tpPremiumError}
                      max={PREMIUM_MAX}
                      slider={{
                        min: PREMIUM_MIN,
                        max: PREMIUM_MAX,
                        step: 10_000,
                        scale: "log",
                        presets: PREMIUM_PRESETS,
                      }}
                    />
                    <WealthYearField
                      label="Pay term"
                      value={tpPay}
                      min={1}
                      max={50}
                      onChange={setTpPay}
                      error={tpPayError}
                      hint="Original premium years"
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthYearField
                      label="Years paid"
                      value={yearsPaid}
                      min={0}
                      max={50}
                      onChange={setYearsPaid}
                      error={tpYearsPaidError}
                      hint="Already paid"
                    />
                    <WealthYearField
                      label="Policy term"
                      value={tpPol}
                      min={1}
                      max={50}
                      onChange={setTpPol}
                      error={tpPolError}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthYearField
                      label="Yrs to maturity"
                      value={yearsLeft}
                      min={1}
                      max={50}
                      onChange={setYearsLeft}
                      error={tpYearsLeftError}
                      hint={`${yearsLeft}y remaining`}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthMoneyField
                      label="Maturity value"
                      value={maturity}
                      onChange={setMaturity}
                      error={tpMaturityError}
                      max={CORPUS_MAX}
                      slider={{
                        min: CORPUS_MIN,
                        max: CORPUS_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthMoneyField
                      label="Surrender value"
                      value={surrender}
                      onChange={setSurrender}
                      error={tpSurrenderError}
                    />
                    <WealthMoneyField
                      label="Term premium"
                      value={termPrem}
                      onChange={setTermPrem}
                      error={tpTermPremError}
                    />
                    <WealthYearField
                      label="Term years"
                      value={termYears}
                      min={1}
                      max={50}
                      onChange={setTermYears}
                      error={tpTermYearsError}
                      slider={{
                        min: 1,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: WEALTH_YEAR_PRESETS_DEFAULT,
                      }}
                    />
                    <WealthMoneyField
                      label="Term cover"
                      value={termCover}
                      onChange={setTermCover}
                      hint="Sum assured"
                    />
                    <WealthPercentField
                      label="Expected return"
                      value={tpRet}
                      onChange={(v) => setTpRet(Math.max(0, v))}
                      error={tpRetError}
                    />
                    <WealthPercentField
                      label="Tax on gain"
                      value={tpTax}
                      onChange={(v) => setTpTax(Math.max(0, v))}
                      error={tpTaxError}
                    />
                  </WealthProfileGrid>
                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 sm:px-3.5">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Policy snapshot
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-700">
                            Premium years paid
                          </span>
                          <span className="text-[12px] font-semibold tabular-nums text-slate-900">
                            {yearsPaid}
                            <span className="font-medium text-slate-400">/{tpPay}</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-400"
                            style={{
                              width: `${tpPay > 0 ? Math.min(100, (yearsPaid / tpPay) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] leading-snug text-slate-500">
                          {Math.max(0, tpPay - yearsPaid)} premium year
                          {Math.max(0, tpPay - yearsPaid) === 1 ? "" : "s"} still due if you keep
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-700">
                            Years to maturity
                          </span>
                          <span className="text-[12px] font-semibold tabular-nums text-slate-900">
                            {yearsLeft}
                            <span className="font-medium text-slate-400">/{tpPol} term</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width: `${tpPol > 0 ? Math.min(100, ((tpPol - yearsLeft) / tpPol) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] leading-snug text-slate-500">
                          {yearsLeft} year{yearsLeft === 1 ? "" : "s"} remaining on a {tpPol}-year
                          policy
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </WealthSection>
            )}
          </div>
        }
        results={
          <div className="flex flex-col gap-5">
            {!canCalculate ? (
              <WealthStatusNote tone="error">
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
              </WealthStatusNote>
            ) : null}
            {mode === "switch" && canCalculate && tpSurrenderWarn ? (
              <WealthStatusNote tone="info">{tpSurrenderWarn}</WealthStatusNote>
            ) : null}
            {error ? <WealthStatusNote tone="error">{error}</WealthStatusNote> : null}
            {loading && !result && canCalculate ? (
              <WealthStatusNote tone="info">Calculating…</WealthStatusNote>
            ) : null}
            {irrResult ? (
              <IrrResults
                result={irrResult}
                payTerm={payTerm}
                policyTerm={policyTerm}
                expectedReturnPct={ret}
                annualPremium={premium}
                openMilestones={openMilestones}
                onToggleMilestones={() => setOpenMilestones((v) => !v)}
                openAnalytics={openAnalytics}
                onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
                openSchedule={openSchedule}
                onToggleSchedule={() => setOpenSchedule((v) => !v)}
              />
            ) : null}
            {tpResult ? (
              <TpResults
                result={tpResult}
                yearsToMaturity={yearsLeft}
                expectedReturnPct={tpRet}
                termPremium={termPrem}
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
          <WealthDisclaimer
            notes={[
              "Policy illustrations depend on insurer quotes and assumed returns, not guarantees.",
              "Tax treatment follows the rules modeled; actual treatment depends on the product and holding period.",
              "Projections are illustrative. Actual policy values and investment outcomes can differ.",
            ]}
          >
            Figures are for illustration only. Insurance illustrations depend on assumed returns,
            tax treatment, and insurer quotes. They are not a guarantee of policy values or returns.
          </WealthDisclaimer>
        }
      />
      {irrResult ? (
        <InsuranceIrrDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            premium,
            payTerm,
            corpusAtPayEnd,
            policyTerm,
            returnPct: ret,
            taxPct: tax,
            totalPremium: irrResult.totalPremium,
            maturity: irrResult.maturity,
            gain: irrResult.gain,
            tax: irrResult.tax,
            net: irrResult.net,
            xirr: irrResult.xirr,
            payTermRate: irrResult.payTermRate,
          }}
        />
      ) : null}
      {tpResult ? (
        <InsuranceTpDossier
          data={{
            clientName: tpName,
            age: tpAge,
            email: tpEmail,
            phone: tpPhone,
            premium: tpPremium,
            payTerm: tpPay,
            yearsPaid,
            policyTerm: tpPol,
            yearsToMaturity: yearsLeft,
            maturityValue: maturity,
            taxPct: tpTax,
            surrenderValue: surrender,
            termPremium: termPrem,
            termYears,
            termCover,
            returnPct: tpRet,
            remainingPremiums: tpResult.remainingPremiums ?? 0,
            investmentPeriodYears: tpResult.investmentPeriodYears ?? yearsLeft,
            additionalWealth: tpResult.additionalWealth ?? 0,
            keep: tpResult.keep,
            switch: tpResult.switch,
            compare: tpResult.compare ?? [],
          }}
        />
      ) : null}
    </>
  );
}

function IrrResults({
  result,
  payTerm,
  policyTerm,
  expectedReturnPct,
  annualPremium,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  result: IrrResult;
  payTerm: number;
  policyTerm: number;
  expectedReturnPct: number;
  annualPremium: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const [tab, setTab] = useState<IrrAnalyticsTab>("mix");
  const xirrPct = Number.isFinite(result.xirr) ? result.xirr * 100 : null;
  const growthYears = Math.max(0, policyTerm - payTerm);
  const returnScale = Math.max(expectedReturnPct, xirrPct ?? 0, 1);
  const assumedBar = Math.min(100, (expectedReturnPct / returnScale) * 100);
  const xirrBar = xirrPct == null ? 0 : Math.min(100, (xirrPct / returnScale) * 100);
  const xirrGap = xirrPct == null ? null : Math.abs(expectedReturnPct - xirrPct);

  const moneySteps = [
    {
      key: "premium",
      label: "You pay in premiums",
      value: result.totalPremium,
      sign: null as "+" | "−" | "=" | null,
      tone: "muted" as const,
    },
    {
      key: "gain",
      label: "Investment gain",
      value: result.gain,
      sign: "+" as const,
      tone: "gain" as const,
    },
    {
      key: "gross",
      label: "Gross maturity",
      value: result.maturity,
      sign: "=" as const,
      tone: "strong" as const,
    },
    {
      key: "tax",
      label: "Capital gains tax",
      value: result.tax,
      sign: "−" as const,
      tone: "tax" as const,
    },
    {
      key: "net",
      label: "You keep after tax",
      value: result.net,
      sign: "=" as const,
      tone: "net" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <WealthSection
        badge="02 · Milestones"
        title="Policy Return Milestones"
        subtitle="Gross maturity, net after tax, and policy XIRR versus assumed return"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
      >
        <div className="grid w-full grid-cols-1 gap-4 min-[640px]:grid-cols-3">
          <WealthMetricCard
            title="Gross maturity"
            value={result.maturity}
            description={`From ${formatINRCurrency(result.totalPremium)} premiums`}
            badge={`${policyTerm} yr`}
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Net after tax"
            value={result.net}
            description={`Tax ${formatINRCurrency(result.tax)}`}
            badge={`Pay ${payTerm}y`}
            tone="positive"
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconStepUp className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <div className="flex h-full flex-col justify-center rounded-2xl border border-emerald-200/70 bg-emerald-700 p-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-100/80">
              Policy XIRR
            </div>
            <div className="mt-3 text-[32px] font-medium leading-none tracking-tight tabular-nums sm:text-[36px]">
              {xirrPct == null ? "—" : formatPercent(xirrPct, 2)}
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-emerald-100/90">
              {xirrPct == null
                ? "Could not compute for these inputs"
                : xirrGap == null
                  ? `Assumed ${formatPercent(expectedReturnPct, 1)}`
                  : `${formatPercent(xirrGap, 2)} ${
                      xirrPct < expectedReturnPct ? "below" : "above"
                    } assumed ${formatPercent(expectedReturnPct, 1)}`}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3 py-2.5 sm:px-4">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Premium to maturity
            </div>
            <div className="text-[11px] text-slate-500">
              {formatINRCurrency(annualPremium)}/year for {payTerm}y · matures in year {policyTerm}
            </div>
          </div>
          <div className="relative w-full overflow-x-auto pt-1">
            <div
              className="pointer-events-none absolute left-6 right-6 top-[0.95rem] h-0.5 bg-slate-200"
              aria-hidden
            />
            <div className="relative z-[1] flex min-w-[28rem] items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50 text-amber-800">
                  <span className="text-[10px] font-bold">1-{payTerm}</span>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Pay premiums
                  </div>
                  <div className="text-[11px] font-semibold tabular-nums text-amber-800">
                    {formatINRCurrency(result.totalPremium)}
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-500">
                  <span className="text-[10px] font-bold">
                    {growthYears > 0 ? `${payTerm + 1}-${policyTerm}` : "—"}
                  </span>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    No premiums
                  </div>
                  <div className="text-[11px] font-semibold tabular-nums text-slate-500">
                    Growth phase
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-800">
                  <span className="text-[10px] font-bold">Y{policyTerm}</span>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Gross maturity
                  </div>
                  <div className="text-[11px] font-semibold tabular-nums text-emerald-900">
                    {formatINRCurrency(result.maturity)}
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-700 text-white">
                  <span className="text-[10px] font-bold">Net</span>
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    After tax
                  </div>
                  <div className="text-[11px] font-semibold tabular-nums text-emerald-900">
                    {formatINRCurrency(result.net)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Policy Analytics"
        subtitle="Maturity mix and premium compare versus net outcomes"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
        <WealthSegmented
          variant="underline"
          layoutId="insurance-irr-analytics"
          value={tab}
          onChange={setTab}
          options={[
            { id: "mix", label: "Mix", icon: <IconDonut className="h-3.5 w-3.5" /> },
            { id: "compare", label: "Compare", icon: <IconChart className="h-3.5 w-3.5" /> },
          ]}
        />

        <div className="mt-5 pt-0.5">
          {tab === "mix" ? (
            <WealthMixDonut
              title="Gross maturity mix"
              centerLabel="Gross maturity"
              centerValue={result.maturity}
              tax={result.tax}
              net={result.net}
              netLabel="Net after tax"
              slices={[
                {
                  name: "Premium paid",
                  value: result.totalPremium,
                  color: wealthMixColors.invested,
                },
                {
                  name: "Gain",
                  value: result.gain,
                  color: wealthMixColors.gain,
                },
              ]}
            />
          ) : null}

          {tab === "compare" ? (
            <div>
              <WealthCompareBars
                showBarLabels
                data={[
                  {
                    category: "Premiums",
                    value: result.totalPremium,
                  },
                  {
                    category: "Gross maturity",
                    value: result.maturity,
                  },
                  {
                    category: "Net after tax",
                    value: result.net,
                  },
                ]}
                series={[{ key: "value", label: "Amount", color: wealthChart.stepUp }]}
              />
              <div className="mt-2 px-0.5 text-[11px] text-slate-500">
                Tax of {formatINRCurrency(result.tax)} sits between gross and net maturity.
              </div>
            </div>
          ) : null}
        </div>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Cash-Flow Ledger"
        subtitle="Premiums to net maturity, plus assumed return versus policy XIRR"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                How your money moves
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                From premiums paid to what you keep after tax
              </div>
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {moneySteps.map((step) => {
                const rowClass =
                  step.tone === "net"
                    ? "border border-emerald-200/70 bg-emerald-50/80"
                    : step.tone === "tax"
                      ? "border border-amber-200 bg-amber-50/80"
                      : step.tone === "strong"
                        ? "border border-slate-200 bg-slate-50"
                        : "border border-transparent bg-transparent";
                const valueClass =
                  step.tone === "net" || step.tone === "gain"
                    ? "text-emerald-900"
                    : step.tone === "tax"
                      ? "text-amber-900"
                      : "text-slate-900";
                return (
                  <div
                    key={step.key}
                    className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${rowClass}`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {step.sign ? (
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            step.sign === "−"
                              ? "bg-amber-50 text-amber-900"
                              : step.sign === "+"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {step.sign}
                        </span>
                      ) : (
                        <span className="size-5 shrink-0" aria-hidden />
                      )}
                      <span
                        className={`text-[13px] leading-snug ${
                          step.tone === "net" || step.tone === "strong"
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    <div
                      className={`shrink-0 text-right text-[13px] font-semibold tabular-nums sm:text-[14px] ${valueClass}`}
                    >
                      {formatINRCurrency(step.value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Assumed return vs policy XIRR
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-500">
                    Assumed investment return
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-slate-900">
                    {formatPercent(expectedReturnPct, 1)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-400"
                    style={{ width: `${assumedBar}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-emerald-700">
                    Your policy XIRR
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-emerald-900">
                    {xirrPct == null ? "—" : formatPercent(xirrPct, 2)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${xirrBar}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-2.5 text-[11px] text-slate-500">
              {xirrPct == null
                ? "XIRR could not be calculated for this cash-flow pattern."
                : xirrPct < expectedReturnPct
                  ? "Premium timing and tax pull the effective return below the assumed rate."
                  : "Effective policy return meets or exceeds the assumed investment return."}
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2 text-[12px] text-slate-500">
              Pay-term rate{" "}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatPercent(result.payTermRate * 100, 2)}
              </span>
              <span className="ml-1">over the {payTerm} premium years</span>
              {xirrGap != null ? (
                <span className="ml-1">
                  · gap {formatPercent(xirrGap, 2)} vs assumed
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
          Ledger steps walk from total premiums through gain, tax, and net maturity. Annual premium
          assumed is {formatINRCurrency(annualPremium)} for {payTerm} years.
        </p>
      </WealthSection>
    </div>
  );
}

function TpResults({
  result,
  yearsToMaturity,
  expectedReturnPct,
  termPremium,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  result: TpResult;
  yearsToMaturity: number;
  expectedReturnPct: number;
  termPremium: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const [tab, setTab] = useState<TpAnalyticsTab>("compare");
  const keepIrrPct = Number.isFinite(result.keep.irr) ? result.keep.irr * 100 : null;
  const switchIrrPct = Number.isFinite(result.switch.irr) ? result.switch.irr * 100 : null;
  const surrenderIrrPct = Number.isFinite(result.switch.surrenderIrr)
    ? result.switch.surrenderIrr * 100
    : null;
  const additionalWealth =
    result.additionalWealth ?? result.switch.investMaturity - result.keep.net;
  const initialFunding = result.switch.surrenderValue + result.switch.termCost;
  const corpusPath =
    result.switch.corpusPath?.length > 0
      ? result.switch.corpusPath
      : [
          { year: 0, corpus: result.switch.surrenderValue },
          { year: yearsToMaturity, corpus: result.switch.investMaturity },
        ];
  const termCover = result.termCover ?? 0;
  const formatIrr = (pct: number | null) => (pct == null ? "—" : formatPercent(pct, 2));

  return (
    <div className="space-y-5">
      <WealthSection
        badge="02 · Milestones"
        title="Keep vs Switch Milestones"
        subtitle="Net outcomes, IRR, and the wealth impact of switching into term plus invest"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
      >
        <div className="grid w-full grid-cols-1 gap-4 min-[720px]:grid-cols-3">
          <WealthMetricCard
            title="Keep (net)"
            value={result.keep.net}
            description={keepIrrPct == null ? "Policy path" : `IRR ${formatIrr(keepIrrPct)}`}
            badge={`${yearsToMaturity} yr`}
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconRates className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Switch corpus"
            value={result.switch.investMaturity}
            description={
              switchIrrPct == null ? "Term + invest" : `IRR ${formatIrr(switchIrrPct)}`
            }
            tone="positive"
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconStepUp className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Additional wealth"
            value={additionalWealth}
            description="What switching adds"
            tone="accent"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Keep IRR
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900 sm:text-xl">
              {formatIrr(keepIrrPct)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Policy path</div>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Switch IRR
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-emerald-900 sm:text-xl">
              {formatIrr(switchIrrPct)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-700">
              Investment
              {surrenderIrrPct != null ? ` · Surr. ${formatIrr(surrenderIrrPct)}` : null}
            </div>
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-emerald-200/50 bg-emerald-700 px-3 py-3.5 sm:px-4">
          <div
            className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-white/10"
            aria-hidden
          />
          <div className="relative z-[1] flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">
                  <IconStepUp className="size-3.5 shrink-0" aria-hidden />
                  Switch advantage
                </div>
                <div className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
                  Switching could add {formatINRCurrency(additionalWealth)}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <div className="rounded-lg bg-white/12 px-2.5 py-1 text-[11px] text-white">
                  <span className="text-emerald-100/80">Horizon</span>{" "}
                  <span className="font-semibold tabular-nums">{yearsToMaturity}y</span>
                </div>
                <div className="rounded-lg bg-white/12 px-2.5 py-1 text-[11px] text-white">
                  <span className="text-emerald-100/80">Assumed</span>{" "}
                  <span className="font-semibold tabular-nums">
                    {formatPercent(expectedReturnPct, 2)}
                  </span>
                </div>
                {termCover > 0 ? (
                  <div className="rounded-lg bg-white/12 px-2.5 py-1 text-[11px] text-white">
                    <span className="text-emerald-100/80">Cover</span>{" "}
                    <span className="font-semibold tabular-nums">
                      {formatINRCurrency(termCover)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/80">
                  Keep net
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-white sm:text-base">
                  {formatINRCurrency(result.keep.net)}
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-100/80">
                  IRR {formatIrr(keepIrrPct)}
                </div>
              </div>
              <div className="hidden items-center justify-center sm:flex">
                <div className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white">
                  <IconChevron className="size-4 -rotate-90" aria-hidden />
                </div>
              </div>
              <div className="rounded-xl bg-white/15 px-3 py-2.5 ring-1 ring-white/20">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/80">
                  Switch corpus
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-white sm:text-base">
                  {formatINRCurrency(result.switch.investMaturity)}
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-100/80">
                  IRR {formatIrr(switchIrrPct)}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-emerald-100/80">
                <span>Keep share of switch corpus</span>
                <span className="font-semibold tabular-nums text-white">
                  {result.switch.investMaturity > 0
                    ? formatPercent((result.keep.net / result.switch.investMaturity) * 100, 0)
                    : "—"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white/70"
                  style={{
                    width: `${
                      result.switch.investMaturity > 0
                        ? Math.min(100, (result.keep.net / result.switch.investMaturity) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 sm:px-4">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              How the switch works
            </div>
            <div className="text-[11px] text-slate-500">
              Surrender → term cover → invest → grow
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2 xl:grid-cols-4">
            {[
              {
                n: "1",
                label: "Surrender",
                value: formatINRCurrency(result.switch.surrenderValue),
                sub: "Invested today",
                box: "border-amber-200 bg-amber-50/80",
                badge: "border-amber-200 bg-white text-amber-900",
                labelTone: "text-amber-800",
                valueTone: "text-amber-900",
              },
              {
                n: "2",
                label: "Buy term",
                value: `${formatINRCurrency(termPremium)}/yr`,
                sub: termCover > 0 ? `Cover ${formatINRCurrency(termCover)}` : "Life cover",
                box: "border-slate-200 bg-slate-50",
                badge: "border-slate-200 bg-white text-slate-500",
                labelTone: "text-slate-500",
                valueTone: "text-slate-900",
              },
              {
                n: "3",
                label: "Invest rest",
                value: `${formatINRCurrency(result.switch.sipRedirectAnnual)}/yr`,
                sub: "Premium redirected",
                box: "border-emerald-200/70 bg-emerald-50/60",
                badge: "border-emerald-200 bg-white text-emerald-700",
                labelTone: "text-emerald-700",
                valueTone: "text-emerald-900",
              },
              {
                n: "4",
                label: "Projected corpus",
                value: formatINRCurrency(result.switch.investMaturity),
                sub: `In year ${yearsToMaturity}`,
                box: "border-emerald-200/70 bg-emerald-50/80",
                badge: "border-emerald-600 bg-emerald-700 text-white",
                labelTone: "text-emerald-700",
                valueTone: "text-emerald-900",
              },
            ].map((step) => (
              <div
                key={step.n}
                className={`flex items-start gap-2.5 rounded-xl border px-2.5 py-2.5 ${step.box}`}
              >
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${step.badge}`}
                >
                  {step.n}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wide ${step.labelTone}`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`mt-0.5 text-[13px] font-semibold tabular-nums leading-snug ${step.valueTone}`}
                  >
                    {step.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Keep policy
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-[12px]">
              <div>
                <div className="text-[10px] text-slate-500">Gross maturity</div>
                <div className="font-semibold tabular-nums">
                  {formatINRCurrency(result.keep.maturity)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Tax on gain</div>
                <div className="font-semibold tabular-nums text-amber-800">
                  {formatINRCurrency(result.keep.tax)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                <div className="text-[10px] text-slate-500">Net value</div>
                <div className="font-semibold tabular-nums">
                  {formatINRCurrency(result.keep.net)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                <div className="text-[10px] text-slate-500">Keep IRR</div>
                <div className="font-semibold tabular-nums">{formatIrr(keepIrrPct)}</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                Surrender + term + invest
              </div>
              {termCover > 0 ? (
                <div className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-900">
                  {formatINRCurrency(termCover)} cover
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-[12px]">
              <div>
                <div className="text-[10px] text-slate-500">Surrender in</div>
                <div className="font-semibold tabular-nums">
                  {formatINRCurrency(result.switch.surrenderValue)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Term cost</div>
                <div className="font-semibold tabular-nums">
                  {formatINRCurrency(result.switch.termCost)}
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50/80 px-2 py-1.5">
                <div className="text-[10px] text-emerald-700">Projected corpus</div>
                <div className="font-semibold tabular-nums text-emerald-900">
                  {formatINRCurrency(result.switch.investMaturity)}
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50/80 px-2 py-1.5">
                <div className="text-[10px] text-emerald-700">Investment IRR</div>
                <div className="font-semibold tabular-nums text-emerald-900">
                  {formatIrr(switchIrrPct)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Switch Analytics"
        subtitle="Keep versus switch outcomes, corpus path, and funding mix"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
        <WealthSegmented
          variant="underline"
          layoutId="insurance-tp-analytics"
          value={tab}
          onChange={setTab}
          options={[
            { id: "compare", label: "Compare", icon: <IconChart className="h-3.5 w-3.5" /> },
            { id: "growth", label: "Growth", icon: <IconTimeline className="h-3.5 w-3.5" /> },
            { id: "funding", label: "Funding", icon: <IconDonut className="h-3.5 w-3.5" /> },
          ]}
        />

        <div className="mt-5 pt-0.5">
          {tab === "compare" ? (
            <div>
              <WealthCompareBars
                showBarLabels
                data={result.compare}
                series={[
                  { key: "keep", label: "Keep policy", color: wealthChart.tax },
                  { key: "switch", label: "Term + invest", color: wealthChart.stepUp },
                ]}
              />
              <div className="mt-2 px-0.5 text-[11px] text-slate-500">
                Final value under each strategy. Tax and term cost are shown separately.
              </div>
            </div>
          ) : null}

          {tab === "growth" ? (
            <div>
              <WealthGrowthLine
                data={corpusPath}
                xTick={(year) => {
                  if (year === 0) return "Y0";
                  if (year === yearsToMaturity) return `Y${yearsToMaturity}`;
                  if (typeof year === "number" && year % 5 === 0) return `Y${year}`;
                  return `Y${year}`;
                }}
                series={[
                  {
                    key: "corpus",
                    label: "Investment corpus",
                    color: wealthChart.stepUp,
                    kind: "area",
                  },
                ]}
              />
              <div className="mt-2 px-0.5 text-[11px] text-slate-500">
                Year 0 surrender to year {yearsToMaturity} projected corpus.
              </div>
            </div>
          ) : null}

          {tab === "funding" ? (
            <WealthMixDonut
              title="Initial switch funding"
              centerLabel="Initial funding"
              centerValue={initialFunding}
              net={result.switch.investMaturity}
              netLabel="Projected corpus"
              slices={[
                {
                  name: "Surrender invested",
                  value: result.switch.surrenderValue,
                  color: wealthMixColors.invested,
                },
                {
                  name: "Term cost",
                  value: result.switch.termCost,
                  color: wealthMixColors.tax,
                },
              ]}
            />
          ) : null}
        </div>
      </WealthSection>

      <WealthSection
        badge="04 · Ledger"
        title="Strategy Comparison Ledger"
        subtitle="Keep versus switch metrics including IRR and terminal values"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthDataTable
          rows={[
            {
              label: "Initial / surrender",
              keep: "—",
              switch: formatINRCurrency(result.switch.surrenderValue),
            },
            {
              label: "Term cost",
              keep: "—",
              switch: formatINRCurrency(result.switch.termCost),
            },
            {
              label: "Term cover",
              keep: "—",
              switch: termCover > 0 ? formatINRCurrency(termCover) : "—",
            },
            {
              label: "Maturity / corpus",
              keep: formatINRCurrency(result.keep.maturity),
              switch: formatINRCurrency(result.switch.investMaturity),
            },
            {
              label: "Tax",
              keep: formatINRCurrency(result.keep.tax),
              switch: "—",
            },
            {
              label: "Net / final value",
              keep: formatINRCurrency(result.keep.net),
              switch: formatINRCurrency(result.switch.investMaturity),
            },
            {
              label: "IRR",
              keep: formatIrr(keepIrrPct),
              switch: formatIrr(switchIrrPct),
            },
          ]}
          getRowKey={(row) => row.label}
          filterPlaceholder="Filter metrics…"
          summary={[
            {
              label: "Keep net",
              value: formatINRCurrency(result.keep.net),
              tone: "std",
            },
            {
              label: "Switch corpus",
              value: formatINRCurrency(result.switch.investMaturity),
              tone: "step",
            },
            {
              label: "Additional wealth",
              value: formatINRCurrency(additionalWealth),
              tone: "step",
            },
            {
              label: "Term premium",
              value: formatINRCurrency(termPremium),
            },
          ]}
          note={`Surrender IRR ${formatIrr(surrenderIrrPct)}. Investment IRR ${formatIrr(switchIrrPct)}. Expected return assumed ${formatPercent(expectedReturnPct, 1)}.`}
          columns={[
            {
              key: "label",
              header: "Metric",
              sticky: true,
              searchValue: (row) => row.label,
              render: (row) => row.label,
            },
            {
              key: "keep",
              header: "Keep",
              align: "right",
              searchValue: (row) => row.keep,
              render: (row) => row.keep,
            },
            {
              key: "switch",
              header: "Switch",
              align: "right",
              searchValue: (row) => row.switch,
              render: (row) => row.switch,
            },
          ]}
        />
      </WealthSection>
    </div>
  );
}
