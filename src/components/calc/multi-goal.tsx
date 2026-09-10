"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Car,
  GraduationCap,
  Gem,
  Sunset,
  Home,
  Plane,
  Target,
  Calendar,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  ClientHeader,
  CompareChart,
  CompositionChart,
  Field,
  formatINRCurrency,
  MoneyInput,
  PercentInput,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  SelectInput,
  StackedBarChart,
  StatCard,
  TextInput,
  WithdrawalPathChart,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import {
  MultiWithdrawalsDossier,
  MULTI_WITHDRAWALS_REPORT_ID,
} from "@/components/reports/multi-withdrawals-dossier";
import {
  MultiGoalAssignDossier,
  MULTI_GOAL_ASSIGN_REPORT_ID,
} from "@/components/reports/multi-goal-assign-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] items-start gap-x-3 gap-y-3";

const MODES = [
  { id: "assign", label: "Corpus assign" },
  { id: "withdrawals", label: "Withdrawals" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);

const MAX_GOALS = 20;

type GoalCategory =
  | "car"
  | "education"
  | "marriage"
  | "retirement"
  | "house"
  | "vacation"
  | "custom";

const GOAL_CATEGORIES: Array<{ id: GoalCategory; label: string; icon: React.ElementType; color: string }> = [
  { id: "car", label: "Car", icon: Car, color: "bg-[var(--app-std-bg)] text-[var(--app-std-text)]" },
  { id: "education", label: "Education", icon: GraduationCap, color: "bg-[var(--app-std-bg)] text-[var(--app-std-text)]" },
  { id: "marriage", label: "Marriage", icon: Gem, color: "bg-[var(--app-step-bg)] text-[var(--app-step-text)]" },
  { id: "retirement", label: "Retirement", icon: Sunset, color: "bg-[var(--app-warn-bg)] text-[var(--app-warn-text)]" },
  { id: "house", label: "House", icon: Home, color: "bg-[var(--app-step-bg)] text-[var(--app-step-text)]" },
  { id: "vacation", label: "Vacation", icon: Plane, color: "bg-[var(--app-std-bg)] text-[var(--app-std-text)]" },
  { id: "custom", label: "Custom", icon: Target, color: "bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]" },
];

const CATEGORY_OPTIONS = GOAL_CATEGORIES.map((c) => ({
  value: c.id,
  label: c.label,
}));

const CATEGORY_META = Object.fromEntries(
  GOAL_CATEGORIES.map((c) => [c.id, { label: c.label, icon: c.icon, color: c.color }]),
) as Record<GoalCategory, { label: string; icon: React.ElementType; color: string }>;

type WithdrawalGoal = {
  id: string;
  category: GoalCategory;
  name: string;
  amount: number;
  atAge: number;
};

type AssignGoal = {
  id: string;
  category: GoalCategory;
  name: string;
  amount: number;
  years: number;
};

const MAX_ASSIGN_GOALS = 10;

function createDefaultAssignGoals(): AssignGoal[] {
  return [
    { id: "ag-edu", category: "education", name: "Education", amount: 4_000_000, years: 6 },
    { id: "ag-masters", category: "education", name: "Masters", amount: 40_000_000, years: 11 },
    { id: "ag-house", category: "house", name: "House", amount: 80_000_000, years: 10 },
    { id: "ag-marriage", category: "marriage", name: "Marriage", amount: 4_800_000, years: 5 },
    { id: "ag-retire", category: "retirement", name: "Retirement", amount: 50_000_000, years: 25 },
  ];
}

function createDefaultWithdrawalGoals(): WithdrawalGoal[] {
  return [
    { id: "wg-car", category: "car", name: "Car", amount: 2_000_000, atAge: 33 },
    { id: "wg-edu-1", category: "education", name: "Education 1", amount: 2_000_000, atAge: 41 },
    { id: "wg-edu-2", category: "education", name: "Education 2", amount: 5_000_000, atAge: 54 },
    { id: "wg-edu-3", category: "education", name: "Education 3", amount: 3_500_000, atAge: 54 },
    { id: "wg-edu-4", category: "education", name: "Education 4", amount: 2_000_000, atAge: 41 },
    { id: "wg-marriage", category: "marriage", name: "Marriage", amount: 2_000_000, atAge: 58 },
    { id: "wg-oldage", category: "retirement", name: "OldAge Home", amount: 16_000_000, atAge: 60 },
  ];
}

function newGoalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `wg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function inferCategory(name: string): GoalCategory {
  const n = name.toLowerCase();
  if (n.includes("car")) return "car";
  if (n.includes("edu") || n.includes("school") || n.includes("college")) return "education";
  if (n.includes("marri") || n.includes("wed")) return "marriage";
  if (n.includes("retir") || n.includes("old") || n.includes("pension")) return "retirement";
  if (n.includes("house") || n.includes("home") || n.includes("flat")) return "house";
  if (n.includes("vacat") || n.includes("travel") || n.includes("trip")) return "vacation";
  return "custom";
}

type AssignResult = {
  totalMonthlySip: number;
  totalSipInvested: number;
  totalLumpsum: number;
  totalAssigned: number;
  unassignedCorpus: number;
  compare: Array<{ category: string; assigned: number; remaining: number }>;
  goals: Array<{
    name: string;
    amount: number;
    years: number;
    inflAdjGoal: number;
    assigned: number;
    remainingTarget: number;
    monthlySip: number;
    lumpsum: number;
    sipInvested: number;
    delayCost: number;
    bucket: "ST" | "LT";
  }>;
};

type WithdrawResult = {
  startMonthlySip: number;
  totalInvested: number;
  totalWithdrawn: number;
  totalTax: number;
  ageChart: Array<{ age: number; corpus: number; withdrawal: number }>;
  schedule: Array<{ age: number; corpus: number; withdrawal: number; monthlySip: number }>;
  rows: Array<{
    name: string;
    atAge: number;
    amount: number;
    monthlySip: number;
    invested: number;
    years: number;
    peakCorpus: number;
    tax: number;
  }>;
  phases: Array<{ fromAge: number; toAge: number; monthlySip: number }>;
};

function matchRow(
  rows: WithdrawResult["rows"] | undefined,
  goal: WithdrawalGoal,
  index: number,
): WithdrawResult["rows"][number] | undefined {
  if (!rows?.length) return undefined;
  const displayName = goal.name.trim() || `Goal ${index + 1}`;
  return (
    rows.find(
      (r) => r.name === displayName && r.atAge === goal.atAge && r.amount === goal.amount,
    ) ?? rows.find((r) => r.atAge === goal.atAge && r.amount === goal.amount)
  );
}

function matchRowSip(
  rows: WithdrawResult["rows"] | undefined,
  goal: WithdrawalGoal,
  index: number,
): number | undefined {
  return matchRow(rows, goal, index)?.monthlySip;
}

function ConfirmResetDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-[#0f172a]/55" aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-goals-title"
        aria-describedby="reset-goals-desc"
        className="relative z-[1] w-full max-w-md rounded-xl border border-[var(--app-border,#e2e8f0)] bg-[var(--app-surface,#ffffff)] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-warn-border,#fde68a)] bg-[var(--app-warn-bg,#fffbeb)] text-[var(--app-warn-text-strong,#451a03)]">
            <RotateCcw className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="reset-goals-title"
              className="text-sm font-semibold uppercase tracking-widest text-[var(--app-text,#0f172a)]"
            >
              Reset goals
            </h3>
            <p
              id="reset-goals-desc"
              className="mt-2 text-sm leading-relaxed text-[var(--app-text-muted,#64748b)]"
            >
              Restore the default sample goals and clear your current timeline. Your edits will be
              lost.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--app-border,#e2e8f0)] pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 border-[var(--app-border,#e2e8f0)] bg-[var(--app-surface,#ffffff)] text-[var(--app-text,#0f172a)] hover:bg-[var(--app-surface-muted,#f8fafc)]"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 bg-[var(--app-primary,#0f172a)] text-[var(--app-primary-fg,#ffffff)] hover:bg-[var(--app-primary-hover,#1e293b)]"
            onClick={onConfirm}
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset goals
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MultiGoalCalculator() {
  const [mode] = useCalculatorMode(MODE_IDS, "withdrawals");
  const [name, setName] = useState("Janardhan");
  const [age, setAge] = useState(43);
  const [stYears, setStYears] = useState(5);
  const [stRet, setStRet] = useState(7);
  const [ltRet, setLtRet] = useState(12);
  const [infl, setInfl] = useState(3);
  const [tax, setTax] = useState(12.5);
  const [delay, setDelay] = useState(12);
  const [corpus, setCorpus] = useState(10_000_000);
  const [corpusRet, setCorpusRet] = useState(7);
  const [goals, setGoals] = useState<AssignGoal[]>(createDefaultAssignGoals);
  const [assignResetOpen, setAssignResetOpen] = useState(false);
  const [assignTimelineKey, setAssignTimelineKey] = useState(0);

  const [wName, setWName] = useState("Opinder Jain");
  const [wAge, setWAge] = useState(28);
  const [wRet, setWRet] = useState(12);
  const [wTax, setWTax] = useState(12.5);
  const [withdrawalGoals, setWithdrawalGoals] = useState<WithdrawalGoal[]>(createDefaultWithdrawalGoals);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);

  const stRetError =
    stRet < 0 || stRet > 30 ? "ST return should be between 0% and 30%." : undefined;
  const ltRetError =
    ltRet < 0 || ltRet > 30 ? "LT return should be between 0% and 30%." : undefined;
  const corpusRetError =
    corpusRet < 0 || corpusRet > 30 ? "Corpus return should be between 0% and 30%." : undefined;
  const inflError = infl < 0 || infl > 20 ? "Inflation should be between 0% and 20%." : undefined;
  const taxAssignError = tax < 0 || tax > 100 ? "Tax cannot exceed 100%." : undefined;
  const delayError =
    delay < 0 || delay > 120 ? "Delay should be between 0 and 120 months." : undefined;
  const stYearsError = !(stYears > 0) ? "ST years must be greater than zero." : undefined;
  const corpusError = corpus < 0 ? "Current corpus cannot be negative." : undefined;

  const taxError = wTax > 100 ? "Tax cannot exceed 100%." : undefined;
  const returnHint = wRet > 30 ? "Return above 30% is unusual. Double-check the assumption." : undefined;

  const assignGoalErrors = useMemo(() => {
    const map = new Map<string, { name?: string; amount?: string; years?: string }>();
    const nameCounts = new Map<string, number>();
    for (const g of goals) {
      const key = g.name.trim().toLowerCase();
      if (key) nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
    }
    for (const g of goals) {
      const err: { name?: string; amount?: string; years?: string } = {};
      if (!g.name.trim()) err.name = "Enter a goal name.";
      else if ((nameCounts.get(g.name.trim().toLowerCase()) ?? 0) > 1) {
        err.name = "A goal with this name already exists.";
      }
      if (!(g.amount > 0)) err.amount = "Goal amount should be greater than ₹0.";
      if (!(g.years > 0)) err.years = "Enter a valid goal year.";
      if (err.name || err.amount || err.years) map.set(g.id, err);
    }
    return map;
  }, [goals]);

  const assignGoalWarnings = useMemo(() => {
    const map = new Map<string, string>();
    const yearCounts = new Map<number, number>();
    for (const g of goals) {
      if (g.years > 0) yearCounts.set(g.years, (yearCounts.get(g.years) ?? 0) + 1);
    }
    for (const g of goals) {
      if (g.years > 0 && (yearCounts.get(g.years) ?? 0) > 1) {
        map.set(g.id, "Another goal uses this same year.");
      }
    }
    return map;
  }, [goals]);

  const goalErrors = useMemo(() => {
    const map = new Map<string, { amount?: string; atAge?: string }>();
    for (const g of withdrawalGoals) {
      const err: { amount?: string; atAge?: string } = {};
      if (!(g.amount > 0)) err.amount = "Amount must be greater than zero.";
      if (!(g.atAge > wAge)) err.atAge = "Withdrawal age must be greater than current age.";
      if (err.amount || err.atAge) map.set(g.id, err);
    }
    return map;
  }, [withdrawalGoals, wAge]);

  const goalWarnings = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of withdrawalGoals) {
      if (g.atAge > 100) map.set(g.id, "Age above 100 is unusual.");
    }
    return map;
  }, [withdrawalGoals]);

  const validAssignGoals = useMemo(
    () => goals.filter((g) => g.name.trim() && g.amount > 0 && g.years > 0),
    [goals],
  );

  const validWithdrawalGoals = useMemo(
    () => withdrawalGoals.filter((g) => g.amount > 0 && g.atAge > wAge),
    [withdrawalGoals, wAge],
  );

  const assignAssumptionError = Boolean(
    stRetError ||
      ltRetError ||
      corpusRetError ||
      inflError ||
      taxAssignError ||
      delayError ||
      stYearsError ||
      corpusError,
  );
  const hasHardErrors = Boolean(taxError);
  const hasInvalidGoals = withdrawalGoals.some((g) => goalErrors.has(g.id));
  const canCalculate =
    mode === "assign"
      ? validAssignGoals.length > 0 && !assignAssumptionError
      : validWithdrawalGoals.length > 0 && !hasHardErrors;

  const sortedWithdrawalGoals = useMemo(
    () =>
      [...withdrawalGoals].sort((a, b) => {
        if (a.atAge !== b.atAge) return a.atAge - b.atAge;
        return a.id.localeCompare(b.id);
      }),
    [withdrawalGoals],
  );

  const sortedAssignGoals = useMemo(
    () =>
      [...goals].sort((a, b) => {
        if (a.years !== b.years) return a.years - b.years;
        return a.id.localeCompare(b.id);
      }),
    [goals],
  );

  const input = useMemo(() => {
    if (mode === "assign") {
      return {
        clientName: name,
        age,
        shortTermYears: stYears,
        shortTermReturnPct: stRet,
        longTermReturnPct: ltRet,
        inflationPct: infl,
        taxPct: tax,
        delayMonths: delay,
        currentCorpus: corpus,
        corpusReturnPct: corpusRet,
        goals: validAssignGoals.map((g, i) => ({
          name: g.name.trim() || `Goal ${i + 1}`,
          amount: g.amount,
          years: g.years,
        })),
      };
    }
    return {
      clientName: wName,
      age: wAge,
      returnPct: wRet,
      taxPct: wTax,
      withdrawals: validWithdrawalGoals.map((g, i) => ({
        name: g.name.trim() || `Goal ${i + 1}`,
        amount: g.amount,
        atAge: g.atAge,
      })),
    };
  }, [
    mode,
    name,
    age,
    stYears,
    stRet,
    ltRet,
    infl,
    tax,
    delay,
    corpus,
    corpusRet,
    validAssignGoals,
    wName,
    wAge,
    wRet,
    wTax,
    validWithdrawalGoals,
  ]);

  const id = mode === "assign" ? "multi-goal-assign" : "multi-withdrawals";
  const { result, error, loading } = useCalculate<AssignResult & Partial<WithdrawResult>>(
    id,
    input,
    canCalculate,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const patchAssignGoal = (goalId: string, patch: Partial<AssignGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...patch } : g)));
  };

  const duplicateAssignGoal = (goalId: string) => {
    setGoals((prev) => {
      if (prev.length >= MAX_ASSIGN_GOALS) return prev;
      const source = prev.find((g) => g.id === goalId);
      if (!source) return prev;
      const baseName = source.name.replace(/\s*\(Copy\)\s*$/, "").trim() || "Goal";
      return [
        ...prev,
        {
          ...source,
          id: newGoalId(),
          name: `${baseName} (Copy)`,
        },
      ];
    });
  };

  const removeAssignGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const resetAssignGoals = () => {
    setGoals(createDefaultAssignGoals());
  };

  const patchWithdrawalGoal = (goalId: string, patch: Partial<WithdrawalGoal>) => {
    setWithdrawalGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...patch } : g)));
  };

  const addWithdrawalGoal = () => {
    setWithdrawalGoals((prev) => {
      if (prev.length >= MAX_GOALS) return prev;
      const nextIndex = prev.length + 1;
      const latestAge = prev.reduce((m, g) => Math.max(m, g.atAge), wAge);
      return [
        ...prev,
        {
          id: newGoalId(),
          category: "custom" as const,
          name: `Goal ${nextIndex}`,
          amount: 1_000_000,
          atAge: Math.max(wAge + 1, latestAge + 1),
        },
      ];
    });
  };

  const duplicateWithdrawalGoal = (goalId: string) => {
    setWithdrawalGoals((prev) => {
      if (prev.length >= MAX_GOALS) return prev;
      const source = prev.find((g) => g.id === goalId);
      if (!source) return prev;
      const baseName = source.name.replace(/\s*\(Copy\)\s*$/, "").trim() || "Goal";
      return [
        ...prev,
        {
          ...source,
          id: newGoalId(),
          name: `${baseName} (Copy)`,
        },
      ];
    });
  };

  const removeWithdrawalGoal = (goalId: string) => {
    setWithdrawalGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const resetWithdrawalGoals = () => {
    setWithdrawalGoals(createDefaultWithdrawalGoals());
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    if (mode === "withdrawals" && "rows" in result) {
      setIsDownloading(true);
      try {
        const safe = (wName || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          MULTI_WITHDRAWALS_REPORT_ID,
          `sip-multiple-withdrawals-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "assign" && "goals" in result) {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          MULTI_GOAL_ASSIGN_REPORT_ID,
          `multi-goal-assign-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const withdrawResult =
    mode === "withdrawals" && result && "ageChart" in result ? (result as WithdrawResult) : undefined;
  const assignResult =
    mode === "assign" && result && "goals" in result ? (result as AssignResult) : undefined;

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/multi-goal", mode)}
      description="Corpus assignment and SIP required for timed withdrawals across multiple goals."
      actions={
        <Button
          type="button"
          size="icon"
          className="h-8 w-8 shrink-0 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] transition-colors"
          onClick={handleDownload}
          disabled={!result || isDownloading}
          title={isDownloading ? "Preparing PDF…" : "Download Report"}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </Button>
      }
      form={
        mode === "assign" ? (
          <div className="flex flex-col gap-3">
            <div className={FORM_GRID}>
              <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
              <YearInput
                label="ST years"
                value={stYears}
                min={1}
                max={20}
                onChange={setStYears}
                error={stYearsError}
              />
              <PercentInput
                label="ST return (%)"
                value={stRet}
                onChange={setStRet}
                hint="Short-Term Goals"
                error={stRetError}
              />
              <PercentInput
                label="LT return (%)"
                value={ltRet}
                onChange={setLtRet}
                hint="Long-Term Goals"
                error={ltRetError}
              />
              <PercentInput
                label="Inflation (%)"
                value={infl}
                onChange={setInfl}
                error={inflError}
              />
              <PercentInput
                label="Tax (%)"
                value={tax}
                onChange={setTax}
                error={taxAssignError}
              />
              <YearInput
                label="Delay (mos)"
                value={delay}
                min={0}
                max={120}
                onChange={setDelay}
                error={delayError}
                hint="Investment starts after X months"
              />
              <MoneyInput
                label="Current corpus"
                value={corpus}
                onChange={setCorpus}
                error={corpusError}
                align="right"
              />
              <PercentInput
                label="Corpus ret. (%)"
                value={corpusRet}
                onChange={setCorpusRet}
                error={corpusRetError}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[var(--app-text-muted)]">
              All returns compounded annualised. Tax evaluated at withdrawal.
            </p>
            <div className={FORM_GRID}>
              <ClientHeader name={wName} age={wAge} onNameChange={setWName} onAgeChange={setWAge} />
              <PercentInput
                label="Expected return (%)"
                value={wRet}
                onChange={(v) => setWRet(Math.max(0, v))}
                hint={returnHint}
              />
              <PercentInput
                label="Tax (%)"
                value={wTax}
                onChange={(v) => setWTax(Math.min(100, Math.max(0, v)))}
                error={taxError}
              />
            </div>
          </div>
        )
      }
      results={
        <div className="flex flex-col gap-4 lg:gap-6">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p> : null}
          {mode === "assign" && assignAssumptionError ? (
            <p className="text-sm text-[var(--app-danger)]">
              Fix the highlighted assumption fields before calculating.
            </p>
          ) : null}
          {mode === "assign" && !assignAssumptionError && goals.length > 0 && validAssignGoals.length === 0 ? (
            <p className="text-sm text-[var(--app-danger)]">
              Every goal needs a name, amount &gt; ₹0, and years &gt; 0.
            </p>
          ) : null}
          {mode === "assign" && assignGoalErrors.size > 0 && validAssignGoals.length > 0 ? (
            <p className="text-sm text-[var(--app-warn-text)]">
              Some goals are incomplete or duplicated and are skipped until fixed.
            </p>
          ) : null}
          {mode === "withdrawals" && !canCalculate && withdrawalGoals.length === 0 ? (
            <p className="text-sm text-[var(--app-text-muted)]">Add at least one goal to calculate.</p>
          ) : null}
          {mode === "withdrawals" && taxError ? (
            <p className="text-sm text-[var(--app-danger)]">{taxError}</p>
          ) : null}
          {mode === "withdrawals" && !taxError && withdrawalGoals.length > 0 && validWithdrawalGoals.length === 0 ? (
            <p className="text-sm text-[var(--app-danger)]">
              Every goal needs amount &gt; 0 and withdrawal age greater than current age ({wAge}).
            </p>
          ) : null}
          {mode === "withdrawals" && hasInvalidGoals && validWithdrawalGoals.length > 0 ? (
            <p className="text-sm text-[var(--app-warn-text)]">
              Some goals are incomplete and are skipped until amount and age are fixed.
            </p>
          ) : null}
          {mode === "assign" ? (
            <>
              <AssignDashboard
                key={assignTimelineKey}
                goals={sortedAssignGoals}
                stYears={stYears}
                result={
                  result && "goals" in result && Array.isArray((result as AssignResult).goals)
                    ? (result as AssignResult)
                    : undefined
                }
                errors={assignGoalErrors}
                warnings={assignGoalWarnings}
                onPatch={patchAssignGoal}
                onDuplicate={duplicateAssignGoal}
                onRemove={removeAssignGoal}
                onRequestReset={() => setAssignResetOpen(true)}
                atCapacity={goals.length >= MAX_ASSIGN_GOALS}
              />
              <ConfirmResetDialog
                open={assignResetOpen}
                onCancel={() => setAssignResetOpen(false)}
                onConfirm={() => {
                  resetAssignGoals();
                  setAssignTimelineKey((k) => k + 1);
                  setAssignResetOpen(false);
                }}
              />
            </>
          ) : null}
          {mode === "withdrawals" ? (
            <>
              <WithdrawalsDashboard
                key={timelineKey}
                goals={sortedWithdrawalGoals}
                clientAge={wAge}
                wTax={wTax}
                result={withdrawResult}
                errors={goalErrors}
                warnings={goalWarnings}
                onPatch={patchWithdrawalGoal}
                onDuplicate={duplicateWithdrawalGoal}
                onRemove={removeWithdrawalGoal}
                onAdd={addWithdrawalGoal}
                onRequestReset={() => setResetConfirmOpen(true)}
                atCapacity={withdrawalGoals.length >= MAX_GOALS}
              />
              <ConfirmResetDialog
                open={resetConfirmOpen}
                onCancel={() => setResetConfirmOpen(false)}
                onConfirm={() => {
                  resetWithdrawalGoals();
                  setTimelineKey((k) => k + 1);
                  setResetConfirmOpen(false);
                }}
              />
            </>
          ) : null}
        </div>
      }
    />
    {mode === "withdrawals" && withdrawResult ? (
      <MultiWithdrawalsDossier
        data={{
          clientName: wName,
          age: wAge,
          returnPct: wRet,
          taxPct: wTax,
          startMonthlySip: withdrawResult.startMonthlySip,
          totalInvested: withdrawResult.totalInvested,
          totalWithdrawn: withdrawResult.totalWithdrawn,
          totalTax: withdrawResult.totalTax,
          rows: withdrawResult.rows,
          phases: withdrawResult.phases,
          schedule: withdrawResult.schedule,
        }}
      />
    ) : null}
    {mode === "assign" && assignResult ? (
      <MultiGoalAssignDossier
        data={{
          clientName: name,
          age,
          stYears,
          stReturnPct: stRet,
          ltReturnPct: ltRet,
          inflationPct: infl,
          taxPct: tax,
          delayMonths: delay,
          currentCorpus: corpus,
          corpusReturnPct: corpusRet,
          totalMonthlySip: assignResult.totalMonthlySip,
          totalSipInvested: assignResult.totalSipInvested,
          totalLumpsum: assignResult.totalLumpsum,
          totalAssigned: assignResult.totalAssigned,
          unassignedCorpus: assignResult.unassignedCorpus,
          goals: assignResult.goals,
        }}
      />
    ) : null}
    </>
  );
}

function matchAssignRow(
  rows: AssignResult["goals"] | undefined,
  goal: AssignGoal,
): AssignResult["goals"][number] | undefined {
  if (!rows?.length) return undefined;
  const displayName = goal.name.trim() || "Goal";
  return (
    rows.find((r) => r.name === displayName && r.years === goal.years && r.amount === goal.amount) ??
    rows.find((r) => r.years === goal.years && r.amount === goal.amount) ??
    rows.find((r) => r.name === displayName)
  );
}

type AssignFundingStatus = "fully" | "partial" | "needs";

function assignFundingStatus(goal: {
  assigned: number;
  monthlySip: number;
  lumpsum: number;
}): AssignFundingStatus {
  const needsTopUp = goal.monthlySip > 1e-6 || goal.lumpsum > 1e-6;
  if (goal.assigned > 1e-6 && !needsTopUp) return "fully";
  if (goal.assigned > 1e-6 && needsTopUp) return "partial";
  return "needs";
}

const FUNDING_STATUS_META: Record<
  AssignFundingStatus,
  { label: string; dot: string; text: string }
> = {
  fully: {
    label: "Fully funded by corpus",
    dot: "bg-[var(--app-step-text)]",
    text: "text-[var(--app-step-text)]",
  },
  partial: {
    label: "Partially funded",
    dot: "bg-[var(--app-warn-text)]",
    text: "text-[var(--app-warn-text)]",
  },
  needs: {
    label: "Needs SIP / lumpsum",
    dot: "bg-[var(--app-std-text)]",
    text: "text-[var(--app-std-text)]",
  },
};

function GoalNameWithFunding({
  name,
  status,
}: {
  name: string;
  status: AssignFundingStatus;
}) {
  const meta = FUNDING_STATUS_META[status];
  return (
    <div className="min-w-[8.5rem] py-0.5">
      <div className="font-medium text-[var(--app-text)]">{name}</div>
      <div className={`mt-1 flex items-center gap-1.5 ${meta.text}`}>
        <span className={`size-1.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden />
        <span className="text-[10px] font-medium leading-tight tracking-wide sm:text-[11px]">
          {meta.label}
        </span>
      </div>
    </div>
  );
}

