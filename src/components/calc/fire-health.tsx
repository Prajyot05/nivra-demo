"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  FINANCIAL_HEALTH_REPORT_ID,
  FinancialHealthDossier,
} from "@/components/reports/financial-health-dossier";
import {
  FIRE_PLANNER_REPORT_ID,
  FirePlannerDossier,
} from "@/components/reports/fire-planner-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import {
  ComboChart,
  formatINRCurrency,
  StackedAreaChart,
  ageError,
  emailError,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";
import {
  ChartFrame,
  IconCalendar,
  IconChart,
  IconCheck,
  IconChevron,
  IconDonut,
  IconFlag,
  IconPerson,
  IconRefresh,
  IconSip,
  IconTarget,
  IconTimeline,
  WEALTH_CONTENT_CLASS,
  WealthAgeField,
  WealthDataTable,
  WealthDisclaimer,
  WealthHero,
  WealthIconMark,
  WealthMetricCard,
  WealthMoneyField,
  WealthPercentField,
  WealthProfileGrid,
  WealthSection,
  WealthSegmented,
  WealthSelectField,
  WealthStatusNote,
  WealthTextField,
  WealthYearField,
  WealthCompareBars,
  WealthGrowthLine,
  WealthMixDonut,
  wealthChart,
  wealthMixColors,
  moneyCell,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
} from "@/components/wealth";

const EXPENSE_MIN = 1_000;
const EXPENSE_MAX = 10_00_000;
const EXPENSE_PRESETS = [
  { label: "₹25k", value: 25_000 },
  { label: "₹50k", value: 50_000 },
  { label: "₹1L", value: 1_00_000 },
  { label: "₹2L", value: 2_00_000 },
  { label: "₹5L", value: 5_00_000 },
];
const CORPUS_MIN = 10_000;
const CORPUS_MAX = 10_00_00_000;
const SIP_MIN = 1_000;
const SIP_MAX = 10_00_000;
const SIP_PRESETS = [
  { label: "₹5k", value: 5_000 },
  { label: "₹10k", value: 10_000 },
  { label: "₹25k", value: 25_000 },
  { label: "₹50k", value: 50_000 },
  { label: "₹1L", value: 1_00_000 },
  { label: "₹2L", value: 2_00_000 },
];
const YEARS_SLIDER_MAX = 40;

