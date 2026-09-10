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
import { generateCalculatorReport, generatePdfFromElement, type PdfTableData } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  ClientHeader,
  CompareChart,
  Field,
  formatINR,
  formatINRCurrency,
  ModeTabs,
  MoneyInput,
  parseDigits,
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

const DEFAULT_ASSIGN_GOALS = [
  { name: "Education", amount: 5_000_000, years: 10 },
  { name: "House1", amount: 8_000_000, years: 8 },
  { name: "House2", amount: 130_000_000, years: 12 },
  { name: "Car", amount: 4_800_000, years: 5 },
  { name: "Marriage", amount: 50_000_000, years: 25 },
];

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
  totalLumpsum: number;
  totalAssigned: number;
  unassignedCorpus: number;
  compare: Array<{ category: string; assigned: number; remaining: number }>;
  goals: Array<{
    name: string;
    years: number;
    inflAdjGoal: number;
    assigned: number;
    monthlySip: number;
    lumpsum: number;
    sipInvested: number;
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
  const [mode, setMode] = useCalculatorMode(MODE_IDS, "withdrawals");
  const [name, setName] = useState("Janardhan");
  const [age, setAge] = useState(43);
  const [stYears, setStYears] = useState(5);
  const [stRet, setStRet] = useState(7);
  const [ltRet, setLtRet] = useState(15);
  const [infl, setInfl] = useState(0);
  const [tax, setTax] = useState(0);
  const [delay, setDelay] = useState(12);
  const [corpus, setCorpus] = useState(0);
  const [corpusRet, setCorpusRet] = useState(7);
  const [goals, setGoals] = useState(DEFAULT_ASSIGN_GOALS);

  const [wName, setWName] = useState("Opinder Jain");
  const [wAge, setWAge] = useState(28);
  const [wRet, setWRet] = useState(12);
  const [wTax, setWTax] = useState(12.5);
  const [withdrawalGoals, setWithdrawalGoals] = useState<WithdrawalGoal[]>(createDefaultWithdrawalGoals);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);

  const taxError = wTax > 100 ? "Tax cannot exceed 100%." : undefined;
  const returnHint = wRet > 30 ? "Return above 30% is unusual. Double-check the assumption." : undefined;

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

  const validWithdrawalGoals = useMemo(
    () => withdrawalGoals.filter((g) => g.amount > 0 && g.atAge > wAge),
    [withdrawalGoals, wAge],
  );

  const hasHardErrors = Boolean(taxError);
  const hasInvalidGoals = withdrawalGoals.some((g) => goalErrors.has(g.id));
  const canCalculate =
    mode === "assign" || (validWithdrawalGoals.length > 0 && !hasHardErrors);

  const sortedWithdrawalGoals = useMemo(
    () =>
      [...withdrawalGoals].sort((a, b) => {
        if (a.atAge !== b.atAge) return a.atAge - b.atAge;
        return a.id.localeCompare(b.id);
      }),
    [withdrawalGoals],
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
        goals,
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
    goals,
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

    const tables: PdfTableData[] = [];
    if (mode === "assign" && "goals" in result) {
      const res = result as AssignResult;
      tables.push({
        title: "Goal Corpus Assignment",
        head: ["Goal", "Years", "Infl-Adj Goal", "Monthly SIP", "Lumpsum", "Assigned"],
        body: res.goals.map((row) => [
          row.name,
          row.years,
          row.inflAdjGoal,
          row.monthlySip,
          row.lumpsum,
          row.assigned,
        ]),
        columnAlignments: ["left", "right", "right", "right", "right", "right"],
        currencyColumns: [2, 3, 4, 5],
      });
      generateCalculatorReport({
        title: "Multi-Goal Assignment Dossier",
        subtitle: `Corpus allocation for ${name}`,
        clientName: name,
        age,
        status: "Validated Model",
        filename: `multi-goal-${name}`,
        headlines: [
          { label: "Total Monthly SIP", value: res.totalMonthlySip, highlight: true, hint: "Across all goals" },
          { label: "Total Lumpsum", value: res.totalLumpsum, hint: "Upfront alternative" },
        ],
        metrics: [
          { label: "Total Assigned", value: res.totalAssigned },
          { label: "Unassigned Corpus", value: res.unassignedCorpus },
          { label: "Goals", value: res.goals.length, currency: false },
          { label: "Current Corpus", value: corpus },
        ],
        assumptions: [
          ["Mode", "Corpus Assignment"],
          ["Short-Term Years", stYears],
          ["ST Return", `${stRet}%`],
          ["LT Return", `${ltRet}%`],
          ["Inflation", `${infl}%`],
          ["Tax", `${tax}%`],
          ["Delay (months)", delay],
        ],
        tables,
        playbook: playbookForPdf("multi-goal"),
      });
    }
  };

  const withdrawResult =
    mode === "withdrawals" && result && "ageChart" in result ? (result as WithdrawResult) : undefined;

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/multi-goal", mode)}
      description="Corpus assignment and SIP required for timed withdrawals across multiple goals."
      modes={<ModeTabs tabs={[...MODES]} value={mode} onChange={(m) => setMode(m as Mode)} />}
      actions={
        mode === "withdrawals" ? (
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
        ) : (
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] transition-colors"
            onClick={handleDownload}
            title="Download Report"
            disabled={!result}
          >
            <Download className="size-4" />
          </Button>
        )
      }
      form={
        mode === "assign" ? (
          <div className="flex flex-col gap-3">
            <div className={FORM_GRID}>
              <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
              <YearInput label="ST years" value={stYears} min={1} max={20} onChange={setStYears} />
              <PercentInput label="ST return (%)" value={stRet} onChange={setStRet} />
              <PercentInput label="LT return (%)" value={ltRet} onChange={setLtRet} />
              <PercentInput label="Inflation (%)" value={infl} onChange={setInfl} />
              <PercentInput label="Tax (%)" value={tax} onChange={setTax} />
              <YearInput label="Delay (mos)" value={delay} min={0} max={120} onChange={setDelay} />
              <MoneyInput label="Current corpus" value={corpus} onChange={setCorpus} />
              <PercentInput label="Corpus ret. (%)" value={corpusRet} onChange={setCorpusRet} />
            </div>
            <GoalGrid
              rows={goals}
              onChange={(index, patch) =>
                setGoals((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
              }
            />
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
          {mode === "assign" && result && "goals" in result ? <AssignResults result={result as AssignResult} /> : null}
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
    </>
  );
}

function GoalGrid({
  rows,
  onChange,
}: {
  rows: Array<{ name: string; amount: number; years: number }>;
  onChange: (index: number, patch: Partial<{ name: string; amount: number; years: number }>) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">Goals</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3"
          >
            <Field label="Name">
              <TextInput value={row.name} onChange={(e) => onChange(index, { name: e.target.value || "Goal" })} />
            </Field>
            <Field label="Amount">
              <TextInput
                inputMode="numeric"
                className="text-right"
                value={formatINR(row.amount)}
                onChange={(e) => onChange(index, { amount: parseDigits(e.target.value.replace(/,/g, "")) })}
              />
            </Field>
            <YearInput label="Years" value={row.years} min={0} max={75} onChange={(years) => onChange(index, { years })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignResults({ result }: { result: AssignResult }) {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard title="Total monthly SIP" value={result.totalMonthlySip} />
            <StatCard title="Total lumpsum" value={result.totalLumpsum} variant="soft" />
          </div>
          <CompareChart
            title="Assigned vs remaining lumpsum"
            data={result.compare}
            series={[
              { key: "assigned", label: "Assigned corpus", color: "var(--app-chart-invested)" },
              { key: "remaining", label: "Remaining LS", color: "var(--app-chart-gain)" },
            ]}
          />
          <StackedBarChart
            title="Corpus assigned per goal"
            data={result.compare.map((row) => ({
              category: row.category,
              assigned: row.assigned,
              remaining: row.remaining,
            }))}
            series={[
              { key: "assigned", label: "Assigned", color: "var(--app-chart-invested)" },
              { key: "remaining", label: "Still needed", color: "var(--app-chart-tax)" },
            ]}
          />
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="shrink-0">
            <ResultCard
              title="Totals"
              items={[
                { label: "Monthly SIP", value: result.totalMonthlySip },
                { label: "Lumpsum", value: result.totalLumpsum },
                { label: "Assigned corpus", value: result.totalAssigned },
                { label: "Unassigned corpus", value: result.unassignedCorpus },
              ]}
            />
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Per goal"
        columns={[
          { key: "name", header: "Goal" },
          { key: "years", header: "Years" },
          { key: "monthlySip", header: "SIP", format: "inr", align: "right" },
          { key: "lumpsum", header: "Lumpsum", format: "inr", align: "right" },
          { key: "assigned", header: "Assigned", format: "inr", align: "right" },
        ]}
        rows={result.goals}
      />
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

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--app-step-text-strong)]">
                Per withdrawal SIP
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                <span>
                  Totals · SIP{" "}
                  <span className="text-[var(--app-step-text)]">{formatINRCurrency(totalSip)}</span>
                </span>
                <span>
                  Invested{" "}
                  <span className="text-[var(--app-step-text)]">
                    {formatINRCurrency(totalInvestedRows)}
                  </span>
                </span>
              </div>
            </div>
            <ScheduleTable
              zebra
              columns={[
                { key: "goal", header: "Goal", sticky: true },
                { key: "atAge", header: "Withdrawal Age", align: "right" },
                { key: "amount", header: "Goal Amount", format: "inr", align: "right" },
                { key: "monthlySip", header: "Monthly SIP", format: "inr", align: "right" },
                { key: "invested", header: "Total Invested", format: "inr", align: "right" },
                { key: "yearsLabel", header: "Years Available", align: "right" },
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
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-[var(--app-text-muted)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
          {label}
        </span>
      </div>
      <div className="mt-1.5 truncate text-sm font-semibold text-[var(--app-text)]">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-[var(--app-text-muted)]">{sub}</div> : null}
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