function AssignDashboard({
  goals,
  stYears,
  result,
  errors,
  warnings,
  onPatch,
  onDuplicate,
  onRemove,
  onRequestReset,
  atCapacity,
}: {
  goals: AssignGoal[];
  stYears: number;
  result?: AssignResult;
  errors: Map<string, { name?: string; amount?: string; years?: string }>;
  warnings: Map<string, string>;
  onPatch: (id: string, patch: Partial<AssignGoal>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onRequestReset: () => void;
  atCapacity: boolean;
}) {
  const rows = result?.goals ?? [];
  const active = rows.filter((g) => g.amount > 0 && g.years > 0);
  const maxSip = active.reduce((m, g) => Math.max(m, g.monthlySip), 0);
  const highestSip = active.find((g) => g.monthlySip === maxSip && maxSip > 0);
  const soonest = [...active].sort((a, b) => a.years - b.years || a.name.localeCompare(b.name))[0];
  const largest = [...active].sort((a, b) => b.amount - a.amount)[0];
  const stCount = active.filter((g) => g.bucket === "ST").length;
  const ltCount = active.filter((g) => g.bucket === "LT").length;
  const maxYears = active.reduce((m, g) => Math.max(m, g.years), 0);
  const totalDelayCost = active.reduce((s, g) => s + (g.delayCost ?? 0), 0);
  const hasAssigned = (result?.totalAssigned ?? 0) > 0;
  const hasUnassigned = (result?.unassignedCorpus ?? 0) > 0;

  const sipCompare = active.map((g) => ({
    category: g.name,
    sublabel: `${g.years}y · ${g.bucket}`,
    amount: g.monthlySip,
    goalAmount: g.amount,
    years: g.years,
    bucket: g.bucket,
    fill: g.bucket === "ST" ? "var(--app-std-text)" : "var(--app-chart-gain)",
  }));

  const tableRows = active.map((g) => {
    const fundingStatus = assignFundingStatus(g);
    return {
      name: g.name,
      years: g.years,
      bucket: g.bucket,
      fundingStatus,
      amount: g.amount,
      inflAdjGoal: g.inflAdjGoal,
      assigned: g.assigned,
      monthlySip: g.monthlySip,
      lumpsum: g.lumpsum,
      sipInvested: g.sipInvested,
    };
  });

  const fundingSlices = [
    {
      name: "Assigned corpus",
      value: result?.totalAssigned ?? 0,
      color: "var(--app-chart-invested)",
    },
    {
      name: "Remaining lumpsum",
      value: result?.totalLumpsum ?? 0,
      color: "var(--app-chart-gain)",
    },
    {
      name: "Unused Corpus Remaining",
      value: result?.unassignedCorpus ?? 0,
      color: "var(--app-chart-tax)",
    },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {result ? (
        <>
          <div
            className={`grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2 ${
              hasUnassigned ? "xl:grid-cols-3 2xl:grid-cols-5" : "xl:grid-cols-4"
            }`}
          >
            <StatCard
              title="Total Investment Per Month"
              value={result.totalMonthlySip}
              size="lg"
              hint={
                highestSip
                  ? `Highest: ${formatINRCurrency(highestSip.monthlySip)}/mo (${highestSip.name})`
                  : "Combined monthly SIP across goals"
              }
            />
            <StatCard
              title="Total Investment (One-Time)"
              value={result.totalLumpsum}
              variant="soft"
              size="lg"
              hint={largest ? `Largest goal · ${largest.name}` : "One-time investment alternative"}
            />
            <StatCard
              title="Total Investment (SIP)"
              value={result.totalSipInvested}
              size="lg"
              hint="Total SIP capital over the horizon"
            />
            <StatCard
              title="Corpus Assigned"
              value={result.totalAssigned}
              size="lg"
              hint="Amount of current corpus allocated to goals."
            />
            {hasUnassigned ? (
              <StatCard
                title="Unused Corpus Remaining"
                value={result.unassignedCorpus}
                variant="soft"
                size="lg"
                hint="Corpus not yet allocated to a goal"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuickStat
              icon={soonest ? (CATEGORY_META[inferCategory(soonest.name)] || CATEGORY_META.custom).icon : Target}
              label="Soonest"
              value={soonest ? soonest.name : "-"}
              sub={soonest ? `${soonest.years} years` : undefined}
            />
            <QuickStat
              icon={largest ? (CATEGORY_META[inferCategory(largest.name)] || CATEGORY_META.custom).icon : Target}
              label="Largest"
              value={largest ? largest.name : "-"}
              sub={largest ? formatINRCurrency(largest.amount) : undefined}
            />
            <QuickStat icon={Target} label="Goals" value={`${active.length}`} sub={`${stCount} ST · ${ltCount} LT`} />
            <QuickStat icon={Calendar} label="Horizon" value={`${maxYears} yrs`} sub="Longest goal term" />
          </div>
        </>
      ) : null}

      <AssignGoalEditTimeline
        goals={goals}
        stYears={stYears}
        resultRows={rows}
        errors={errors}
        warnings={warnings}
        onPatch={onPatch}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onRequestReset={onRequestReset}
        atCapacity={atCapacity}
      />

      {result ? (
        <>
          <div className={`${RESULTS_SPLIT} lg:items-stretch`}>
            <div className={`${RESULTS_LEFT} min-h-0`}>
              <div className="flex h-full flex-col gap-4">
                <CompareChart
                  title="Monthly SIP by goal"
                  data={sipCompare}
                  series={[{ key: "amount", label: "Monthly SIP", color: "var(--app-chart-gain)" }]}
                  showBarLabels
                  showLegend={false}
                  className="h-[300px] w-full shrink-0 sm:h-[320px]"
                />
                <StackedBarChart
                  title="Corpus assigned vs remaining lumpsum"
                  className="h-[300px] w-full shrink-0 sm:h-[320px]"
                  data={result.compare.map((row) => ({
                    category: row.category,
                    assigned: row.assigned,
                    remaining: row.remaining,
                  }))}
                  series={[
                    { key: "assigned", label: "Assigned", color: "var(--app-chart-invested)" },
                    { key: "remaining", label: "Remaining LS", color: "var(--app-chart-gain)" },
                  ]}
                />
              </div>
            </div>
            <div className={`${RESULTS_RIGHT} min-h-0`}>
              <div className="flex h-full min-h-0 flex-col gap-4">
                <ResultCard
                  title="Allocation summary"
                  items={[
                    {
                      label: "Total Investment Per Month",
                      value: result.totalMonthlySip,
                      highlight: true,
                      tone: "inflation",
                    },
                    {
                      label: "Total Investment (SIP)",
                      value: result.totalSipInvested,
                      tone: "default",
                    },
                    {
                      label: "Total Investment (One-Time)",
                      value: result.totalLumpsum,
                      tone: "default",
                    },
                    {
                      label: "Corpus Assigned",
                      value: result.totalAssigned,
                      highlight: hasAssigned,
                      tone: "gain",
                      hint: "Amount of current corpus allocated to goals.",
                    },
                    ...(hasUnassigned
                      ? [
                          {
                            label: "Unused Corpus Remaining",
                            value: result.unassignedCorpus,
                            highlight: true,
                            tone: "delay" as const,
                          },
                        ]
                      : []),
                    ...(totalDelayCost > 0
                      ? [
                          {
                            label: "Cost of Delay",
                            value: totalDelayCost,
                            highlight: true,
                            tone: "delay" as const,
                          },
                        ]
                      : []),
                  ]}
                />
                <div className="flex min-h-[240px] flex-1 flex-col">
                  {fundingSlices.length === 0 ? (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-center">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
                        Funding mix
                      </div>
                      <p className="mt-3 text-sm text-[var(--app-text-muted)]">No corpus assigned yet</p>
                      <p className="mt-1 text-xs text-[var(--app-text-subtle)]">
                        Add current corpus or goals to see the mix.
                      </p>
                    </div>
                  ) : (
                    <div className="relative flex h-full flex-col">
                      {!hasAssigned ? (
                        <p className="mb-2 text-[11px] font-medium text-[var(--app-warn-text)]">
                          No corpus assigned yet · 100% remaining lumpsum path
                        </p>
                      ) : null}
                      <CompositionChart
                        title="Funding mix"
                        centerLabel={hasAssigned ? "Need" : "Remaining"}
                        centerValue={
                          hasAssigned
                            ? result.totalAssigned + result.totalLumpsum
                            : result.totalLumpsum
                        }
                        showPercentages
                        size="lg"
                        slices={fundingSlices}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ScheduleTable
              zebra
              columns={[
                {
                  key: "name",
                  header: "Goal",
                  sticky: true,
                  render: (_value, row) => (
                    <GoalNameWithFunding
                      name={String(row.name ?? "")}
                      status={row.fundingStatus as AssignFundingStatus}
                    />
                  ),
                },
                { key: "years", header: "Years", align: "right" },
                { key: "bucket", header: "Bucket", format: "text" },
                {
                  key: "amount",
                  header: "Goal amount",
                  format: "inr",
                  align: "right",
                  tone: "warn",
                },
                {
                  key: "inflAdjGoal",
                  header: "Infl-adj",
                  format: "inr",
                  align: "right",
                  tone: "warn",
                },
                {
                  key: "assigned",
                  header: "Assigned",
                  format: "inr",
                  align: "right",
                  tone: "step",
                },
                {
                  key: "monthlySip",
                  header: "Monthly SIP",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
                {
                  key: "lumpsum",
                  header: "Lumpsum",
                  format: "inr",
                  align: "right",
                  tone: "warn",
                },
                {
                  key: "sipInvested",
                  header: "SIP invested",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
              ]}
              rows={tableRows}
            />
        </>
      ) : null}
    </div>
  );
}

function AssignGoalEditTimeline({
  goals,
  stYears,
  resultRows,
  errors,
  warnings,
  onPatch,
  onDuplicate,
  onRemove,
  onRequestReset,
  atCapacity,
}: {
  goals: AssignGoal[];
  stYears: number;
  resultRows: AssignResult["goals"];
  errors: Map<string, { name?: string; amount?: string; years?: string }>;
  warnings: Map<string, string>;
  onPatch: (id: string, patch: Partial<AssignGoal>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onRequestReset: () => void;
  atCapacity: boolean;
}) {
  const sorted = useMemo(
    () => [...goals].sort((a, b) => a.years - b.years || a.id.localeCompare(b.id)),
    [goals],
  );

  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sorted.length === 0) {
      setActiveId(null);
      setOpenId(null);
      return;
    }
    if (!activeId || !sorted.some((g) => g.id === activeId)) {
      const next = sorted.find((g) => !doneIds.has(g.id)) ?? sorted[0];
      if (next) setActiveId(next.id);
    }
  }, [sorted, activeId, doneIds]);

  const prevCount = useRef(sorted.length);
  useEffect(() => {
    if (sorted.length > prevCount.current) {
      const added = goals[goals.length - 1];
      const newest = sorted[sorted.length - 1];
      if (added) {
        setActiveId(added.id);
        setOpenId(added.id);
      } else if (newest) {
        setActiveId(newest.id);
        setOpenId(newest.id);
      }
    }
    prevCount.current = sorted.length;
  }, [sorted.length, goals, sorted]);

  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-goal-dot]")) return;
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

  const markDoneAndAdvance = (id: string) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const provisional = new Set(doneIds);
    provisional.add(id);
    const idx = sorted.findIndex((g) => g.id === id);
    const target =
      sorted.slice(idx + 1).find((g) => !provisional.has(g.id)) ??
      sorted.find((g) => !provisional.has(g.id));

    setOpenId(null);
    if (target) {
      setActiveId(target.id);
      setOpenId(target.id);
    } else {
      setActiveId(id);
    }
  };

  const openGoal = openId ? sorted.find((g) => g.id === openId) : null;
  const openErr = openGoal ? errors.get(openGoal.id) : undefined;
  const openWarn = openGoal ? warnings.get(openGoal.id) : undefined;
  const openRow = openGoal ? matchAssignRow(resultRows, openGoal) : undefined;
  const openBucket = openGoal
    ? openGoal.years > 0 && openGoal.years <= stYears
      ? "ST"
      : "LT"
    : null;
  const doneCount = sorted.filter((g) => doneIds.has(g.id)).length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
            Goal timeline
          </h2>
          <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
            {goals.length} / {MAX_ASSIGN_GOALS}
          </span>
          {sorted.length > 0 ? (
            <span className="text-[11px] text-[var(--app-text-subtle)]">
              Review progress {doneCount}/{sorted.length}. Checkmarks mean reviewed, not funded.
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-[var(--app-border)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]"
            onClick={onRequestReset}
            title="Reset Goals"
          >
            <RotateCcw className="mr-1.5 size-4" />
            Reset
          </Button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-12 text-center">
          <Target className="mb-3 size-8 text-[var(--app-text-subtle)]" />
          <p className="mb-1 text-sm text-[var(--app-text-muted)]">No goals added.</p>
          <p className="text-xs text-[var(--app-text-subtle)]">Use Reset to restore the sample goals.</p>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="custom-scrollbar w-full overflow-x-auto pb-3 pt-6">
            <div
              className="relative flex w-full items-start justify-between px-2 sm:px-4"
              style={{
                minWidth: `max(100%, ${5.5 + sorted.length * 7.25}rem)`,
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
                    Start
                  </div>
                  <div className="text-xs font-semibold text-[var(--app-text)]">Today</div>
                </div>
              </div>

              {sorted.map((goal) => {
                const meta = CATEGORY_META[goal.category] || CATEGORY_META.custom;
                const Icon = meta.icon;
                const hasErr = Boolean(errors.get(goal.id));
                const isActive = activeId === goal.id;
                const isOpen = openId === goal.id;
                const isDone = doneIds.has(goal.id);
                const row = matchAssignRow(resultRows, goal);
                const bucket = goal.years > 0 && goal.years <= stYears ? "ST" : "LT";

                return (
                  <div
                    key={goal.id}
                    className="relative z-[1] flex w-[6.5rem] shrink-0 flex-col items-center"
                  >
                    <button
                      type="button"
                      data-goal-dot
                      className={`relative flex size-11 items-center justify-center rounded-full border-2 transition ${
                        hasErr
                          ? "border-[var(--app-danger)] bg-[var(--app-warn-bg)] text-[var(--app-danger)]"
                          : isActive || isOpen
                            ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)] ring-4 ring-[var(--app-step-text)]/20"
                            : isDone
                              ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-primary-soft)]"
                      }`}
                      onClick={() => togglePanel(goal.id)}
                      title={`${goal.name} · Year ${goal.years}`}
                      aria-expanded={isOpen}
                    >
                      {isDone && !hasErr ? <Check className="size-5" /> : <Icon className="size-5" />}
                      {isActive ? (
                        <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--app-step-text)]" />
                      ) : null}
                    </button>
                    <div className="mt-2 max-w-[6.5rem] text-center">
                      <div className="truncate text-xs font-semibold text-[var(--app-text)]">
                        {goal.name.trim() || "Goal"}
                      </div>
                      {isDone ? (
                        <div className="mt-0.5 flex justify-center">
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-[var(--app-step-bg)] text-[var(--app-step-text)]">
                            Reviewed
                          </span>
                        </div>
                      ) : null}
                      <div className="mt-0.5 flex justify-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            bucket === "ST"
                              ? "bg-[var(--app-std-bg)] text-[var(--app-std-text)]"
                              : "bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                          }`}
                        >
                          {bucket} · Y{goal.years}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10px] tabular-nums text-[var(--app-text-subtle)]">
                        {row ? formatINRCurrency(row.monthlySip) : formatINRCurrency(goal.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {openGoal ? (
            <div
              ref={panelRef}
              className="relative z-20 mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-md sm:p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--app-border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      (CATEGORY_META[openGoal.category] || CATEGORY_META.custom).color
                    }`}
                  >
                    {(() => {
                      const Icon = (CATEGORY_META[openGoal.category] || CATEGORY_META.custom).icon;
                      return <Icon className="size-4" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-[var(--app-text)]">
                        {openGoal.name.trim() || "Untitled goal"}
                      </div>
                      {openBucket ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            openBucket === "ST"
                              ? "bg-[var(--app-std-bg)] text-[var(--app-std-text)]"
                              : "bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                          }`}
                        >
                          {openBucket}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-[var(--app-text-muted)]">
                      Year {openGoal.years}
                      {openRow
                        ? ` · SIP ${formatINRCurrency(openRow.monthlySip)}/mo`
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => onDuplicate(openGoal.id)}
                    disabled={atCapacity}
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-[var(--app-danger)] hover:text-[var(--app-danger)]"
                    onClick={() => {
                      const id = openGoal.id;
                      setOpenId(null);
                      onRemove(id);
                      setDoneIds((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                    }}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Remove
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)]"
                    onClick={() => markDoneAndAdvance(openGoal.id)}
                  >
                    <Check className="mr-1.5 size-3.5" />
                    Reviewed · Next
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectInput
                  label="Category"
                  value={openGoal.category}
                  options={CATEGORY_OPTIONS}
                  onChange={(value) => {
                    const category = value as GoalCategory;
                    const newMeta = CATEGORY_META[category];
                    const prevMeta = CATEGORY_META[openGoal.category];
                    const shouldRename =
                      !openGoal.name.trim() ||
                      openGoal.name === prevMeta.label ||
                      openGoal.name.startsWith("Goal ");
                    onPatch(openGoal.id, {
                      category,
                      ...(shouldRename ? { name: newMeta.label } : {}),
                    });
                  }}
                />
                <Field label="Goal name" error={openErr?.name}>
                  <TextInput
                    value={openGoal.name}
                    onChange={(e) => onPatch(openGoal.id, { name: e.target.value })}
                    placeholder="Goal name"
                    className={openErr?.name ? "border-[var(--app-danger)]" : undefined}
                  />
                </Field>
                <MoneyInput
                  label="Amount"
                  value={openGoal.amount}
                  onChange={(amount) => onPatch(openGoal.id, { amount })}
                  error={openErr?.amount}
                  align="right"
                />
                <YearInput
                  label="Years"
                  value={openGoal.years}
                  min={0}
                  max={75}
                  onChange={(years) => onPatch(openGoal.id, { years })}
                  error={openErr?.years}
                  hint={!openErr?.years ? openWarn : undefined}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}


function WithdrawalsDashboard({

  goals,
  clientAge,
  wTax,
  result,
  errors,
  warnings,
  onPatch,
  onDuplicate,
  onRemove,
  onAdd,
  onRequestReset,
  atCapacity,
}: {
  goals: WithdrawalGoal[];
  clientAge: number;
  wTax: number;
  result?: WithdrawResult;
  errors: Map<string, { amount?: string; atAge?: string }>;
  warnings: Map<string, string>;
  onPatch: (id: string, patch: Partial<WithdrawalGoal>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onRequestReset: () => void;
  atCapacity: boolean;
}) {
  const rows = result?.rows ?? [];
  const maxSip = rows.reduce((m, r) => Math.max(m, r.monthlySip), 0);
  const highest = rows.find((r) => r.monthlySip === maxSip && maxSip > 0);
  const maxAge = rows.reduce((m, r) => Math.max(m, r.atAge), clientAge);
  const durationYears = Math.max(0, maxAge - clientAge);
  const wealthMultiplier =
    result && result.totalInvested > 0 ? result.totalWithdrawn / result.totalInvested : null;
  const distinctPayoutAges = result
    ? new Set(result.ageChart.filter((r) => r.withdrawal > 0).map((r) => r.age)).size
    : 0;

  const sortedByAge = [...rows].sort((a, b) => a.atAge - b.atAge);
  const earliest = sortedByAge[0];
  const largest = [...rows].sort((a, b) => b.amount - a.amount)[0];

  const compareData =
    result?.ageChart
      .filter((row) => row.withdrawal > 0)
      .map((row) => {
        const atAgeRows = rows.filter((r) => r.atAge === row.age);
        const payoutAges = result.ageChart.filter((r) => r.withdrawal > 0).length;
        return {
          // Short tick when many payout ages so labels do not collide.
          category: payoutAges >= 7 ? String(row.age) : `Age ${row.age}`,
          sublabel: atAgeRows.map((r) => r.name).join(" + "),
          corpus: row.corpus,
          withdrawal: row.withdrawal,
          fill:
            atAgeRows.length > 1
              ? "color-mix(in srgb, var(--app-chart-gain) 70%, var(--app-chart-invested))"
              : "var(--app-chart-gain)",
        };
      }) ?? [];

  /** Yearly corpus path from current age through last withdrawal (wealth journey). */
  const pathData =
    result?.schedule.map((row) => ({
      year: row.age,
      corpus: row.corpus,
      withdrawal: row.withdrawal,
      after: row.withdrawal > 0 ? Math.max(0, row.corpus - row.withdrawal) : null,
      marker: row.withdrawal > 0 ? row.corpus : null,
    })) ?? [];

  const milestones = rows.map((row) => ({
    age: row.atAge,
    label: row.name,
    amount: row.amount,
  }));

  const tableRows = rows.map((row) => ({
    goal: row.name,
    atAge: row.atAge,
    amount: row.amount,
    monthlySip: row.monthlySip,
    invested: row.invested,
    yearsLabel: `${row.years} Years`,
  }));

  const totalSip = rows.reduce((s, r) => s + r.monthlySip, 0);
  const totalInvestedRows = rows.reduce((s, r) => s + r.invested, 0);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {result ? (
        <>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Start monthly SIP"
              value={result.startMonthlySip}
              size="lg"
              hint={
                highest
                  ? `Highest: ${formatINRCurrency(highest.monthlySip)}/mo (${highest.name})`
                  : "Opening systematic flow"
              }
            />
            <StatCard
              title="Total goals value"
              value={result.totalWithdrawn}
              variant="soft"
              size="lg"
              hint={
                largest
                  ? `Largest: ${largest.name}`
                  : `Across ${rows.length} withdrawal${rows.length === 1 ? "" : "s"}`
              }
            />
            <StatCard
              title="Total investment"
              value={result.totalInvested}
              size="lg"
              hint={
                wealthMultiplier != null
                  ? `${wealthMultiplier.toFixed(2)}x on capital`
                  : "Across all goals"
              }
            />
            <StatCard
              title="Total tax"
              value={result.totalTax}
              variant="soft"
              size="lg"
              hint={`${wTax}% rate applied`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuickStat
              icon={earliest ? (CATEGORY_META[inferCategory(earliest.name)] || CATEGORY_META.custom).icon : Target}
              label="Earliest"
              value={earliest ? earliest.name : "-"}
              sub={earliest ? `Age ${earliest.atAge}` : undefined}
            />
            <QuickStat
              icon={largest ? (CATEGORY_META[inferCategory(largest.name)] || CATEGORY_META.custom).icon : Target}
              label="Largest"
              value={largest ? largest.name : "-"}
              sub={largest ? formatINRCurrency(largest.amount) : undefined}
            />
            <QuickStat
              icon={Target}
              label="Goals"
              value={`${rows.length}`}
              sub={
                distinctPayoutAges > 0
                  ? `${distinctPayoutAges} payout age${distinctPayoutAges === 1 ? "" : "s"}`
                  : "Planned"
              }
            />
            <QuickStat
              icon={Calendar}
              label="Duration"
              value={`${durationYears} yrs`}
              sub={`Age ${clientAge} to ${maxAge}`}
            />
          </div>
        </>
      ) : null}

      <GoalEditTimeline
        goals={goals}
        clientAge={clientAge}
        resultRows={rows}
        errors={errors}
        warnings={warnings}
        onPatch={onPatch}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onAdd={onAdd}
        onRequestReset={onRequestReset}
        atCapacity={atCapacity}
      />

      {result ? (
        <>
          <div className="flex flex-col gap-4">
            <CompareChart
              title="Corpus by withdrawal age"
              data={compareData}
              series={[{ key: "corpus", label: "Corpus", color: "var(--app-chart-gain)" }]}
              showBarLabels
              showLegend={false}
              className="h-[280px] w-full sm:h-[300px]"
            />
            <div className={`${RESULTS_SPLIT} lg:items-start`}>
              <div className={RESULTS_LEFT}>
                <WithdrawalPathChart data={pathData} milestones={milestones} title="Corpus over age" />
              </div>
              <div className={RESULTS_RIGHT}>
                <div className="[&>div]:p-3 sm:[&>div]:p-4 [&>div>h3]:text-xs">
                  <ResultCard
                    title="Totals"
                    items={[
                      {
                        label: "Start monthly SIP",
                        value: result.startMonthlySip,
                        tone: "maturity",
                        highlight: true,
                      },
                      { label: "Total goals value", value: result.totalWithdrawn, tone: "gain" },
                      { label: "Total invested", value: result.totalInvested },
                      { label: "Total tax", value: result.totalTax, tone: "tax" },
                      {
                        label: "Number of goals",
                        displayValue: String(rows.length),
                      },
                      {
                        label: "Investment duration",
                        displayValue: `${durationYears} years`,
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
                Withdrawal SIP schedule
              </h3>
              <p className="text-xs tabular-nums text-[var(--app-text-subtle)] sm:text-right">
                Combined SIP{" "}
                <span className="font-semibold text-[var(--app-text)]">
                  {formatINRCurrency(totalSip)}
                </span>
                <span className="mx-2 text-[var(--app-border)]">·</span>
                Invested{" "}
                <span className="font-semibold text-[var(--app-text)]">
                  {formatINRCurrency(totalInvestedRows)}
                </span>
              </p>
            </div>
            <ScheduleTable
              zebra
              columns={[
                { key: "goal", header: "Goal", sticky: true },
                { key: "atAge", header: "Withdrawal Age", align: "right" },
                {
                  key: "amount",
                  header: "Goal Amount",
                  format: "inr",
                  align: "right",
                  tone: "warn",
                },
                {
                  key: "monthlySip",
                  header: "Monthly SIP",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
                {
                  key: "invested",
                  header: "Total Invested",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
                { key: "yearsLabel", header: "Years Available", align: "right", tone: "step" },
              ]}
              rows={tableRows}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex h-full min-h-[6.75rem] flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3.5 sm:min-h-[7.5rem] sm:px-5 sm:py-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] sm:size-10">
          <Icon className="size-4 sm:size-5" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)] sm:text-xs">
          {label}
        </span>
      </div>
      <div className="mt-3 min-w-0 flex-1">
        <div className="break-words text-base font-semibold leading-snug text-[var(--app-text)] sm:text-lg">
          {value}
        </div>
        {sub ? (
          <div className="mt-1.5 text-xs leading-snug text-[var(--app-text-subtle)] sm:text-sm">
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}


function GoalEditTimeline({
  goals,
  clientAge,
  resultRows,
  errors,
  warnings,
  onPatch,
  onDuplicate,
  onRemove,
  onAdd,
  onRequestReset,
  atCapacity,
}: {
  goals: WithdrawalGoal[];
  clientAge: number;
  resultRows: WithdrawResult["rows"];
  errors: Map<string, { amount?: string; atAge?: string }>;
  warnings: Map<string, string>;
  onPatch: (id: string, patch: Partial<WithdrawalGoal>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onRequestReset: () => void;
  atCapacity: boolean;
}) {
  const sorted = useMemo(
    () => [...goals].sort((a, b) => a.atAge - b.atAge || a.id.localeCompare(b.id)),
    [goals],
  );

  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sorted.length === 0) {
      setActiveId(null);
      setOpenId(null);
      return;
    }
    if (!activeId || !sorted.some((g) => g.id === activeId)) {
      const next = sorted.find((g) => !doneIds.has(g.id)) ?? sorted[0];
      if (next) setActiveId(next.id);
    }
  }, [sorted, activeId, doneIds]);

  const prevCount = useRef(sorted.length);
  useEffect(() => {
    if (sorted.length > prevCount.current) {
      const newest = sorted[sorted.length - 1];
      const added = goals[goals.length - 1];
      if (added) {
        setActiveId(added.id);
        setOpenId(added.id);
      } else if (newest) {
        setActiveId(newest.id);
        setOpenId(newest.id);
      }
    }
    prevCount.current = sorted.length;
  }, [sorted.length, goals, sorted]);

  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-goal-dot]")) return;
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

  const markDoneAndAdvance = (id: string) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const provisional = new Set(doneIds);
    provisional.add(id);
    const idx = sorted.findIndex((g) => g.id === id);
    const target =
      sorted.slice(idx + 1).find((g) => !provisional.has(g.id)) ??
      sorted.find((g) => !provisional.has(g.id));

    setOpenId(null);
    if (target) {
      setActiveId(target.id);
      setOpenId(target.id);
    } else {
      setActiveId(id);
    }
  };

  const openGoal = openId ? sorted.find((g) => g.id === openId) : null;
  const openErr = openGoal ? errors.get(openGoal.id) : undefined;
  const openWarn = openGoal ? warnings.get(openGoal.id) : undefined;
  const openIndex = openGoal ? goals.findIndex((g) => g.id === openGoal.id) : -1;
  const openSip =
    openGoal && openIndex >= 0 ? matchRowSip(resultRows, openGoal, openIndex) : undefined;
  const doneCount = sorted.filter((g) => doneIds.has(g.id)).length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
            Goal timeline
          </h2>
          <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
            {goals.length} / {MAX_GOALS}
          </span>
          {sorted.length > 0 ? (
            <span className="text-[11px] text-[var(--app-text-subtle)]">
              Reviewed {doneCount}/{sorted.length}. Click a dot to edit.
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-[var(--app-border)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]"
            onClick={onRequestReset}
            title="Reset Goals"
          >
            <RotateCcw className="mr-1.5 size-4" />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)]"
            onClick={() => {
              onAdd();
            }}
            disabled={atCapacity}
            title="Add Goal"
          >
            <Plus className="mr-1.5 size-4" />
            Add Goal
          </Button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-12 text-center">
          <Target className="mb-3 size-8 text-[var(--app-text-subtle)]" />
          <p className="mb-4 text-sm text-[var(--app-text-muted)]">No withdrawal goals added.</p>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)]"
            onClick={onAdd}
          >
            <Plus className="mr-1.5 size-4" />
            Add First Goal
          </Button>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="custom-scrollbar w-full overflow-x-auto pb-3 pt-6">
            <div
              className="relative flex w-full items-start justify-between px-2 sm:px-4"
              style={{
                // At least full width; grow so each goal keeps a readable slot, then scroll.
                minWidth: `max(100%, ${5.5 + sorted.length * 7.25}rem)`,
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
                    Start
                  </div>
                  <div className="text-xs font-semibold text-[var(--app-text)]">Age {clientAge}</div>
                </div>
              </div>

              {sorted.map((goal) => {
                const meta = CATEGORY_META[goal.category] || CATEGORY_META.custom;
                const Icon = meta.icon;
                const hasErr = Boolean(errors.get(goal.id));
                const isActive = activeId === goal.id;
                const isOpen = openId === goal.id;
                const isDone = doneIds.has(goal.id);
                const yearsAway = goal.atAge - clientAge;
                const goalIndex = goals.findIndex((g) => g.id === goal.id);
                const sip = matchRowSip(resultRows, goal, goalIndex >= 0 ? goalIndex : 0);

                return (
                  <div
                    key={goal.id}
                    className="relative z-[1] flex w-[6.5rem] shrink-0 flex-col items-center"
                  >
                    <button
                      type="button"
                      data-goal-dot
                      className={`relative flex size-11 items-center justify-center rounded-full border-2 transition ${
                        hasErr
                          ? "border-[var(--app-danger)] bg-[var(--app-warn-bg)] text-[var(--app-danger)]"
                          : isActive || isOpen
                            ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)] ring-4 ring-[var(--app-step-text)]/20"
                            : isDone
                              ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-primary-soft)]"
                      }`}
                      onClick={() => togglePanel(goal.id)}
                      title={`${goal.name} · Age ${goal.atAge}`}
                      aria-expanded={isOpen}
                    >
                      {isDone && !hasErr ? <Check className="size-5" /> : <Icon className="size-5" />}
                      {isActive ? (
                        <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--app-step-text)]" />
                      ) : null}
                    </button>
                    <div className="mt-2 max-w-[6.5rem] text-center">
                      <div className="truncate text-xs font-semibold text-[var(--app-text)]">
                        {goal.name.trim() || "Goal"}
                      </div>
                      <div className="text-[10px] text-[var(--app-text-muted)]">Age {goal.atAge}</div>
                      <div className="text-[10px] tabular-nums text-[var(--app-text-subtle)]">
                        {yearsAway > 0 ? `${yearsAway}y` : "now"}
                        {sip != null ? ` · ${formatINRCurrency(sip)}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {openGoal ? (
            <div
              ref={panelRef}
              className="relative z-20 mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-md sm:p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--app-border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      (CATEGORY_META[openGoal.category] || CATEGORY_META.custom).color
                    }`}
                  >
                    {(() => {
                      const Icon = (CATEGORY_META[openGoal.category] || CATEGORY_META.custom).icon;
                      return <Icon className="size-4" />;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--app-text)]">
                      {openGoal.name.trim() || "Untitled goal"}
                    </div>
                    <div className="text-[11px] text-[var(--app-text-muted)]">
                      Withdrawal at age {openGoal.atAge}
                      {openSip != null ? ` · SIP ${formatINRCurrency(openSip)}/mo` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => onDuplicate(openGoal.id)}
                    disabled={atCapacity}
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-[var(--app-danger)] hover:text-[var(--app-danger)]"
                    onClick={() => {
                      const id = openGoal.id;
                      setOpenId(null);
                      onRemove(id);
                      setDoneIds((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                    }}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Remove
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)]"
                    onClick={() => markDoneAndAdvance(openGoal.id)}
                  >
                    <Check className="mr-1.5 size-3.5" />
                    Done · Next
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectInput
                  label="Category"
                  value={openGoal.category}
                  options={CATEGORY_OPTIONS}
                  onChange={(value) => {
                    const category = value as GoalCategory;
                    const newMeta = CATEGORY_META[category];
                    const prevMeta = CATEGORY_META[openGoal.category];
                    const shouldRename =
                      !openGoal.name.trim() ||
                      openGoal.name === prevMeta.label ||
                      openGoal.name.startsWith("Goal ");
                    onPatch(openGoal.id, {
                      category,
                      ...(shouldRename ? { name: newMeta.label } : {}),
                    });
                  }}
                />
                <Field label="Goal name">
                  <TextInput
                    value={openGoal.name}
                    onChange={(e) => onPatch(openGoal.id, { name: e.target.value })}
                    placeholder="Goal name"
                  />
                </Field>
                <MoneyInput
                  label="Amount"
                  value={openGoal.amount}
                  onChange={(amount) => onPatch(openGoal.id, { amount })}
                  error={openErr?.amount}
                />
                <YearInput
                  label="At age"
                  value={openGoal.atAge}
                  min={1}
                  max={120}
                  onChange={(atAge) => onPatch(openGoal.id, { atAge })}
                  error={openErr?.atAge}
                  hint={!openErr?.atAge ? openWarn : undefined}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
