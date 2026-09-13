"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { generateCalculatorReport, generatePdfFromElement } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  FINANCIAL_HEALTH_REPORT_ID,
  FinancialHealthDossier,
} from "@/components/reports/financial-health-dossier";
import {
  AgeInput,
  BUTTON_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ClientHeader,
  ComboChart,
  CompareChart,
  CompositionChart,
  Field,
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

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] items-start gap-x-3 gap-y-3";

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
  { value: "200", label: "200% of current" },
  { value: "150", label: "150% of current" },
  { value: "120", label: "120% of current" },
  { value: "100", label: "Same as current" },
  { value: "80", label: "80% of current" },
  { value: "50", label: "50% of current" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "Expense", label: "Expense" },
  { value: "Income", label: "Income" },
];

const MAX_HEALTH_EVENTS = 5;

type HealthEventDraft = {
  id: string;
  age: number;
  amount: number;
  type: "Expense" | "Income";
};

function newHealthEvent(age = 62, amount = 20_000_000): HealthEventDraft {
  return {
    id: `ev-${Math.random().toString(36).slice(2, 9)}`,
    age,
    amount,
    type: "Expense",
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
  balanceCorpus: number;
  additionalLumpsum: number;
  excess: boolean;
  monthlySip: number;
  stepUpStartSip: number;
  totalSipInvested: number;
  delayLumpsum: number;
  delaySip: number;
  schedule: Array<{
    age: number;
    corpus: number;
    contribution: number;
    withdrawal: number;
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
  const [curSip, setCurSip] = useState(10_000);
  const [curSipRet, setCurSipRet] = useState(10);
  const [limitSip, setLimitSip] = useState(0);
  const [stepUp, setStepUp] = useState(10);
  const [delay, setDelay] = useState(3);

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
        delayMonths: delay,
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
    curSip,
    curSipRet,
    limitSip,
    stepUp,
    delay,
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
    mode === "fire" || healthCanCalculate,
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

      const r = result as FireResult;
      const existingCorpus = c1Amt + c2Amt;
      const delayCost = Math.max(0, (r.delayLumpsum || 0) - r.additionalLumpsum);
      const retireIdx = r.schedule.findIndex((row) => row.age === retAge);

      generateCalculatorReport({
        title: "Executive FIRE & Retirement Dossier",
        subtitle: "Institutional Wealth Advisory Desk · Comprehensive Architecture",
        clientName: fireName,
        age,
        meta: [
          { label: "RETIRE", value: String(retAge) },
          { label: "SURVIVE", value: String(survAge) },
        ],
        status: r.excess ? "Fully Funded" : "Validated Model",
        filename: `fire-health-${fireName}`,
        headlines: [
          {
            label: `Corpus Required at Retirement (Age ${retAge})`,
            value: r.corpusRequired,
            highlight: true,
            hint: `Active ${r.activeYears} yrs · Retired ${r.retiredYears} yrs`,
          },
          {
            label: "Monthly SIP Needed",
            value: r.monthlySip,
            hint: `Alt. lumpsum today Rs. ${Math.round(r.additionalLumpsum).toLocaleString("en-IN")}`,
          },
        ],
        metrics: [
          { label: "Existing Corpus", value: existingCorpus },
          { label: "Current @ Retirement", value: r.currentAtRetirement },
          {
            label: "Net Gap at Retirement",
            value: r.balanceCorpus,
            danger: !r.excess && r.balanceCorpus > 0,
          },
          {
            label: `Cost of ${delay}-mo Delay`,
            value: delayCost,
            danger: delayCost > 0,
          },
        ],
        assumptions: [
          ["Current Age", age],
          ["Retirement Age", retAge],
          ["Surviving Age", survAge],
          ["Monthly Expenses", monthlyExp, true],
          ["Lifestyle Yearly", lifestyle, true],
          ["Pre-Ret Return", `${ret}%`],
          ["Post-Ret Return", `${retAfter}%`],
          ["Inflation", `${infl}%`],
          ["Tax on Gains", `${tax}%`],
          ["Current SIP", curSip, true],
          ["Step-up", `${stepUp}%`],
          ["Delay Months", delay],
        ],
        tables: [
          {
            title: "Cost of Delay",
            head: ["Route", "Start Now", "Delayed", "Extra Cost"],
            body: [
              [
                "Lumpsum",
                r.additionalLumpsum,
                r.delayLumpsum || r.additionalLumpsum,
                Math.max(0, (r.delayLumpsum || 0) - r.additionalLumpsum),
              ],
              [
                "Monthly SIP",
                r.monthlySip,
                r.delaySip || r.monthlySip,
                Math.max(0, (r.delaySip || 0) - r.monthlySip),
              ],
            ],
            columnAlignments: ["left", "right", "right", "right"],
            currencyColumns: [1, 2, 3],
          },
          {
            title: "Age Schedule & Year-End Portfolio",
            head: ["Age", "Phase", "Contribution", "Withdrawal", "Corpus"],
            body: r.schedule.map((row) => [
              row.age,
              row.phase,
              row.contribution,
              row.withdrawal,
              row.corpus,
            ]),
            columnAlignments: ["left", "left", "right", "right", "right"],
            currencyColumns: [2, 3, 4],
            highlightRows: retireIdx >= 0 ? [retireIdx] : [],
          },
        ],
        playbook: playbookForPdf("fire"),
      });
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
          <div className={FORM_GRID}>
            <ClientHeader name={fireName} age={age} onNameChange={setFireName} onAgeChange={setAge} />
            <YearInput label="Retirement age" value={retAge} onChange={setRetAge} />
            <YearInput label="Surviving age" value={survAge} onChange={setSurvAge} />
            <MoneyInput label="Monthly expenses" value={monthlyExp} onChange={setMonthlyExp} />
            <MoneyInput label="Lifestyle (yearly)" value={lifestyle} onChange={setLifestyle} />
            <SelectInput
              label="Monthly exp. at ret."
              value={mFactor}
              onChange={setMFactor}
              options={FACTOR_OPTIONS}
            />
            <SelectInput
              label="Lifestyle at ret."
              value={lFactor}
              onChange={setLFactor}
              options={FACTOR_OPTIONS}
            />
            <PercentInput label="Inflation" value={infl} onChange={setInfl} />
            <PercentInput label="Return (pre)" value={ret} onChange={setRet} />
            <PercentInput label="Return (post)" value={retAfter} onChange={setRetAfter} />
            <PercentInput label="Tax on gains" value={tax} onChange={setTax} />
            <MoneyInput label="Corpus type 1" value={c1Amt} onChange={setC1Amt} />
            <PercentInput label="Type 1 return" value={c1Ret} onChange={setC1Ret} />
            <MoneyInput label="Corpus type 2" value={c2Amt} onChange={setC2Amt} />
            <PercentInput label="Type 2 return" value={c2Ret} onChange={setC2Ret} />
            <MoneyInput label="Current SIP" value={curSip} onChange={setCurSip} />
            <PercentInput label="Current SIP return" value={curSipRet} onChange={setCurSipRet} />
            <YearInput label="Limit SIP years" value={limitSip} onChange={setLimitSip} />
            <PercentInput label="Step-up %" value={stepUp} onChange={setStepUp} />
            <YearInput label="Delay (months)" value={delay} onChange={setDelay} />
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
          {mode === "health" && !healthCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted age, return, or event fields before calculating.
            </StatusNote>
          ) : null}
          {error ? <StatusNote tone="error">{error}</StatusNote> : null}
          {loading && !result ? (
            <StatusNote tone="pending">Calculating…</StatusNote>
          ) : null}
          {fire ? <FireResults result={fire} retirementAge={retAge} /> : null}
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

function FireResults({
  result,
  retirementAge,
}: {
  result: FireResult;
  retirementAge: number;
}) {
  const line = result.schedule.map((row) => ({
    year: row.age,
    corpus: row.corpus,
    retirement: row.age === retirementAge ? row.corpus : 0,
  }));
  const area = result.schedule.map((row) => ({
    year: row.age,
    contribution: row.contribution,
    withdrawal: row.withdrawal,
  }));
  const invested = result.totalSipInvested;
  const gain = Math.max(0, result.balanceCorpus - invested);

  return (
    <div className="flex flex-col gap-4">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard title="Corpus at retirement" value={result.corpusRequired} />
            <StatCard
              title={result.excess ? "Surplus at retirement" : "Monthly SIP needed"}
              value={result.excess ? result.currentAtRetirement - result.corpusRequired : result.monthlySip}
              variant="soft"
            />
          </div>
          <GrowthChart
            title="Corpus vs age"
            data={line}
            series={[
              { key: "corpus", label: "Corpus", color: "var(--app-chart-gain)" },
              { key: "retirement", label: "At retirement", color: "var(--app-chart-tax)" },
            ]}
          />
          <StackedAreaChart
            title="Contributions vs withdrawals"
            data={area}
            series={[
              { key: "contribution", label: "Contributions", color: "var(--app-chart-invested)" },
              { key: "withdrawal", label: "Withdrawals", color: "var(--app-chart-tax)" },
            ]}
          />
          <CompositionChart
            title="Gap funding mix"
            slices={[
              { name: "Invested (SIP)", value: invested, color: "var(--app-chart-invested)" },
              { name: "Gain", value: gain, color: "var(--app-chart-gain)" },
            ]}
            centerLabel="Gap"
            centerValue={result.balanceCorpus}
          />
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="flex shrink-0 flex-col gap-3">
            <ResultCard
              title={result.excess ? "Results · overfunded" : "FIRE summary"}
              items={[
                {
                  label: "Yearly exp. at ret.",
                  value: result.yearlyExpAtRet,
                  hint: `${result.activeYears} active · ${result.retiredYears} retired yrs`,
                },
                { label: "Corpus required", value: result.corpusRequired },
                { label: "Current at retirement", value: result.currentAtRetirement },
                { label: "Additional lumpsum", value: result.additionalLumpsum },
                { label: "Monthly SIP", value: result.monthlySip },
                { label: "Step-up SIP start", value: result.stepUpStartSip },
                ...(result.delaySip > 0
                  ? [
                      { label: "Delay lumpsum", value: result.delayLumpsum },
                      { label: "Delay SIP", value: result.delaySip },
                    ]
                  : []),
              ]}
            />
            <CompareChart
              title="Delay cost"
              data={[
                {
                  category: "Lumpsum",
                  now: result.additionalLumpsum,
                  delayed: result.delayLumpsum || result.additionalLumpsum,
                },
                {
                  category: "Monthly SIP",
                  now: result.monthlySip,
                  delayed: result.delaySip || result.monthlySip,
                },
              ]}
              series={[
                { key: "now", label: "Start now", color: "var(--app-chart-invested)" },
                { key: "delayed", label: "Delayed", color: "var(--app-chart-tax)" },
              ]}
            />
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Age schedule"
        zebra
        columns={[
          { key: "age", header: "Age", sticky: true },
          { key: "phase", header: "Phase", format: "text" },
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
            <StatCard title="Corpus at retirement" value={result.corpusAtRetirement} />
            <StatCard
              title={result.funded ? "Remaining at survival" : "Corpus when funds run out"}
              value={result.funded ? result.remainingAtSurvival : 0}
              variant="soft"
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