type MiniIconProps = { className?: string };
function IconPlus({ className }: MiniIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconTrash({ className }: MiniIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 7h12M9 7V5.5h6V7M8 7l.8 12h6.4L16 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconArrowDown({ className }: MiniIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 5v14M6 13l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconArrowUp({ className }: MiniIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 19V5M6 11l6-6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const BTN_SECONDARY =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50";
const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50";
const BTN_DANGER =
  "inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50";
const PILL = "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium";
const META_TEXT = "text-[11px] text-slate-500";

function DetailPanel({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white ${
        accent ? "border-emerald-200/80" : "border-slate-200/80"
      }`}
    >
      <div
        className={`border-b px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] ${
          accent
            ? "border-emerald-100 bg-emerald-50/60 text-emerald-800"
            : "border-slate-100 bg-slate-50 text-slate-500"
        }`}
      >
        {title}
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <div className="text-sm text-slate-600">{label}</div>
        {hint ? <div className="mt-0.5 text-xs text-slate-400">{hint}</div> : null}
      </div>
      <div
        className={`shrink-0 text-right text-sm font-medium tabular-nums ${
          highlight ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function WealthResultCard({
  title,
  accent,
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
  return (
    <DetailPanel title={title} accent={accent}>
      {items.map((item) => (
        <DetailRow
          key={item.label}
          label={item.label}
          value={
            item.displayValue ??
            (item.value != null ? formatINRCurrency(item.value) : "—")
          }
          hint={item.hint}
          highlight={item.highlight}
        />
      ))}
    </DetailPanel>
  );
}

const MODES = [
  { id: "fire", label: "FIRE" },
  { id: "health", label: "Health" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);
const FACTOR_OPTIONS = [
  { value: "200", label: "200%" },
  { value: "190", label: "190%" },
  { value: "180", label: "180%" },
  { value: "170", label: "170%" },
  { value: "160", label: "160%" },
  { value: "150", label: "150%" },
  { value: "140", label: "140%" },
  { value: "130", label: "130%" },
  { value: "120", label: "120%" },
  { value: "110", label: "110%" },
  { value: "100", label: "Same" },
  { value: "90", label: "90%" },
  { value: "80", label: "80%" },
  { value: "70", label: "70%" },
  { value: "60", label: "60%" },
  { value: "50", label: "50%" },
  { value: "40", label: "40%" },
  { value: "30", label: "30%" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "Expense", label: "Expense" },
  { value: "Income", label: "Income" },
];

const FIRE_EVENTS_OPTIONS = [
  { value: "None", label: "None" },
  { value: "Yes", label: "Yes" },
];

const MAX_HEALTH_EVENTS = 5;
const MAX_FIRE_EVENTS = 10;

type HealthEventDraft = {
  id: string;
  age: number;
  amount: number;
  type: "Expense" | "Income";
};

/** Excel event row: Age (P), Income (Q), Expense (R). */
type FireEventDraft = {
  id: string;
  age: number;
  income: number;
  expense: number;
};

function newHealthEvent(age = 62, amount = 20_000_000): HealthEventDraft {
  return {
    id: `ev-${Math.random().toString(36).slice(2, 9)}`,
    age,
    amount,
    type: "Expense",
  };
}

function newFireEvent(age = 50, incomeAmt = 0, expenseAmt = 10_000_000): FireEventDraft {
  return {
    id: `fev-${Math.random().toString(36).slice(2, 9)}`,
    age,
    income: incomeAmt,
    expense: expenseAmt,
  };
}

type FireResult = {
  activeYears: number;
  retiredYears: number;
  monthlyExpAtRet: number;
  lifestyleAtRet: number;
  yearlyExpAtRet: number;
  corpusRequired: number;
  currentAtRetirement: number;
  eventsCorpusAtRetirement: number;
  balanceCorpus: number;
  additionalLumpsum: number;
  excess: boolean;
  monthlySip: number;
  stepUpStartSip: number;
  totalSipInvested: number;
  delayLumpsum: number;
  delaySip: number;
  eventLumpsum: number;
  eventSip: number;
  eventSipUntilAge: number;
  preRetEventCount: number;
  schedule: Array<{
    age: number;
    corpus: number;
    contribution: number;
    withdrawal: number;
    eventAmount: number;
    phase: string;
  }>;
};

type HealthResult = {
  activeYears: number;
  retiredYears: number;
  corpusAtRetirement: number;
  monthlyExpAtRetPlus1: number;
  lifestyleAtRetPlus1: number;
  yearsLasting: number;
  monthsLasting: number;
  remainingAtSurvival: number;
  remainingPvToday: number;
  funded: boolean;
  message: string;
  gapAtRetirement: number;
  schedule: Array<{
    age: number;
    corpus: number;
    yearlyExpense: number;
    eventAmount: number;
    phase: string;
  }>;
};

export function FireHealthCalculator() {
  const [mode, setMode] = useCalculatorMode(MODE_IDS, "fire");
  const assumptionsRef = useRef<HTMLDivElement>(null);

  const [fireName, setFireName] = useState("Sanjay Gupta");
  const [age, setAge] = useState(40);
  const [fireEmail, setFireEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [firePhone, setFirePhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [retAge, setRetAge] = useState(55);
  const [survAge, setSurvAge] = useState(90);
  const [monthlyExp, setMonthlyExp] = useState(150_000);
  const [lifestyle, setLifestyle] = useState(1_500_000);
  const [mFactor, setMFactor] = useState("100");
  const [lFactor, setLFactor] = useState("100");
  const [infl, setInfl] = useState(5.75);
  const [ret, setRet] = useState(12);
  const [retAfter, setRetAfter] = useState(8);
  const [tax, setTax] = useState(12.5);
  const [c1Amt, setC1Amt] = useState(5_000_000);
  const [c1Ret, setC1Ret] = useState(9);
  const [c2Amt, setC2Amt] = useState(3_500_000);
  const [c2Ret, setC2Ret] = useState(12);
  const [c3Amt, setC3Amt] = useState(0);
  const [c3Ret, setC3Ret] = useState(0);
  const [curSip, setCurSip] = useState(10_000);
  const [curSipRet, setCurSipRet] = useState(10);
  const [limitSip, setLimitSip] = useState(0);
  const [stepUp, setStepUp] = useState(10);
  const [stepUpEvery, setStepUpEvery] = useState(1);
  const [delay, setDelay] = useState(3);
  const [eventsMode, setEventsMode] = useState<"None" | "Yes">("None");
  const [fireEvents, setFireEvents] = useState<FireEventDraft[]>([]);

  const [hName, setHName] = useState("Opinder Jain");
  const [hAge, setHAge] = useState(59);
  const [hEmail, setHEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [hPhone, setHPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [hRet, setHRet] = useState(60);
  const [hSurv, setHSurv] = useState(90);
  const [hCorpus, setHCorpus] = useState(250_000_000);
  const [hExp, setHExp] = useState(350_000);
  const [hSav, setHSav] = useState(100_000);
  const [hLife, setHLife] = useState(2_500_000);
  const [hInfl, setHInfl] = useState(5.75);
  const [hReturn, setHReturn] = useState(9.75);
  const [hAfter, setHAfter] = useState(8);
  const [hTax, setHTax] = useState(12.5);
  const [hBenefit, setHBenefit] = useState(0);
  const [healthEvents, setHealthEvents] = useState<HealthEventDraft[]>([newHealthEvent()]);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);

  const calculatorId = mode === "fire" ? "fire-planner" : "financial-health";

  const fireNameError = nameError(fireName);
  const fireAgeError = ageError(age);
  const fireEmailError = emailError(fireEmail);
  const firePhoneError = phoneError(firePhone);
  const fireRetError =
    retAge <= age
      ? "Retirement age must be greater than current age."
      : retAge > 100
        ? "Enter a valid retirement age."
        : undefined;
  const fireSurvError =
    survAge <= retAge
      ? "Surviving age must be greater than retirement age."
      : survAge > 120
        ? "Enter a valid surviving age."
        : undefined;
  const fireInflError = rateError(infl, "Inflation");
  const fireRetPctError = rateError(ret, "Pre-retirement return");
  const fireAfterError = rateError(retAfter, "Post-retirement return");
  const fireTaxError = rateError(tax, "Tax");
  const fireStepUpError = rateError(stepUp, "Step-up");
  const fireStepEveryError =
    !Number.isInteger(stepUpEvery) || stepUpEvery < 1
      ? "Step-up frequency must be a positive whole number."
      : undefined;
  const activeYears = Math.max(0, retAge - age);
  const fireLimitSipError =
    limitSip < 0
      ? "Limit SIP years cannot be negative."
      : limitSip > 0 && limitSip > activeYears
        ? "Limit SIP years cannot exceed years until retirement."
        : undefined;
  const fireDelayError =
    delay < 0 ? "Delay months cannot be negative." : undefined;
  const fireMoneyError =
    monthlyExp < 0 ||
    lifestyle < 0 ||
    c1Amt < 0 ||
    c2Amt < 0 ||
    c3Amt < 0 ||
    curSip < 0
      ? "Amounts cannot be negative."
      : undefined;

  const fireEventErrorById = useMemo(() => {
    const map = new Map<string, string>();
    if (eventsMode !== "Yes") return map;
    const ages = new Map<number, string>();
    for (const ev of fireEvents) {
      if (ev.age < age) map.set(ev.id, "Event age must be on or after current age.");
      else if (ev.age > survAge)
        map.set(ev.id, "Event age must be on or before surviving age.");
      else if (ev.income < 0 || ev.expense < 0)
        map.set(ev.id, "Income/expense cannot be negative.");
      else if (ev.income <= 0 && ev.expense <= 0)
        map.set(ev.id, "Enter an income and/or expense amount.");
      else if (ages.has(ev.age)) map.set(ev.id, "Duplicate event age.");
      ages.set(ev.age, ev.id);
    }
    return map;
  }, [eventsMode, fireEvents, age, survAge]);

  const fireCanCalculate =
    !fireNameError &&
    !fireAgeError &&
    !fireEmailError &&
    !firePhoneError &&
    !fireRetError &&
    !fireSurvError &&
    !fireInflError &&
    !fireRetPctError &&
    !fireAfterError &&
    !fireTaxError &&
    !fireStepUpError &&
    !fireStepEveryError &&
    !fireLimitSipError &&
    !fireDelayError &&
    !fireMoneyError &&
    fireEventErrorById.size === 0 &&
    (eventsMode === "None" || fireEvents.length > 0);

  const hNameError = nameError(hName);
  const hAgeError = ageError(hAge);
  const hEmailError = emailError(hEmail);
  const hPhoneError = phoneError(hPhone);
  const hRetError =
    hRet < hAge
      ? "Retirement age must be on or after current age."
      : hRet > 100
        ? "Enter a valid retirement age."
        : undefined;
  const hSurvError =
    hSurv < hRet
      ? "Survival age must be on or after retirement age."
      : hSurv > 120
        ? "Enter a valid survival age."
        : undefined;
  const hReturnError = rateError(hReturn, "Pre-retirement return") ??
    (hReturn <= 0 ? "Pre-retirement return must be above 0%." : undefined);
  const hAfterError = rateError(hAfter, "Post-retirement return") ??
    (hAfter <= 0 ? "Post-retirement return must be above 0%." : undefined);
  const hTaxError = rateError(hTax, "Tax");
  const hInflError = rateError(hInfl, "Inflation");
  const eventErrorById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ev of healthEvents) {
      if (ev.age <= hRet) map.set(ev.id, "Event age must be after retirement.");
      else if (ev.age > hSurv) map.set(ev.id, "Event age must be on or before survival.");
      else if (ev.amount < 0) map.set(ev.id, "Event amount cannot be negative.");
    }
    return map;
  }, [healthEvents, hRet, hSurv]);
  const healthCanCalculate =
    !hNameError &&
    !hAgeError &&
    !hEmailError &&
    !hPhoneError &&
    !hRetError &&
    !hSurvError &&
    !hReturnError &&
    !hAfterError &&
    !hTaxError &&
    !hInflError &&
    hCorpus >= 0 &&
    hExp >= 0 &&
    hSav >= 0 &&
    hLife >= 0 &&
    hBenefit >= 0 &&
    eventErrorById.size === 0;

  const fireFieldErrors = [
    fireNameError,
    fireAgeError,
    fireEmailError,
    firePhoneError,
    fireRetError,
    fireSurvError,
    fireInflError,
    fireRetPctError,
    fireAfterError,
    fireTaxError,
    fireStepUpError,
    fireStepEveryError,
    fireLimitSipError,
    fireDelayError,
    fireMoneyError,
    eventsMode === "Yes" && fireEvents.length === 0
      ? "Add at least one major event, or set Major events to None."
      : undefined,
    fireEventErrorById.size > 0 ? "Fix highlighted event rows before calculating." : undefined,
  ].filter((msg): msg is string => Boolean(msg));

  const healthFieldErrors = [
    hNameError,
    hAgeError,
    hEmailError,
    hPhoneError,
    hRetError,
    hSurvError,
    hReturnError,
    hAfterError,
    hTaxError,
    hInflError,
    hCorpus < 0 || hExp < 0 || hSav < 0 || hLife < 0 || hBenefit < 0
      ? "Amounts cannot be negative."
      : undefined,
    eventErrorById.size > 0 ? "Fix highlighted event rows before calculating." : undefined,
  ].filter((msg): msg is string => Boolean(msg));

  const fieldErrors = mode === "fire" ? fireFieldErrors : healthFieldErrors;

  const input = useMemo(() => {
    if (mode === "fire") {
      const slices = [
        { returnPct: c1Ret, amount: c1Amt },
        { returnPct: c2Ret, amount: c2Amt },
        { returnPct: c3Ret, amount: c3Amt },
      ].filter((s) => s.amount > 0);
      return {
        clientName: fireName,
        age,
        retirementAge: retAge,
        survivingAge: survAge,
        monthlyExpenses: monthlyExp,
        lifestyleYearly: lifestyle,
        monthlyExpenseFactorPct: Number(mFactor),
        lifestyleFactorPct: Number(lFactor),
        inflationPct: infl,
        returnPct: ret,
        returnAfterPct: retAfter,
        taxPct: tax,
        corpusSlices: slices,
        currentSipMonthly: curSip,
        currentSipReturnPct: curSipRet,
        limitSipYears: limitSip,
        stepUpPct: stepUp,
        stepUpEveryYears: stepUpEvery,
        delayMonths: delay,
        events:
          eventsMode === "Yes"
            ? fireEvents
                .filter((ev) => ev.income > 0 || ev.expense > 0)
                .map((ev) => ({
                  age: ev.age,
                  income: ev.income,
                  expense: ev.expense,
                }))
            : [],
      };
    }
    return {
      clientName: hName,
      currentCorpus: hCorpus,
      monthlyExpenses: hExp,
      monthlyInvestment: hSav,
      lifestyleYearly: hLife,
      age: hAge,
      retirementAge: hRet,
      survivingAge: hSurv,
      inflationPct: hInfl,
      returnPct: hReturn,
      returnAfterPct: hAfter,
      taxPct: hTax,
      retirementBenefit: hBenefit,
      events: healthEvents
        .filter((ev) => ev.amount > 0)
        .map((ev) => ({
          age: ev.age,
          amount: ev.amount,
          type: ev.type,
        })),
    };
  }, [
    mode,
    fireName,
    age,
    retAge,
    survAge,
    monthlyExp,
    lifestyle,
    mFactor,
    lFactor,
    infl,
    ret,
    retAfter,
    tax,
    c1Amt,
    c1Ret,
    c2Amt,
    c2Ret,
    c3Amt,
    c3Ret,
    curSip,
    curSipRet,
    limitSip,
    stepUp,
    stepUpEvery,
    delay,
    eventsMode,
    fireEvents,
    hName,
    hCorpus,
    hExp,
    hSav,
    hLife,
    hAge,
    hRet,
    hSurv,
    hInfl,
    hReturn,
    hAfter,
    hTax,
    hBenefit,
    healthEvents,
  ]);

  const { result, error, loading } = useCalculate(
    calculatorId,
    input,
    (mode === "fire" && fireCanCalculate) || (mode === "health" && healthCanCalculate),
  );
  const fire = mode === "fire" ? (result as FireResult | null) : null;
  const health = mode === "health" ? (result as HealthResult | null) : null;

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      if (mode === "health") {
        const safe = (hName || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          FINANCIAL_HEALTH_REPORT_ID,
          `financial-health-${safe || "report"}`,
        );
        return;
      }

      const safe = (fireName || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(
        FIRE_PLANNER_REPORT_ID,
        `fire-planner-${safe || "report"}`,
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const resetDefaults = () => {
    if (mode === "fire") {
      setFireName("Sanjay Gupta");
      setAge(40);
      setFireEmail(DUMMY_REPORT_CONTACT.email);
      setFirePhone(DUMMY_REPORT_CONTACT.phone);
      setRetAge(55);
      setSurvAge(90);
      setMonthlyExp(150_000);
      setLifestyle(1_500_000);
      setMFactor("100");
      setLFactor("100");
      setInfl(5.75);
      setRet(12);
      setRetAfter(8);
      setTax(12.5);
      setC1Amt(5_000_000);
      setC1Ret(9);
      setC2Amt(3_500_000);
      setC2Ret(12);
      setC3Amt(0);
      setC3Ret(0);
      setCurSip(10_000);
      setCurSipRet(10);
      setLimitSip(0);
      setStepUp(10);
      setStepUpEvery(1);
      setDelay(3);
      setEventsMode("None");
      setFireEvents([]);
      return;
    }
    setHName("Opinder Jain");
    setHAge(59);
    setHEmail(DUMMY_REPORT_CONTACT.email);
    setHPhone(DUMMY_REPORT_CONTACT.phone);
    setHRet(60);
    setHSurv(90);
    setHCorpus(250_000_000);
    setHExp(350_000);
    setHSav(100_000);
    setHLife(2_500_000);
    setHInfl(5.75);
    setHReturn(9.75);
    setHAfter(8);
    setHTax(12.5);
    setHBenefit(0);
    setHealthEvents([newHealthEvent()]);
  };

  const profileName = mode === "fire" ? fireName : hName;
  const profileAge = mode === "fire" ? age : hAge;
  const profileEmail = mode === "fire" ? fireEmail : hEmail;
  const profilePhone = mode === "fire" ? firePhone : hPhone;

  const heroTenure =
    mode === "fire" ? Math.max(0, retAge - age) : Math.max(0, hSurv - hAge);
  const heroCorpus =
    mode === "fire"
      ? (fire?.corpusRequired ?? 0)
      : (health?.corpusAtRetirement ?? hCorpus);
  const heroSip = mode === "fire" ? (fire?.monthlySip ?? curSip) : hSav;
  const heroReturn = mode === "fire" ? ret : hReturn;

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      <CalculatorPage
        title={getCalculatorPageTitle("/fire", mode)}
        description={
          mode === "health"
            ? "Plan your retirement corpus, spending needs, and long-term financial health."
            : "Plan the corpus and SIP path needed to reach financial independence."
        }
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
            goalLabel={mode === "fire" ? "Financial independence" : "Financial health"}
            tenure={heroTenure}
            strategy={
              mode === "fire" ? "FIRE corpus & SIP path" : "Retirement runway check"
            }
            targetCorpus={heroCorpus}
            monthlySip={heroSip}
            realReturnPct={heroReturn}
            onEdit={scrollToAssumptions}
          />
        }
        form={
          <div ref={assumptionsRef} className="space-y-4">
            <WealthSegmented
              fullWidth
              layoutId="fire-health-mode"
              value={mode}
              onChange={setMode}
              options={MODES.map((m) => ({ id: m.id, label: m.label }))}
            />

            {mode === "fire" ? (
              <WealthSection
                id="assumptions"
                badge="01 · Profile"
                title="FIRE Assumptions"
                subtitle="Corpus path, SIP funding, delay cost, and major life events"
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
                      value={fireName}
                      onChange={setFireName}
                      error={fireNameError}
                      autoComplete="name"
                    />
                    <WealthAgeField
                      value={age}
                      onChange={setAge}
                      error={fireAgeError}
                    />
                    <WealthTextField
                      label="Email"
                      type="email"
                      value={fireEmail}
                      onChange={setFireEmail}
                      error={fireEmailError}
                      placeholder="client@email.com"
                      autoComplete="email"
                    />
                    <WealthTextField
                      label="Phone"
                      type="tel"
                      value={firePhone}
                      onChange={setFirePhone}
                      error={firePhoneError}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                    <WealthYearField
                      label="Retire age"
                      value={retAge}
                      onChange={setRetAge}
                      error={fireRetError}
                      min={0}
                      max={120}
                    />
                    <WealthYearField
                      label="Survive age"
                      value={survAge}
                      onChange={setSurvAge}
                      error={fireSurvError}
                      min={0}
                      max={120}
                    />
                    <WealthMoneyField
                      label="Monthly exp."
                      value={monthlyExp}
                      onChange={setMonthlyExp}
                      max={EXPENSE_MAX}
                      slider={{
                        min: EXPENSE_MIN,
                        max: EXPENSE_MAX,
                        step: 5_000,
                        scale: "log",
                        presets: EXPENSE_PRESETS,
                      }}
                    />
                    <WealthMoneyField
                      label="Lifestyle / yr"
                      value={lifestyle}
                      onChange={setLifestyle}
                      max={CORPUS_MAX}
                      slider={{
                        min: CORPUS_MIN,
                        max: CORPUS_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <div className="min-w-0">
                      <WealthSelectField
                        label="Exp. @ ret"
                        value={mFactor}
                        onChange={setMFactor}
                        options={FACTOR_OPTIONS}
                      />
                    </div>
                    <div className="min-w-0">
                      <WealthSelectField
                        label="Lifestyle @ ret"
                        value={lFactor}
                        onChange={setLFactor}
                        options={FACTOR_OPTIONS}
                      />
                    </div>
                    <WealthMoneyField label="Corpus 1" value={c1Amt} onChange={setC1Amt} />
                    <WealthPercentField label="C1 return" value={c1Ret} onChange={setC1Ret} />
                    <WealthMoneyField label="Corpus 2" value={c2Amt} onChange={setC2Amt} />
                    <WealthPercentField label="C2 return" value={c2Ret} onChange={setC2Ret} />
                    <WealthMoneyField label="Corpus 3" value={c3Amt} onChange={setC3Amt} />
                    <WealthPercentField label="C3 return" value={c3Ret} onChange={setC3Ret} />
                    <WealthMoneyField
                      label="Current SIP"
                      value={curSip}
                      onChange={setCurSip}
                      max={SIP_MAX}
                      slider={{
                        min: SIP_MIN,
                        max: SIP_MAX,
                        step: 1_000,
                        scale: "log",
                        presets: SIP_PRESETS,
                      }}
                    />
                    <WealthPercentField
                      label="SIP return"
                      value={curSipRet}
                      onChange={setCurSipRet}
                    />
                    <WealthYearField
                      label="Limit SIP yrs"
                      value={limitSip}
                      onChange={setLimitSip}
                      error={fireLimitSipError}
                      hint="0 = full"
                      min={0}
                      max={100}
                      slider={{
                        min: 0,
                        max: YEARS_SLIDER_MAX,
                        step: 1,
                        presets: [{ label: "Full", value: 0 }, ...WEALTH_YEAR_PRESETS_DEFAULT],
                      }}
                    />
                    <WealthPercentField
                      label="Step-up %"
                      value={stepUp}
                      onChange={setStepUp}
                      error={fireStepUpError}
                    />
                    <WealthYearField
                      label="Every (yrs)"
                      value={stepUpEvery}
                      onChange={setStepUpEvery}
                      error={fireStepEveryError}
                      min={1}
                      max={50}
                    />
                    <WealthYearField
                      label="Delay (mos)"
                      value={delay}
                      onChange={setDelay}
                      error={fireDelayError}
                      min={0}
                      max={120}
                      suffix="Mos"
                    />
                    <div className="min-w-0">
                      <WealthSelectField
                        label="Major events"
                        value={eventsMode}
                        onChange={(v) => {
                          const next = v === "Yes" ? "Yes" : "None";
                          setEventsMode(next);
                          if (next === "Yes" && fireEvents.length === 0) {
                            setFireEvents([
                              newFireEvent(Math.min(survAge, Math.max(age + 1, age + 5))),
                            ]);
                          }
                        }}
                        options={FIRE_EVENTS_OPTIONS}
                      />
                    </div>
                    <WealthPercentField
                      label="Return (pre)"
                      value={ret}
                      onChange={setRet}
                      error={fireRetPctError}
                    />
                    <WealthPercentField
                      label="Return (post)"
                      value={retAfter}
                      onChange={setRetAfter}
                      error={fireAfterError}
                    />
                    <WealthPercentField
                      label="Tax on gains"
                      value={tax}
                      onChange={setTax}
                      error={fireTaxError}
                    />
                    <WealthPercentField
                      label="Inflation"
                      value={infl}
                      onChange={setInfl}
                      error={fireInflError}
                    />
                  </WealthProfileGrid>
                  {eventsMode === "Yes" ? (
                    <div className="mt-4 min-w-0">
                      <FireEventTimeline
                        events={fireEvents}
                        currentAge={age}
                        retirementAge={retAge}
                        survivalAge={survAge}
                        eventErrorById={fireEventErrorById}
                        atCapacity={fireEvents.length >= MAX_FIRE_EVENTS}
                        onAdd={() =>
                          setFireEvents((prev) => [
                            ...prev,
                            newFireEvent(
                              Math.min(survAge, Math.max(age + 1, retAge - 1)),
                            ),
                          ])
                        }
                        onPatch={(id, patch) =>
                          setFireEvents((prev) =>
                            prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
                          )
                        }
                        onRemove={(id) =>
                          setFireEvents((prev) => prev.filter((row) => row.id !== id))
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </WealthSection>
            ) : (
              <WealthSection
                id="assumptions"
                badge="01 · Profile"
                title="Health Assumptions"
                subtitle="Retirement runway, spending, and post-retirement health events"
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
                      value={hName}
                      onChange={setHName}
                      error={hNameError}
                      autoComplete="name"
                    />
                    <WealthAgeField
                      value={hAge}
                      onChange={setHAge}
                      error={hAgeError}
                    />
                    <WealthTextField
                      label="Email"
                      type="email"
                      value={hEmail}
                      onChange={setHEmail}
                      error={hEmailError}
                      placeholder="client@email.com"
                      autoComplete="email"
                    />
                    <WealthTextField
                      label="Phone"
                      type="tel"
                      value={hPhone}
                      onChange={setHPhone}
                      error={hPhoneError}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                    <WealthYearField
                      label="Retirement age"
                      value={hRet}
                      min={0}
                      max={120}
                      onChange={setHRet}
                      error={hRetError}
                    />
                    <WealthYearField
                      label="Survival age"
                      value={hSurv}
                      min={0}
                      max={120}
                      onChange={setHSurv}
                      error={hSurvError}
                    />
                    <WealthMoneyField
                      label="Current corpus"
                      value={hCorpus}
                      onChange={setHCorpus}
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
                      label="Monthly expense"
                      value={hExp}
                      onChange={setHExp}
                      max={EXPENSE_MAX}
                      slider={{
                        min: EXPENSE_MIN,
                        max: EXPENSE_MAX,
                        step: 5_000,
                        scale: "log",
                        presets: EXPENSE_PRESETS,
                      }}
                    />
                    <WealthMoneyField
                      label="Monthly investment"
                      value={hSav}
                      onChange={setHSav}
                      max={SIP_MAX}
                      slider={{
                        min: SIP_MIN,
                        max: SIP_MAX,
                        step: 1_000,
                        scale: "log",
                        presets: SIP_PRESETS,
                      }}
                    />
                    <WealthMoneyField
                      label="Lifestyle / year"
                      value={hLife}
                      onChange={setHLife}
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
                      label="Retirement benefit"
                      value={hBenefit}
                      onChange={setHBenefit}
                    />
                    <WealthPercentField
                      label="Inflation"
                      value={hInfl}
                      onChange={setHInfl}
                      error={hInflError}
                    />
                    <WealthPercentField
                      label="Pre-ret. return"
                      value={hReturn}
                      onChange={setHReturn}
                      error={hReturnError}
                    />
                    <WealthPercentField
                      label="Post-ret. return"
                      value={hAfter}
                      onChange={setHAfter}
                      error={hAfterError}
                    />
                    <WealthPercentField
                      label="Tax after ret."
                      value={hTax}
                      onChange={setHTax}
                      error={hTaxError}
                    />
                  </WealthProfileGrid>
                  <div className="mt-4 min-w-0">
                    <HealthEventTimeline
                      events={healthEvents}
                      retirementAge={hRet}
                      survivalAge={hSurv}
                      eventErrorById={eventErrorById}
                      atCapacity={healthEvents.length >= MAX_HEALTH_EVENTS}
                      onAdd={() =>
                        setHealthEvents((prev) => [
                          ...prev,
                          newHealthEvent(Math.min(hSurv, Math.max(hRet + 1, hRet + 2))),
                        ])
                      }
                      onPatch={(id, patch) =>
                        setHealthEvents((prev) =>
                          prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
                        )
                      }
                      onRemove={(id) =>
                        setHealthEvents((prev) => prev.filter((row) => row.id !== id))
                      }
                    />
                  </div>
                </div>
              </WealthSection>
            )}
          </div>
        }
        results={
          <div className="flex flex-col gap-3">
            {error ? <WealthStatusNote tone="error">{error}</WealthStatusNote> : null}
            {fieldErrors.length > 0 ? (
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
            {loading && !result && fieldErrors.length === 0 ? (
              <WealthStatusNote tone="info">Calculating…</WealthStatusNote>
            ) : null}
            {fire ? (
              <FireResults
                result={fire}
                age={age}
                retirementAge={retAge}
                survivalAge={survAge}
                delayMonths={delay}
                eventsEnabled={eventsMode === "Yes"}
                events={fireEvents}
                openMilestones={openMilestones}
                onToggleMilestones={() => setOpenMilestones((v) => !v)}
                openAnalytics={openAnalytics}
                onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
                openSchedule={openSchedule}
                onToggleSchedule={() => setOpenSchedule((v) => !v)}
              />
            ) : null}
            {health ? (
              <HealthResults
                result={health}
                retirementAge={hRet}
                survivalAge={hSurv}
                events={healthEvents}
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
              "FIRE timelines are sensitive to spending, inflation, and sequence of returns.",
              "Event schedules (income, expenses, windfalls) reshape the runway when timing shifts.",
              "Projections are illustrative. Actual market returns and longevity can differ.",
            ]}
          >
            Figures are for illustration only. FIRE and financial health projections depend on
            assumed returns, inflation, tax, spending, and event schedules. Markets carry risk; past
            performance does not guarantee future results.
          </WealthDisclaimer>
        }
      />
    {mode === "fire" && fire ? (
      <FirePlannerDossier
        data={{
          clientName: fireName,
          age,
          email: fireEmail,
          phone: firePhone,
          retirementAge: retAge,
          survivingAge: survAge,
          monthlyExpenses: monthlyExp,
          lifestyleYearly: lifestyle,
          monthlyExpenseFactorPct: Number(mFactor),
          lifestyleFactorPct: Number(lFactor),
          inflationPct: infl,
          returnPct: ret,
          returnAfterPct: retAfter,
          taxPct: tax,
          existingCorpus: c1Amt + c2Amt + c3Amt,
          currentSipMonthly: curSip,
          currentSipReturnPct: curSipRet,
          limitSipYears: limitSip,
          stepUpPct: stepUp,
          stepUpEveryYears: stepUpEvery,
          delayMonths: delay,
          events:
            eventsMode === "Yes"
              ? fireEvents
                  .filter((ev) => ev.income > 0 || ev.expense > 0)
                  .map((ev) => ({
                    age: ev.age,
                    income: ev.income,
                    expense: ev.expense,
                  }))
              : [],
          activeYears: fire.activeYears,
          retiredYears: fire.retiredYears,
          monthlyExpAtRet: fire.monthlyExpAtRet,
          lifestyleAtRet: fire.lifestyleAtRet,
          yearlyExpAtRet: fire.yearlyExpAtRet,
          corpusRequired: fire.corpusRequired,
          currentAtRetirement: fire.currentAtRetirement,
          eventsCorpusAtRetirement: fire.eventsCorpusAtRetirement,
          balanceCorpus: fire.balanceCorpus,
          additionalLumpsum: fire.additionalLumpsum,
          excess: fire.excess,
          monthlySip: fire.monthlySip,
          stepUpStartSip: fire.stepUpStartSip,
          totalSipInvested: fire.totalSipInvested,
          delayLumpsum: fire.delayLumpsum,
          delaySip: fire.delaySip,
          eventLumpsum: fire.eventLumpsum,
          eventSip: fire.eventSip,
          eventSipUntilAge: fire.eventSipUntilAge,
          preRetEventCount: fire.preRetEventCount,
          schedule: fire.schedule,
        }}
      />
    ) : null}
    {mode === "health" && health ? (
      <FinancialHealthDossier
        data={{
          clientName: hName,
          age: hAge,
          email: hEmail,
          phone: hPhone,
          retirementAge: hRet,
          survivingAge: hSurv,
          currentCorpus: hCorpus,
          monthlyExpenses: hExp,
          monthlyInvestment: hSav,
          lifestyleYearly: hLife,
          inflationPct: hInfl,
          returnPct: hReturn,
          returnAfterPct: hAfter,
          taxPct: hTax,
          retirementBenefit: hBenefit,
          events: healthEvents
              .filter((ev) => ev.amount > 0)
              .map((ev) => ({
                age: ev.age,
                amount: ev.amount,
                type: ev.type,
              })),
          activeYears: health.activeYears,
          retiredYears: health.retiredYears,
          corpusAtRetirement: health.corpusAtRetirement,
          monthlyExpAtRetPlus1: health.monthlyExpAtRetPlus1,
          lifestyleAtRetPlus1: health.lifestyleAtRetPlus1,
          yearsLasting: health.yearsLasting,
          monthsLasting: health.monthsLasting,
          remainingAtSurvival: health.remainingAtSurvival,
          remainingPvToday: health.remainingPvToday,
          funded: health.funded,
          message: health.message,
          gapAtRetirement: health.gapAtRetirement,
          schedule: health.schedule,
        }}
      />
    ) : null}
    </>
  );
}

function HealthEventTimeline({
  events,
  retirementAge,
  survivalAge,
  eventErrorById,
  atCapacity,
  onAdd,
  onPatch,
  onRemove,
}: {
  events: HealthEventDraft[];
  retirementAge: number;
  survivalAge: number;
  eventErrorById: Map<string, string>;
  atCapacity: boolean;
  onAdd: () => void;
  onPatch: (id: string, patch: Partial<HealthEventDraft>) => void;
  onRemove: (id: string) => void;
}) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.age - b.age || a.id.localeCompare(b.id)),
    [events],
  );

  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [openId, setOpenId] = useState<string | null>(sorted[0]?.id ?? null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sorted.length === 0) {
      setActiveId(null);
      setOpenId(null);
      return;
    }
    if (!activeId || !sorted.some((ev) => ev.id === activeId)) {
      setActiveId(sorted[0]?.id ?? null);
    }
  }, [sorted, activeId]);

  const prevCount = useRef(sorted.length);
  useEffect(() => {
    if (sorted.length > prevCount.current) {
      const added = events[events.length - 1];
      if (added) {
        setActiveId(added.id);
        setOpenId(added.id);
      }
    }
    prevCount.current = sorted.length;
  }, [sorted.length, events]);

  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-event-dot]")) return;
      if (panelRef.current && !panelRef.current.contains(target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openId]);

  const togglePanel = (id: string) => {
    setActiveId(id);
    setOpenId((prev) => (prev === id ? null : id));
  };

  const openEvent = openId ? sorted.find((ev) => ev.id === openId) : null;
  const openError = openEvent ? eventErrorById.get(openEvent.id) : undefined;

  return (
    <div className="space-y-2">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] sm:text-xs">
            Major financial events
          </h3>
          <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
            {events.length} / {MAX_HEALTH_EVENTS}
          </span>
          {sorted.length > 0 ? (
            <span className={META_TEXT}>Click a dot to edit. Sorted by age.</span>
          ) : null}
        </div>
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={onAdd}
          disabled={atCapacity}
        >
          <IconPlus className="size-3.5" />
          Add event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-8 text-center">
          <IconFlag className="mb-2 size-6 text-[var(--app-text-subtle)]" />
          <p className="mb-3 text-[13px] text-[var(--app-text-muted)]">
            No post-retirement events yet.
          </p>
          <button type="button" className={BTN_PRIMARY} onClick={onAdd} disabled={atCapacity}>
            <IconPlus className="size-3.5" />
            Add first event
          </button>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="custom-scrollbar w-full overflow-x-auto pb-3 pt-5">
            <div
              className="relative flex w-full items-start justify-between px-2 sm:px-4"
              style={{
                minWidth: `max(100%, ${5.5 + sorted.length * 7.25 + 5.5}rem)`,
              }}
            >
              <div
                className="pointer-events-none absolute left-[2.75rem] right-[2.75rem] top-[1.375rem] h-0.5 bg-[var(--app-border)]"
                aria-hidden
              />

              <div className="relative z-[1] flex w-[5.5rem] shrink-0 flex-col items-center">
                <div className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--app-primary)] bg-[var(--app-primary)] text-[var(--app-primary-fg)]">
                  <IconChevron className="size-5" />
                </div>
                <div className="mt-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                    Retire
                  </div>
                  <div className="text-xs font-semibold text-[var(--app-text)]">
                    Age {retirementAge}
                  </div>
                </div>
              </div>

              {sorted.map((ev) => {
                const hasErr = eventErrorById.has(ev.id);
                const isActive = activeId === ev.id;
                const isOpen = openId === ev.id;
                const isExpense = ev.type === "Expense";
                const Icon = isExpense ? IconArrowDown : IconArrowUp;

                return (
                  <div
                    key={ev.id}
                    className="relative z-[1] flex w-[6.5rem] shrink-0 flex-col items-center"
                  >
                    <button
                      type="button"
                      data-event-dot
                      className={`relative flex size-11 items-center justify-center rounded-full border-2 transition ${
                        hasErr
                          ? "border-[var(--app-danger)] bg-[var(--app-warn-bg)] text-[var(--app-danger)]"
                          : isActive || isOpen
                            ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)] ring-4 ring-[var(--app-step-text)]/20"
                            : isExpense
                              ? "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-warn-text)] hover:border-[var(--app-primary-soft)]"
                              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-step-text)] hover:border-[var(--app-primary-soft)]"
                      }`}
                      onClick={() => togglePanel(ev.id)}
                      title={`${ev.type} · Age ${ev.age}`}
                      aria-expanded={isOpen}
                    >
                      <Icon className="size-5" />
                      {isActive ? (
                        <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--app-step-text)]" />
                      ) : null}
                    </button>
                    <div className="mt-2 max-w-[6.5rem] text-center">
                      <div className="truncate text-xs font-semibold text-[var(--app-text)]">
                        {ev.type}
                      </div>
                      <div className="text-[10px] text-[var(--app-text-muted)]">Age {ev.age}</div>
                      <div className="truncate text-[10px] tabular-nums text-[var(--app-text-subtle)]">
                        {formatINRCurrency(ev.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="relative z-[1] flex w-[5.5rem] shrink-0 flex-col items-center">
                <div className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                  <IconFlag className="size-5" />
                </div>
                <div className="mt-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                    Survive
                  </div>
                  <div className="text-xs font-semibold text-[var(--app-text)]">
                    Age {survivalAge}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {openEvent ? (
            <div
              ref={panelRef}
              className="relative z-20 mt-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-md sm:p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--app-border)] pb-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--app-text)]">
                    {openEvent.type} at age {openEvent.age}
                  </div>
                  <div className="text-[11px] text-[var(--app-text-muted)]">
                    {formatINRCurrency(openEvent.amount)} · edit and keep on the age path
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={BTN_DANGER}
                    onClick={() => {
                      const id = openEvent.id;
                      setOpenId(null);
                      onRemove(id);
                    }}
                  >
                    <IconTrash className="size-3.5" />
                    Remove
                  </button>
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={() => setOpenId(null)}
                  >
                    <IconCheck className="size-3.5" />
                    Done
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <WealthYearField
                  label="Event age"
                  value={openEvent.age}
                  min={0}
                  max={120}
                  onChange={(age) => onPatch(openEvent.id, { age })}
                  error={openError}
                  hint={!openError ? `After ${retirementAge}, on or before ${survivalAge}` : undefined}
                />
                <WealthMoneyField
                  label="Amount"
                  value={openEvent.amount}
                  onChange={(amount) => onPatch(openEvent.id, { amount })}
                 
                />
                <WealthSelectField
                  label="Type"
                  value={openEvent.type}
                  options={EVENT_TYPE_OPTIONS}
                  onChange={(value) =>
                    onPatch(openEvent.id, {
                      type: value === "Income" ? "Income" : "Expense",
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <p className={META_TEXT}>
              Expense events appear as Net Event Impact after retirement tax in the Age Path.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FireEventTimeline({
  events,
  currentAge,
  retirementAge,
  survivalAge,
  eventErrorById,
  atCapacity,
  onAdd,
  onPatch,
  onRemove,
}: {
  events: FireEventDraft[];
  currentAge: number;
  retirementAge: number;
  survivalAge: number;
  eventErrorById: Map<string, string>;
  atCapacity: boolean;
  onAdd: () => void;
  onPatch: (id: string, patch: Partial<FireEventDraft>) => void;
  onRemove: (id: string) => void;
}) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.age - b.age || a.id.localeCompare(b.id)),
    [events],
  );

  /** Now → events + retire marker by age → Survive (same interaction model as multi-goal / Health). */
  const middle = useMemo(() => {
    type Node =
      | { kind: "retire"; sortAge: number }
      | { kind: "event"; sortAge: number; ev: FireEventDraft };
    const nodes: Node[] = [
      { kind: "retire", sortAge: retirementAge },
      ...sorted.map((ev) => ({ kind: "event" as const, sortAge: ev.age, ev })),
    ];
    nodes.sort((a, b) => {
      if (a.sortAge !== b.sortAge) return a.sortAge - b.sortAge;
      // Same age: events first (pre-ret includes age === retire), then retire marker.
      if (a.kind !== b.kind) return a.kind === "event" ? -1 : 1;
      if (a.kind === "event" && b.kind === "event") {
        return a.ev.id.localeCompare(b.ev.id);
      }
      return 0;
    });
    return nodes;
  }, [sorted, retirementAge]);

  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [openId, setOpenId] = useState<string | null>(sorted[0]?.id ?? null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sorted.length === 0) {
      setActiveId(null);
      setOpenId(null);
      return;
    }
    if (!activeId || !sorted.some((ev) => ev.id === activeId)) {
      setActiveId(sorted[0]?.id ?? null);
    }
  }, [sorted, activeId]);

  const prevCount = useRef(sorted.length);
  useEffect(() => {
    if (sorted.length > prevCount.current) {
      const added = events[events.length - 1];
      if (added) {
        setActiveId(added.id);
        setOpenId(added.id);
      }
    }
    prevCount.current = sorted.length;
  }, [sorted.length, events]);

  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-event-dot]")) return;
      if (panelRef.current && !panelRef.current.contains(target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openId]);

  const togglePanel = (id: string) => {
    setActiveId(id);
    setOpenId((prev) => (prev === id ? null : id));
  };

  const openEvent = openId ? sorted.find((ev) => ev.id === openId) : null;
  const openError = openEvent ? eventErrorById.get(openEvent.id) : undefined;
  const openNet = openEvent ? openEvent.expense - openEvent.income : 0;
  const openPhase =
    openEvent && openEvent.age <= retirementAge ? "Pre-retirement" : "Post-retirement";

  return (
    <div className="space-y-2">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] sm:text-xs">
            Event timeline
          </h3>
          <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
            {events.length} / {MAX_FIRE_EVENTS}
          </span>
          {sorted.length > 0 ? (
            <span className={META_TEXT}>Click a dot to edit. Sorted by age.</span>
          ) : null}
        </div>
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={onAdd}
          disabled={atCapacity}
        >
          <IconPlus className="size-3.5" />
          Add event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-8 text-center">
          <IconFlag className="mb-2 size-6 text-[var(--app-text-subtle)]" />
          <p className="mb-3 text-[13px] text-[var(--app-text-muted)]">
            No major events yet. Add income or expense cash flows along the plan.
          </p>
          <button type="button" className={BTN_PRIMARY} onClick={onAdd} disabled={atCapacity}>
            <IconPlus className="size-3.5" />
            Add first event
          </button>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="custom-scrollbar w-full overflow-x-auto pb-3 pt-5">
            <div
              className="relative flex w-full items-start justify-between px-2 sm:px-4"
              style={{
                minWidth: `max(100%, ${5.5 + middle.length * 7.25 + 5.5}rem)`,
              }}
            >
              <div
                className="pointer-events-none absolute left-[2.75rem] right-[2.75rem] top-[1.375rem] h-0.5 bg-[var(--app-border)]"
                aria-hidden
              />

              <div className="relative z-[1] flex w-[5.5rem] shrink-0 flex-col items-center">
                <div className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--app-primary)] bg-[var(--app-primary)] text-[var(--app-primary-fg)]">
                  <IconChevron className="size-5" />
                </div>
                <div className="mt-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                    Now
                  </div>
                  <div className="text-xs font-semibold text-[var(--app-text)]">
                    Age {currentAge}
                  </div>
                </div>
              </div>

              {middle.map((node) => {
                if (node.kind === "retire") {
                  return (
                    <div
                      key="retire-marker"
                      className="relative z-[1] flex w-[6.5rem] shrink-0 flex-col items-center"
                    >
                      <div className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-sm font-bold text-[var(--app-step-text-strong)]">
                        R
                      </div>
                      <div className="mt-2 max-w-[6.5rem] text-center">
                        <div className="text-xs font-semibold text-[var(--app-text)]">Retire</div>
                        <div className="text-[10px] text-[var(--app-text-muted)]">
                          Age {retirementAge}
                        </div>
                      </div>
                    </div>
                  );
                }

                const ev = node.ev;
                const hasErr = eventErrorById.has(ev.id);
                const isActive = activeId === ev.id;
                const isOpen = openId === ev.id;
                const net = ev.expense - ev.income;
                const isExpenseHeavy = net >= 0;
                const Icon = isExpenseHeavy ? IconArrowDown : IconArrowUp;
                const label =
                  ev.income > 0 && ev.expense > 0
                    ? "Mixed"
                    : ev.expense > 0
                      ? "Expense"
                      : ev.income > 0
                        ? "Income"
                        : "Event";
                const phase = ev.age <= retirementAge ? "Pre" : "Post";

                return (
                  <div
                    key={ev.id}
                    className="relative z-[1] flex w-[6.5rem] shrink-0 flex-col items-center"
                  >
                    <button
                      type="button"
                      data-event-dot
                      className={`relative flex size-11 items-center justify-center rounded-full border-2 transition ${
                        hasErr
                          ? "border-[var(--app-danger)] bg-[var(--app-warn-bg)] text-[var(--app-danger)]"
                          : isActive || isOpen
                            ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)] ring-4 ring-[var(--app-step-text)]/20"
                            : isExpenseHeavy
                              ? "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-warn-text)] hover:border-[var(--app-primary-soft)]"
                              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-step-text)] hover:border-[var(--app-primary-soft)]"
                      }`}
                      onClick={() => togglePanel(ev.id)}
                      title={`${label} · Age ${ev.age} · ${phase}`}
                      aria-expanded={isOpen}
                    >
                      <Icon className="size-5" />
                      {isActive ? (
                        <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--app-step-text)]" />
                      ) : null}
                    </button>
                    <div className="mt-2 max-w-[6.5rem] text-center">
                      <div className="truncate text-xs font-semibold text-[var(--app-text)]">
                        {label}
                      </div>
                      <div className="text-[10px] text-[var(--app-text-muted)]">
                        Age {ev.age} · {phase}
                      </div>
                      <div className="truncate text-[10px] tabular-nums text-[var(--app-text-subtle)]">
                        {ev.income > 0 && ev.expense > 0
                          ? `Net ${formatINRCurrency(Math.abs(net))}`
                          : formatINRCurrency(ev.expense > 0 ? ev.expense : ev.income)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="relative z-[1] flex w-[5.5rem] shrink-0 flex-col items-center">
                <div className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                  <IconFlag className="size-5" />
                </div>
                <div className="mt-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                    Survive
                  </div>
                  <div className="text-xs font-semibold text-[var(--app-text)]">
                    Age {survivalAge}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {openEvent ? (
            <div
              ref={panelRef}
              className="relative z-20 mt-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-md sm:p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--app-border)] pb-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--app-text)]">
                    Event at age {openEvent.age}
                  </div>
                  <div className="text-[11px] text-[var(--app-text-muted)]">
                    {openPhase}
                    {openEvent.income > 0 || openEvent.expense > 0
                      ? ` · net ${formatINRCurrency(Math.abs(openNet))} ${openNet >= 0 ? "expense" : "income"}`
                      : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={BTN_DANGER}
                    onClick={() => {
                      const id = openEvent.id;
                      setOpenId(null);
                      onRemove(id);
                    }}
                  >
                    <IconTrash className="size-3.5" />
                    Remove
                  </button>
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={() => setOpenId(null)}
                  >
                    <IconCheck className="size-3.5" />
                    Done
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <WealthYearField
                  label="Event age"
                  value={openEvent.age}
                  min={0}
                  max={120}
                  onChange={(nextAge) => onPatch(openEvent.id, { age: nextAge })}
                  error={openError}
                  hint={
                    !openError
                      ? `After ${currentAge}, on or before ${survivalAge}`
                      : undefined
                  }
                />
                <WealthMoneyField
                  label="Income"
                  value={openEvent.income}
                  onChange={(income) => onPatch(openEvent.id, { income })}
                 
                />
                <WealthMoneyField
                  label="Expense"
                  value={openEvent.expense}
                  onChange={(expense) => onPatch(openEvent.id, { expense })}
                 
                />
              </div>
            </div>
          ) : (
            <p className={META_TEXT}>
              Pre-retirement expenses need SIP or lumpsum funding. Post-retirement events
              adjust corpus drawdown.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FireResults({
  result,
  age,
  retirementAge,
  survivalAge,
  delayMonths,
  eventsEnabled,
  events,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  result: FireResult;
  age: number;
  retirementAge: number;
  survivalAge: number;
  delayMonths: number;
  eventsEnabled: boolean;
  events: FireEventDraft[];
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const [analyticsTab, setAnalyticsTab] = useState<"corpus" | "flows" | "mix">("corpus");
  const line = result.schedule.map((row) => ({
    year: row.age,
    corpus: row.corpus,
  }));
  const area = result.schedule.map((row) => ({
    year: row.age,
    contribution: row.contribution,
    withdrawal: row.withdrawal,
  }));
  const invested = result.totalSipInvested;
  const gain = Math.max(0, result.balanceCorpus - invested);
  const activeEvents = events.filter((ev) => ev.income > 0 || ev.expense > 0);
  const retireMarker = {
    x: retirementAge,
    label: "Retirement",
    color: "var(--app-chart-tax)",
  };

  const phaseBadge = (phase: string) => {
    const label =
      phase === "retire" ? "RETIRE" : phase === "post" ? "POST" : "PRE";
    const cls =
      phase === "retire"
        ? "bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
        : phase === "post"
          ? "bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]"
          : "bg-[var(--app-std-bg)] text-[var(--app-std-text)]";
    return <span className={`${PILL} ${cls}`}>{label}</span>;
  };

  const delayLumpsum = result.delayLumpsum || result.additionalLumpsum;
  const delaySipVal = result.delaySip || result.monthlySip;

  const summaryItems = [
    {
      label: "Yearly exp. at retirement",
      value: result.yearlyExpAtRet,
      hint: `${result.activeYears} active · ${result.retiredYears} retired yrs`,
    },
    { label: "Step-up SIP start", value: result.stepUpStartSip },
    ...(result.eventsCorpusAtRetirement > 0
      ? [
          {
            label: "Events corpus at retirement",
            value: result.eventsCorpusAtRetirement,
            hint: "Pre-retirement income grown to retirement",
          },
        ]
      : []),
    ...(result.eventLumpsum > 0 || result.eventSip > 0
      ? [
          {
            label: "Pre-ret. event lumpsum",
            value: result.eventLumpsum,
            hint:
              result.eventSip > 0
                ? `Or event SIP ${formatINRCurrency(result.eventSip)}/mo until age ${result.eventSipUntilAge}`
                : undefined,
          },
          ...(result.eventSip > 0
            ? [
                {
                  label: "Pre-ret. event SIP",
                  value: result.eventSip,
                  hint: `Runs until age ${result.eventSipUntilAge}`,
                },
              ]
            : []),
        ]
      : []),
    ...(delayMonths > 0 && result.delaySip > 0
      ? [
          { label: "Delay lumpsum", value: result.delayLumpsum },
          { label: "Delay SIP", value: result.delaySip },
        ]
      : []),
  ];

  const surplusOrSip = result.excess
    ? result.currentAtRetirement + result.eventsCorpusAtRetirement - result.corpusRequired
    : result.monthlySip;

  return (
    <div className="flex flex-col gap-4">
      <WealthSection
        badge="02 · Milestones"
        title="FIRE Funding Milestones"
        subtitle="Corpus required, surplus or SIP gap, and age path"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Age {age} → {retirementAge} → {survivalAge}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
          <span className={`${PILL} bg-[var(--app-std-bg)] text-[var(--app-std-text)]`}>
            {age} Now
          </span>
          <IconChevron className="size-3.5 -rotate-90 text-slate-400" />
          <span className={`${PILL} bg-[var(--app-step-bg)] text-[var(--app-step-text)]`}>
            {retirementAge} Retire
          </span>
          <IconChevron className="size-3.5 -rotate-90 text-slate-400" />
          <span className={`${PILL} bg-slate-100 text-slate-500`}>
            {survivalAge} Survive
          </span>
          {eventsEnabled ? (
            <span className={`${PILL} bg-[var(--app-warn-bg)] text-[var(--app-warn-text)]`}>
              {activeEvents.length} event{activeEvents.length === 1 ? "" : "s"}
            </span>
          ) : (
            <span className={`${PILL} bg-slate-100 text-slate-500`}>No events</span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
          <WealthMetricCard
            title="Corpus required"
            value={result.corpusRequired}
            description={`At age ${retirementAge}`}
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title={result.excess ? "Surplus at retirement" : "Monthly SIP needed"}
            value={surplusOrSip}
            description={result.excess ? "Overfunded at retirement" : "Additional SIP to close the gap"}
            tone={result.excess ? "positive" : "accent"}
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconSip className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Current corpus at retirement"
            value={result.currentAtRetirement}
            description="Existing investments only"
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconChart className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Additional lumpsum"
            value={result.additionalLumpsum}
            description={result.excess ? "Fully funded" : "Funding gap today"}
            tone={result.excess ? "positive" : "accent"}
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconCalendar className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
        </div>
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="FIRE Path Analytics"
        subtitle="Corpus journey, funding mix, and delay cost charts"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-7">
            <WealthSegmented
              variant="underline"
              layoutId="fire-analytics-tab"
              value={analyticsTab}
              onChange={setAnalyticsTab}
              options={[
                {
                  id: "corpus",
                  label: "Corpus",
                  icon: <IconChart className="h-3.5 w-3.5" />,
                },
                {
                  id: "flows",
                  label: "Flows",
                  icon: <IconTimeline className="h-3.5 w-3.5" />,
                },
                {
                  id: "mix",
                  label: "Gap mix",
                  icon: <IconDonut className="h-3.5 w-3.5" />,
                },
              ]}
            />
            {analyticsTab === "corpus" ? (
              <WealthGrowthLine
                data={line}
                xTick={(v) => `Age ${v}`}
                series={[{ key: "corpus", label: "Corpus", color: wealthChart.stepUp, kind: "area" }]}
              />
            ) : null}
            {analyticsTab === "flows" ? (
              <ChartFrame>
                <StackedAreaChart
                  title="Contributions vs withdrawals"
                  data={area}
                  series={[
                    {
                      key: "contribution",
                      label: "Contributions",
                      color: "var(--app-chart-invested)",
                    },
                    {
                      key: "withdrawal",
                      label: "Withdrawals",
                      color: "var(--app-chart-tax)",
                    },
                  ]}
                  lineOnlyKeys={["contribution"]}
                  referenceLines={[retireMarker]}
                />
              </ChartFrame>
            ) : null}
            {analyticsTab === "mix" ? (
              <WealthMixDonut
                title="Gap funding mix"
                centerLabel="Additional funding gap"
                centerValue={result.balanceCorpus}
                slices={[
                  {
                    name: "Invested via SIP",
                    value: invested,
                    color: wealthMixColors.invested,
                  },
                  {
                    name: "Investment gain",
                    value: gain,
                    color: wealthMixColors.gain,
                  },
                ]}
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-3 lg:col-span-5">
            <WealthResultCard
              title={result.excess ? "Results · overfunded" : "FIRE summary"}
              accent={result.excess}
              items={summaryItems}
            />

            {delayMonths > 0 ? (
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Start now vs delay {delayMonths} mo
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Lumpsum
                    </div>
                    <div className="mt-1.5 space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Start now</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(result.additionalLumpsum)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Delayed</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(delayLumpsum)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Monthly SIP
                    </div>
                    <div className="mt-1.5 space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Start now</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(result.monthlySip)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Delayed</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(delaySipVal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <WealthCompareBars
              showBarLabels
              data={[
                {
                  category: "Lumpsum",
                  now: result.additionalLumpsum,
                  delayed: delayLumpsum,
                },
                {
                  category: "Monthly SIP",
                  now: result.monthlySip,
                  delayed: delaySipVal,
                },
              ]}
              series={[
                { key: "now", label: "Start now", color: wealthChart.invested },
                { key: "delayed", label: "Delayed", color: wealthChart.tax },
              ]}
            />
          </div>
        </div>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="FIRE Age Schedule"
        subtitle="Year-wise contributions, withdrawals, events, and corpus by age"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthDataTable
          rows={result.schedule}
          getRowKey={(row) => row.age}
          filterPlaceholder="Filter by age…"
          summary={[
            { label: "Retirement", value: String(retirementAge) },
            { label: "Survival", value: String(survivalAge) },
            {
              label: "Corpus required",
              value: formatINRCurrency(result.corpusRequired),
              tone: "std",
            },
            {
              label: result.excess ? "Surplus" : "Monthly SIP",
              value: formatINRCurrency(surplusOrSip),
              tone: "step",
            },
          ]}
          note="Phase marks pre-retirement, retirement year, and post-retirement drawdown. Event amounts appear only when events are enabled."
          columns={[
            {
              key: "age",
              header: "Age",
              sticky: true,
              searchValue: (row) => String(row.age),
              render: (row) => row.age,
            },
            {
              key: "phase",
              header: "Phase",
              searchValue: (row) => row.phase,
              render: (row) => phaseBadge(row.phase),
            },
            {
              key: "contribution",
              header: "Contribution",
              align: "right",
              render: (row) => moneyCell(row.contribution),
            },
            {
              key: "withdrawal",
              header: "Withdrawal",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.withdrawal),
            },
            ...(eventsEnabled
              ? [
                  {
                    key: "eventAmount",
                    header: "Event",
                    align: "right" as const,
                    tone: "amber" as const,
                    render: (row: (typeof result.schedule)[number]) => {
                      const amount = row.eventAmount ?? 0;
                      if (!amount) return "0";
                      return (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800">
                          {formatINRCurrency(amount)}
                        </span>
                      );
                    },
                  },
                ]
              : []),
            {
              key: "corpus",
              header: "Corpus",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.corpus),
            },
          ]}
        />
      </WealthSection>
    </div>
  );
}

function HealthResults({
  result,
  retirementAge,
  survivalAge,
  events,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  result: HealthResult;
  retirementAge: number;
  survivalAge: number;
  events: HealthEventDraft[];
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const combo = result.schedule.map((row) => ({
    age: row.age,
    corpus: row.corpus,
    expense: row.yearlyExpense,
  }));

  const activeEvents = events.filter((ev) => ev.amount > 0);
  const ageMarkers = [
    {
      age: retirementAge,
      label: `Retire ${retirementAge}`,
      color: "var(--app-step-text)",
    },
    ...activeEvents.slice(0, 2).map((ev) => ({
      age: ev.age,
      label: `Evt ${ev.age}`,
      color: "var(--app-warn-text)",
    })),
  ];

  const gapDisplay =
    result.gapAtRetirement <= 0
      ? {
          label: "Retirement Gap",
          displayValue: "₹0 · Fully Funded",
          highlight: true,
          tone: "gain" as const,
          hint: result.message,
        }
      : {
          label: "Retirement Gap",
          value: result.gapAtRetirement,
          highlight: true,
          tone: "delay" as const,
          hint: "Shortfall at retirement",
        };

  const phaseBadge = (phase: string) => {
    const label =
      phase === "retire" ? "RETIRE" : phase === "post" ? "POST" : "PRE";
    const cls =
      phase === "retire"
        ? "bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
        : phase === "post"
          ? "bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]"
          : "bg-[var(--app-std-bg)] text-[var(--app-std-text)]";
    return <span className={`${PILL} ${cls}`}>{label}</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      <WealthSection
        badge="02 · Milestones"
        title="Financial Health Milestones"
        subtitle="Corpus at retirement and runway through survival"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {retirementAge} → {survivalAge}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
          <WealthStatusNote
            tone={result.funded ? "success" : "error"}
            className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0"
          >
            {result.message}
          </WealthStatusNote>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${PILL} bg-[var(--app-step-bg)] text-[var(--app-step-text)]`}>
              {retirementAge} Retire
            </span>
            {activeEvents.map((ev) => (
              <span
                key={ev.id}
                className={`${PILL} bg-[var(--app-warn-bg)] text-[var(--app-warn-text)]`}
              >
                {ev.age} · {formatINRCurrency(ev.amount)}
              </span>
            ))}
            <span className={`${PILL} bg-slate-100 text-slate-500`}>
              {survivalAge} Survive
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
          <WealthMetricCard
            title="Corpus at retirement"
            value={result.corpusAtRetirement}
            description="Projected corpus when retirement begins"
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title={result.funded ? "Remaining at survival" : "Corpus when funds run out"}
            value={result.funded ? result.remainingAtSurvival : 0}
            description={
              result.funded
                ? `${result.retiredYears}-year retirement runway`
                : `Lasts ~${result.yearsLasting} of ${result.retiredYears} yrs`
            }
            tone={result.funded ? "positive" : "accent"}
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconFlag className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
        </div>
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Health Path Analytics"
        subtitle="Corpus vs expenses and savings versus retirement gap"
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <ChartFrame height="h-[280px] sm:h-[340px]">
              <ComboChart
                title="Corpus and expenses vs age"
                className="min-h-[260px] sm:min-h-[300px]"
                data={combo}
                bars={[{ key: "corpus", label: "Corpus", color: "var(--app-chart-invested)" }]}
                lines={[
                  {
                    key: "expense",
                    label: "Annual Retirement Expense",
                    color: "var(--app-chart-tax)",
                  },
                ]}
                ageMarkers={ageMarkers}
              />
            </ChartFrame>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5">
            <WealthResultCard title="Health summary" items={[
              { label: "Corpus at retirement", value: result.corpusAtRetirement },
              {
                label: "Remaining at survival",
                value: result.remainingAtSurvival,
                hint: `${result.monthsLasting} months lasting`,
              },
              { label: "PV of remaining today", value: result.remainingPvToday },
              { label: "Monthly expense @ ret+1", value: result.monthlyExpAtRetPlus1 },
              { label: "Lifestyle @ ret+1", value: result.lifestyleAtRetPlus1 },
              gapDisplay,
            ]} />
            <WealthMixDonut
              title="Savings vs retirement gap"
              centerLabel={
                !result.funded
                  ? "Shortfall"
                  : result.gapAtRetirement > 0
                    ? "Funded"
                    : "Fully Funded"
              }
              centerValue={result.corpusAtRetirement}
              slices={[
                {
                  name: "Corpus at retirement",
                  value: result.corpusAtRetirement,
                  color: wealthMixColors.invested,
                },
                ...(result.gapAtRetirement > 0
                  ? [
                      {
                        name: "Gap",
                        value: result.gapAtRetirement,
                        color: wealthMixColors.tax,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Health Age Schedule"
        subtitle="Year-wise expenses, events, and corpus from now through survival"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <WealthDataTable
          rows={result.schedule}
          getRowKey={(row) => row.age}
          filterPlaceholder="Filter by age…"
          summary={[
            { label: "Ages", value: String(result.schedule.length) },
            { label: "Retirement", value: String(retirementAge) },
            { label: "Survival", value: String(survivalAge) },
            {
              label: "Corpus @ retire",
              value: formatINRCurrency(result.corpusAtRetirement),
              tone: "step",
            },
          ]}
          note="Each row is one age year. Annual expense and net event impact feed the corpus path until survival age."
          columns={[
            {
              key: "age",
              header: "Age",
              sticky: true,
              searchValue: (row) => String(row.age),
              render: (row) => row.age,
            },
            {
              key: "phase",
              header: "Phase",
              searchValue: (row) => row.phase,
              render: (row) => phaseBadge(row.phase),
            },
            {
              key: "yearlyExpense",
              header: "Annual Expense",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.yearlyExpense),
            },
            {
              key: "eventAmount",
              header: "Net Event Impact",
              align: "right",
              tone: "amber",
              render: (row) => {
                const amount = row.eventAmount ?? 0;
                if (!amount) return "0";
                return (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800">
                    {formatINRCurrency(amount)}
                  </span>
                );
              },
            },
            {
              key: "corpus",
              header: "Corpus",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.corpus),
            },
          ]}
        />
      </WealthSection>
    </div>
  );
}
