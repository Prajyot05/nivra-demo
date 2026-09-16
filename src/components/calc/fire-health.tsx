"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  Flag,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  FINANCIAL_HEALTH_REPORT_ID,
  FinancialHealthDossier,
} from "@/components/reports/financial-health-dossier";
import {
  FIRE_PLANNER_REPORT_ID,
  FirePlannerDossier,
} from "@/components/reports/fire-planner-dossier";
import {
  AgeInput,
  BUTTON_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  CARD_PAD,
  ComboChart,
  CompareChart,
  CompositionChart,
  Field,
  formatCompactINR,
  formatINRCurrency,
  GrowthChart,
  META_TEXT,
  MoneyInput,
  PercentInput,
  PILL,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  SECTION_TITLE,
  SelectInput,
  StackedAreaChart,
  StatCard,
  StatusNote,
  TextInput,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";

const FIRE_FORM_GRID =
  "grid grid-cols-2 items-start gap-x-2.5 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

/** Health form: fill the card width, but keep a floor so columns stay compact (not 3 giant fields). */
const HEALTH_FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] items-start gap-x-2.5 gap-y-2.5";

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

function FormBand({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-3 w-0.5 shrink-0 rounded-full bg-[var(--app-text-muted)]" />
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
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
  const [mode] = useCalculatorMode(MODE_IDS, "fire");

  const [fireName, setFireName] = useState("Sanjay Gupta");
  const [age, setAge] = useState(40);
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

  const calculatorId = mode === "fire" ? "fire-planner" : "financial-health";

  const fireNameError =
    !fireName.trim() ? "Client name is required." : undefined;
  const fireAgeError =
    age < 0 || age > 120 ? "Enter a valid current age." : undefined;
  const fireRetError =
    retAge <= age
      ? "Retirement age must be greater than current age."
      : retAge > 120
        ? "Enter a valid retirement age."
        : undefined;
  const fireSurvError =
    survAge <= retAge
      ? "Surviving age must be greater than retirement age."
      : survAge > 120
        ? "Enter a valid surviving age."
        : undefined;
  const fireInflError =
    infl < 0 || infl > 100 ? "Inflation should be between 0 and 100%." : undefined;
  const fireRetPctError =
    ret < 0 || ret > 100 ? "Enter a valid pre-retirement return." : undefined;
  const fireAfterError =
    retAfter < 0 || retAfter > 100 ? "Enter a valid post-retirement return." : undefined;
  const fireTaxError =
    tax < 0 || tax > 100 ? "Tax should be between 0 and 100%." : undefined;
  const fireStepUpError =
    stepUp < 0 || stepUp > 100 ? "Step-up % cannot be negative." : undefined;
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

  const hAgeError =
    hAge < 0 || hAge > 120 ? "Enter a valid current age." : undefined;
  const hRetError =
    hRet < hAge
      ? "Retirement age must be on or after current age."
      : hRet > 120
        ? "Enter a valid retirement age."
        : undefined;
  const hSurvError =
    hSurv < hRet
      ? "Survival age must be on or after retirement age."
      : hSurv > 120
        ? "Enter a valid survival age."
        : undefined;
  const hReturnError =
    hReturn <= 0 || hReturn > 100 ? "Pre-retirement return must be above 0%." : undefined;
  const hAfterError =
    hAfter <= 0 || hAfter > 100 ? "Post-retirement return must be above 0%." : undefined;
  const hTaxError = hTax < 0 || hTax > 100 ? "Tax should be between 0 and 100%." : undefined;
  const hInflError =
    hInfl < 0 || hInfl > 100 ? "Inflation should be between 0 and 100%." : undefined;
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
    !hAgeError &&
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

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/fire", mode)}
      description={
        mode === "health"
          ? "Plan your retirement corpus, spending needs, and long-term financial health."
          : "Plan the corpus and SIP path needed to reach financial independence."
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
        mode === "fire" ? (
          <div className="flex flex-col gap-3">
            <FormBand title="Profile & spending">
              <div className={FIRE_FORM_GRID}>
                <Field label="Client name" error={fireNameError}>
                  <TextInput
                    value={fireName}
                    onChange={(e) => setFireName(e.target.value)}
                  />
                </Field>
                <AgeInput value={age} onChange={setAge} error={fireAgeError} />
                <YearInput
                  label="Retire age"
                  value={retAge}
                  onChange={setRetAge}
                  error={fireRetError}
                />
                <YearInput
                  label="Survive age"
                  value={survAge}
                  onChange={setSurvAge}
                  error={fireSurvError}
                />
                <MoneyInput
                  label="Monthly exp."
                  value={monthlyExp}
                  onChange={setMonthlyExp}
                />
                <MoneyInput
                  label="Lifestyle / yr"
                  value={lifestyle}
                  onChange={setLifestyle}
                />
                <SelectInput
                  label="Exp. @ ret"
                  value={mFactor}
                  onChange={setMFactor}
                  options={FACTOR_OPTIONS}
                />
                <SelectInput
                  label="Lifestyle @ ret"
                  value={lFactor}
                  onChange={setLFactor}
                  options={FACTOR_OPTIONS}
                />
                <PercentInput
                  label="Return (pre)"
                  value={ret}
                  onChange={setRet}
                  error={fireRetPctError}
                />
                <PercentInput
                  label="Return (post)"
                  value={retAfter}
                  onChange={setRetAfter}
                  error={fireAfterError}
                />
                <PercentInput
                  label="Tax on gains"
                  value={tax}
                  onChange={setTax}
                  error={fireTaxError}
                />
                <PercentInput
                  label="Inflation"
                  value={infl}
                  onChange={setInfl}
                  error={fireInflError}
                />
              </div>
            </FormBand>

            <FormBand title="Corpus, SIP & delay">
              <div className={FIRE_FORM_GRID}>
                <MoneyInput label="Corpus 1" value={c1Amt} onChange={setC1Amt} />
                <PercentInput label="C1 return" value={c1Ret} onChange={setC1Ret} />
                <MoneyInput label="Corpus 2" value={c2Amt} onChange={setC2Amt} />
                <PercentInput label="C2 return" value={c2Ret} onChange={setC2Ret} />
                <MoneyInput label="Corpus 3" value={c3Amt} onChange={setC3Amt} />
                <PercentInput label="C3 return" value={c3Ret} onChange={setC3Ret} />
                <MoneyInput label="Current SIP" value={curSip} onChange={setCurSip} />
                <PercentInput
                  label="SIP return"
                  value={curSipRet}
                  onChange={setCurSipRet}
                />
                <YearInput
                  label="Limit SIP yrs"
                  value={limitSip}
                  onChange={setLimitSip}
                  error={fireLimitSipError}
                  hint="0 = full"
                />
                <PercentInput
                  label="Step-up %"
                  value={stepUp}
                  onChange={setStepUp}
                  error={fireStepUpError}
                />
                <YearInput
                  label="Every (yrs)"
                  value={stepUpEvery}
                  onChange={setStepUpEvery}
                  error={fireStepEveryError}
                />
                <YearInput
                  label="Delay (mos)"
                  value={delay}
                  onChange={setDelay}
                  error={fireDelayError}
                />
                <SelectInput
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
            </FormBand>

            {eventsMode === "Yes" ? (
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
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className={HEALTH_FORM_GRID}>
              <div className="col-span-2 min-w-0">
                <Field label="Client Name">
                  <TextInput
                    value={hName}
                    onChange={(e) => setHName(e.target.value)}
                  />
                </Field>
              </div>
              <AgeInput value={hAge} onChange={setHAge} error={hAgeError} />
              <YearInput
                label="Retirement age"
                value={hRet}
                min={0}
                max={120}
                onChange={setHRet}
                error={hRetError}
              />
              <YearInput
                label="Survival age"
                value={hSurv}
                min={0}
                max={120}
                onChange={setHSurv}
                error={hSurvError}
              />
              <MoneyInput
                label="Current corpus"
                value={hCorpus}
                onChange={setHCorpus}
                align="right"
              />
              <MoneyInput
                label="Monthly expense"
                value={hExp}
                onChange={setHExp}
                align="right"
              />
              <MoneyInput
                label="Monthly investment"
                value={hSav}
                onChange={setHSav}
                align="right"
              />
              <MoneyInput
                label="Lifestyle / year"
                value={hLife}
                onChange={setHLife}
                align="right"
              />
              <PercentInput
                label="Inflation"
                value={hInfl}
                onChange={setHInfl}
                error={hInflError}
              />
              <PercentInput
                label="Pre-ret. return"
                value={hReturn}
                onChange={setHReturn}
                error={hReturnError}
              />
              <PercentInput
                label="Post-ret. return"
                value={hAfter}
                onChange={setHAfter}
                error={hAfterError}
              />
              <PercentInput
                label="Tax after ret."
                value={hTax}
                onChange={setHTax}
                error={hTaxError}
              />
              <MoneyInput
                label="Retirement benefit"
                value={hBenefit}
                onChange={setHBenefit}
                align="right"
              />
            </div>

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
        )
      }
      results={
        <div className="flex flex-col gap-3">
          {mode === "fire" && !fireCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted age, return, event, or amount fields before calculating.
            </StatusNote>
          ) : null}
          {mode === "health" && !healthCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted age, return, or event fields before calculating.
            </StatusNote>
          ) : null}
          {error ? <StatusNote tone="error">{error}</StatusNote> : null}
          {loading && !result ? (
            <StatusNote tone="pending">Calculating…</StatusNote>
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
            />
          ) : null}
          {health ? (
            <HealthResults
              result={health}
              retirementAge={hRet}
              survivalAge={hSurv}
              events={healthEvents}
            />
          ) : null}
        </div>
      }
    />
    {mode === "fire" && fire ? (
      <FirePlannerDossier
        data={{
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
          className={BUTTON_PRIMARY}
          onClick={onAdd}
          disabled={atCapacity}
        >
          <Plus className="size-3.5" />
          Add event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-8 text-center">
          <Flag className="mb-2 size-6 text-[var(--app-text-subtle)]" />
          <p className="mb-3 text-[13px] text-[var(--app-text-muted)]">
            No post-retirement events yet.
          </p>
          <button type="button" className={BUTTON_PRIMARY} onClick={onAdd} disabled={atCapacity}>
            <Plus className="size-3.5" />
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
                  <ChevronRight className="size-5" />
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
                const Icon = isExpense ? ArrowDownLeft : ArrowUpRight;

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
                  <Flag className="size-5" />
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
                    className={BUTTON_DANGER}
                    onClick={() => {
                      const id = openEvent.id;
                      setOpenId(null);
                      onRemove(id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                  <button
                    type="button"
                    className={BUTTON_SECONDARY}
                    onClick={() => setOpenId(null)}
                  >
                    <Check className="size-3.5" />
                    Done
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <YearInput
                  label="Event age"
                  value={openEvent.age}
                  min={0}
                  max={120}
                  onChange={(age) => onPatch(openEvent.id, { age })}
                  error={openError}
                  hint={!openError ? `After ${retirementAge}, on or before ${survivalAge}` : undefined}
                />
                <MoneyInput
                  label="Amount"
                  value={openEvent.amount}
                  onChange={(amount) => onPatch(openEvent.id, { amount })}
                  align="right"
                />
                <SelectInput
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
          className={BUTTON_PRIMARY}
          onClick={onAdd}
          disabled={atCapacity}
        >
          <Plus className="size-3.5" />
          Add event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-8 text-center">
          <Flag className="mb-2 size-6 text-[var(--app-text-subtle)]" />
          <p className="mb-3 text-[13px] text-[var(--app-text-muted)]">
            No major events yet. Add income or expense cash flows along the plan.
          </p>
          <button type="button" className={BUTTON_PRIMARY} onClick={onAdd} disabled={atCapacity}>
            <Plus className="size-3.5" />
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
                  <ChevronRight className="size-5" />
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
                const Icon = isExpenseHeavy ? ArrowDownLeft : ArrowUpRight;
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
                  <Flag className="size-5" />
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
                    className={BUTTON_DANGER}
                    onClick={() => {
                      const id = openEvent.id;
                      setOpenId(null);
                      onRemove(id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                  <button
                    type="button"
                    className={BUTTON_SECONDARY}
                    onClick={() => setOpenId(null)}
                  >
                    <Check className="size-3.5" />
                    Done
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <YearInput
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
                <MoneyInput
                  label="Income"
                  value={openEvent.income}
                  onChange={(income) => onPatch(openEvent.id, { income })}
                  align="right"
                />
                <MoneyInput
                  label="Expense"
                  value={openEvent.expense}
                  onChange={(expense) => onPatch(openEvent.id, { expense })}
                  align="right"
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
}: {
  result: FireResult;
  age: number;
  retirementAge: number;
  survivalAge: number;
  delayMonths: number;
  eventsEnabled: boolean;
  events: FireEventDraft[];
}) {
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
  const lumpsumPct =
    result.additionalLumpsum > 0
      ? ((delayLumpsum - result.additionalLumpsum) / result.additionalLumpsum) * 100
      : 0;
  const sipPct =
    result.monthlySip > 0
      ? ((delaySipVal - result.monthlySip) / result.monthlySip) * 100
      : 0;

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        <span className={`${PILL} bg-[var(--app-std-bg)] text-[var(--app-std-text)]`}>
          {age} Now
        </span>
        <ChevronRight className="size-3.5 text-[var(--app-text-subtle)]" />
        <span className={`${PILL} bg-[var(--app-step-bg)] text-[var(--app-step-text)]`}>
          {retirementAge} Retire
        </span>
        <ChevronRight className="size-3.5 text-[var(--app-text-subtle)]" />
        <span className={`${PILL} bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]`}>
          {survivalAge} Survive
        </span>
        {eventsEnabled ? (
          <span className={`${PILL} bg-[var(--app-warn-bg)] text-[var(--app-warn-text)]`}>
            {activeEvents.length} event{activeEvents.length === 1 ? "" : "s"}
          </span>
        ) : (
          <span className={`${PILL} bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]`}>
            No events
          </span>
        )}
      </div>

      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard
              title="Corpus required"
              value={result.corpusRequired}
              hint={`At age ${retirementAge}`}
              tone="neutral"
            />
            <StatCard
              title={result.excess ? "Surplus at retirement" : "Monthly SIP needed"}
              value={
                result.excess
                  ? result.currentAtRetirement +
                    result.eventsCorpusAtRetirement -
                    result.corpusRequired
                  : result.monthlySip
              }
              tone={result.excess ? "positive" : "negative"}
            />
            <StatCard
              title="Current corpus at retirement"
              value={result.currentAtRetirement}
              tone="neutral"
              hint="Existing investments only"
            />
            <StatCard
              title="Additional lumpsum"
              value={result.additionalLumpsum}
              tone={result.excess ? "positive" : "negative"}
              hint={result.excess ? "Fully funded" : "Funding gap today"}
            />
          </div>
          <GrowthChart
            title="Corpus vs age"
            data={line}
            series={[{ key: "corpus", label: "Corpus", color: "var(--app-chart-gain)" }]}
            referenceLines={[retireMarker]}
          />
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
          <CompositionChart
            title="Gap funding mix"
            slices={[
              { name: "Invested via SIP", value: invested, color: "var(--app-chart-invested)" },
              { name: "Investment gain", value: gain, color: "var(--app-chart-gain)" },
            ]}
            centerLabel="Additional funding gap"
            centerValue={result.balanceCorpus}
            centerValueDisplay={`₹${formatCompactINR(result.balanceCorpus)}`}
          />
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="flex shrink-0 flex-col gap-3">
            <ResultCard
              title={result.excess ? "Results · overfunded" : "FIRE summary"}
              items={summaryItems}
            />

            {delayMonths > 0 ? (
              <div className={`${CARD} ${CARD_PAD} space-y-3`}>
                <div className={SECTION_TITLE}>Start now vs delay {delayMonths} mo</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)]/40 p-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                      Lumpsum
                    </div>
                    <div className="mt-1.5 space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--app-text-muted)]">Start now</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(result.additionalLumpsum)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--app-text-muted)]">Delayed</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(delayLumpsum)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)]/40 p-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                      Monthly SIP
                    </div>
                    <div className="mt-1.5 space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--app-text-muted)]">Start now</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(result.monthlySip)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--app-text-muted)]">Delayed</span>
                        <span className="font-semibold tabular-nums">
                          {formatINRCurrency(delaySipVal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <CompareChart
              title="Delay cost"
              data={[
                {
                  category: "Lumpsum",
                  now: result.additionalLumpsum,
                  delayed: delayLumpsum,
                  tooltipDetails:
                    lumpsumPct > 0
                      ? [{ label: "Increase", value: `${lumpsumPct.toFixed(1)}%` }]
                      : undefined,
                },
                {
                  category: "Monthly SIP",
                  now: result.monthlySip,
                  delayed: delaySipVal,
                  tooltipDetails:
                    sipPct > 0
                      ? [{ label: "Increase", value: `${sipPct.toFixed(1)}%` }]
                      : undefined,
                },
              ]}
              series={[
                { key: "now", label: "Start now", color: "var(--app-chart-invested)" },
                { key: "delayed", label: "Delayed", color: "var(--app-chart-tax)" },
              ]}
              showBarLabels
            />
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Age schedule"
        meta={`Retirement at ${retirementAge} · Survival ${survivalAge}`}
        zebra
        emphasizeRow={(row) =>
          Number(row.age) === retirementAge ||
          Number(row.age) === survivalAge ||
          Number(row.eventAmount ?? 0) !== 0
        }
        columns={[
          { key: "age", header: "Age", sticky: true },
          {
            key: "phase",
            header: "Phase",
            render: (value) => phaseBadge(String(value ?? "")),
          },
          {
            key: "contribution",
            header: "Contribution",
            format: "inr",
            align: "right",
            tone: "std",
          },
          {
            key: "withdrawal",
            header: "Withdrawal",
            format: "inr",
            align: "right",
            tone: "warn",
          },
          ...(eventsEnabled
            ? [
                {
                  key: "eventAmount",
                  header: "Event",
                  align: "right" as const,
                  tone: "warn" as const,
                  render: (value: unknown) => {
                    const amount = typeof value === "number" ? value : 0;
                    if (!amount) return "0";
                    return (
                      <span className="rounded-md bg-[var(--app-warn-bg)] px-1.5 py-0.5 font-semibold text-[var(--app-warn-text-strong)]">
                        {formatINRCurrency(amount)}
                      </span>
                    );
                  },
                },
              ]
            : []),
          { key: "corpus", header: "Corpus", format: "inr", align: "right", tone: "step" },
        ]}
        rows={result.schedule}
      />
    </div>
  );
}

function HealthResults({
  result,
  retirementAge,
  survivalAge,
  events,
}: {
  result: HealthResult;
  retirementAge: number;
  survivalAge: number;
  events: HealthEventDraft[];
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

  const healthTone = !result.funded ? ("warn" as const) : ("info" as const);

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        <StatusNote
          tone={result.funded ? healthTone : "warn"}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0"
        >
          {result.message}
        </StatusNote>
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
          <span className={`${PILL} bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]`}>
            {survivalAge} Survive
          </span>
        </div>
      </div>

      <div className={`${RESULTS_SPLIT} gap-3`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard title="Corpus at retirement" value={result.corpusAtRetirement} tone="neutral" />
            <StatCard
              title={result.funded ? "Remaining at survival" : "Corpus when funds run out"}
              value={result.funded ? result.remainingAtSurvival : 0}
              tone={result.funded ? "positive" : "negative"}
              hint={
                result.funded
                  ? `${result.retiredYears}-year retirement runway`
                  : `Lasts ~${result.yearsLasting} of ${result.retiredYears} yrs`
              }
            />
          </div>
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
        </div>
        <div className={`${RESULTS_RIGHT} gap-3`}>
          <ResultCard
            title="Health summary"
            items={[
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
            ]}
          />
          <CompositionChart
            title="Savings vs retirement gap"
            compact
            className="min-h-0"
            slices={[
              {
                name: "Corpus at retirement",
                value: result.corpusAtRetirement,
                color: "var(--app-chart-invested)",
              },
              ...(result.gapAtRetirement > 0
                ? [
                    {
                      name: "Gap",
                      value: result.gapAtRetirement,
                      color: "var(--app-chart-tax)",
                    },
                  ]
                : []),
            ]}
            centerLabel={
              !result.funded ? "Shortfall" : result.gapAtRetirement > 0 ? "Funded" : "Fully Funded"
            }
            centerValue={result.corpusAtRetirement}
          />
        </div>
      </div>
      <ScheduleTable
        caption="Age path"
        meta={`${result.schedule.length} ages · retirement at ${retirementAge}`}
        zebra
        emphasizeRow={(row) =>
          Number(row.age) === retirementAge || Number(row.eventAmount ?? 0) !== 0
        }
        columns={[
          { key: "age", header: "Age", sticky: true },
          {
            key: "phase",
            header: "Phase",
            render: (value) => phaseBadge(String(value ?? "")),
          },
          {
            key: "yearlyExpense",
            header: "Annual Expense",
            format: "inr",
            align: "right",
            tone: "warn",
          },
          {
            key: "eventAmount",
            header: "Net Event Impact",
            align: "right",
            tone: "warn",
            render: (value) => {
              const amount = typeof value === "number" ? value : 0;
              if (!amount) return "0";
              return (
                <span className="rounded-md bg-[var(--app-warn-bg)] px-1.5 py-0.5 font-semibold text-[var(--app-warn-text-strong)]">
                  {formatINRCurrency(amount)}
                </span>
              );
            },
          },
          { key: "corpus", header: "Corpus", format: "inr", align: "right", tone: "step" },
        ]}
        rows={result.schedule}
      />
    </div>
  );
}
