"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  formatINRCurrency,
  ageError,
  emailError,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
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
import { getCalculatorPageDescription, getCalculatorPageTitle } from "@/lib/calculator-nav";
import {
  WEALTH_CONTENT_CLASS,
  WealthAnalyticsChrome,
  WealthAuditChip,
  WealthAuditLedger,
  WealthSection,
  WealthProfileGrid,
  WealthMoneyField,
  WealthPercentField,
  WealthYearField,
  WealthAgeField,
  WealthTextField,
  WealthFieldShell,
  wealthInputClass,
  WealthMetricCard,
  WealthSegmented,
  WealthCompareBars,
  WealthDisclaimer,
  WealthDataTable,
  WealthHero,
  WealthMixDonut,
  WealthStackedBars,
  WealthStatusNote,
  WealthWithdrawalPath,
  moneyCell,
  WealthIconMark,
  IconPerson,
  IconTarget,
  IconChart,
  IconCalendar,
  IconRefresh,
  IconGrad,
  IconCheck,
  IconChevron,
  IconDonut,
  IconTimeline,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCar,
  IconHome,
  IconGem,
  IconSunset,
  IconPlane,
  wealthChart,
  wealthMixColors,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
} from "@/components/wealth";

const CORPUS_MIN = 10_000;
const CORPUS_MAX = 10_00_00_000;
const ST_YEARS_MAX = 20;

const BTN_SECONDARY =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50";
const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50";
const BTN_DANGER =
  "inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50";
const PILL =
  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium";
const META_TEXT = "text-[11px] text-slate-500";

const MODES = [
  { id: "assign", label: "Corpus assign" },
  { id: "withdrawals", label: "Withdrawals" },
] as const;

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
  { id: "car", label: "Car", icon: IconCar, color: "bg-slate-100 text-slate-700" },
  { id: "education", label: "Education", icon: IconGrad, color: "bg-slate-100 text-slate-700" },
  { id: "marriage", label: "Marriage", icon: IconGem, color: "bg-emerald-50 text-emerald-800" },
  { id: "retirement", label: "Retirement", icon: IconSunset, color: "bg-amber-50 text-amber-800" },
  { id: "house", label: "House", icon: IconHome, color: "bg-emerald-50 text-emerald-800" },
  { id: "vacation", label: "Vacation", icon: IconPlane, color: "bg-slate-100 text-slate-700" },
  { id: "custom", label: "Custom", icon: IconTarget, color: "bg-slate-50 text-slate-500" },
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
        className="relative z-[1] w-full max-w-md rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] text-[var(--app-warn-text-strong)]">
            <IconRefresh className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 pt-0.5">
              <span id="reset-goals-title">Reset goals</span>
            </h3>
            <p
              id="reset-goals-desc"
              className="mt-2 text-[13px] leading-relaxed text-[var(--app-text-muted)]"
            >
              Restore the default sample goals and clear your current timeline. Your edits will be
              lost.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--app-border)] pt-4">
          <button type="button" className={BTN_SECONDARY} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={onConfirm}>
            <IconRefresh className="size-3.5" />
            Reset goals
          </button>
        </div>
      </div>
    </div>
  );
}

export function MultiGoalCalculator() {
  const [mode] = useCalculatorMode(MODE_IDS, "withdrawals");
  const [name, setName] = useState("Janardhan");
  const [age, setAge] = useState(43);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
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
  const [wEmail, setWEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [wPhone, setWPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [wRet, setWRet] = useState(12);
  const [wTax, setWTax] = useState(12.5);
  const [withdrawalGoals, setWithdrawalGoals] = useState<WithdrawalGoal[]>(createDefaultWithdrawalGoals);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);

  const assignNameError = nameError(name);
  const assignAgeError = ageError(age);
  const assignEmailError = emailError(email);
  const assignPhoneError = phoneError(phone);
  const withdrawNameError = nameError(wName);
  const withdrawAgeError = ageError(wAge);
  const withdrawEmailError = emailError(wEmail);
  const withdrawPhoneError = phoneError(wPhone);

  const stRetError =
    stRet < 0 || stRet > 30
      ? "ST return should be between 0% and 30%."
      : rateError(stRet, "ST return");
  const ltRetError =
    ltRet < 0 || ltRet > 30
      ? "LT return should be between 0% and 30%."
      : rateError(ltRet, "LT return");
  const corpusRetError =
    corpusRet < 0 || corpusRet > 30
      ? "Corpus return should be between 0% and 30%."
      : rateError(corpusRet, "Corpus return");
  const inflError =
    infl < 0 || infl > 20
      ? "Inflation should be between 0% and 20%."
      : rateError(infl, "Inflation");
  const taxAssignError = rateError(tax, "Tax");
  const delayError =
    delay < 0 || delay > 120 ? "Delay should be between 0 and 120 months." : undefined;
  const stYearsError = !(stYears > 0) ? "ST years must be greater than zero." : undefined;
  const corpusError = corpus < 0 ? "Current corpus cannot be negative." : undefined;

  const taxError = rateError(wTax, "Tax");
  const wRetError = rateError(wRet, "Expected return");
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
    assignNameError ||
      assignAgeError ||
      assignEmailError ||
      assignPhoneError ||
      stRetError ||
      ltRetError ||
      corpusRetError ||
      inflError ||
      taxAssignError ||
      delayError ||
      stYearsError ||
      corpusError,
  );
  const hasHardErrors = Boolean(
    withdrawNameError ||
      withdrawAgeError ||
      withdrawEmailError ||
      withdrawPhoneError ||
      taxError ||
      wRetError,
  );
  const hasInvalidGoals = withdrawalGoals.some((g) => goalErrors.has(g.id));
  const canCalculate =
    mode === "assign"
      ? validAssignGoals.length > 0 && !assignAssumptionError
      : validWithdrawalGoals.length > 0 && !hasHardErrors;

  const fieldErrors =
    mode === "assign"
      ? [
          assignNameError,
          assignAgeError,
          assignEmailError,
          assignPhoneError,
          stYearsError,
          stRetError,
          ltRetError,
          inflError,
          taxAssignError,
          delayError,
          corpusError,
          corpusRetError,
          validAssignGoals.length === 0 && goals.length > 0
            ? "Every goal needs a name, amount > ₹0, and years > 0."
            : goals.length === 0
              ? "Add at least one goal to calculate."
              : undefined,
        ].filter((msg): msg is string => Boolean(msg))
      : [
          withdrawNameError,
          withdrawAgeError,
          withdrawEmailError,
          withdrawPhoneError,
          wRetError,
          taxError,
          withdrawalGoals.length === 0
            ? "Add at least one goal to calculate."
            : validWithdrawalGoals.length === 0
              ? `Every goal needs amount > 0 and withdrawal age greater than current age (${wAge}).`
              : undefined,
        ].filter((msg): msg is string => Boolean(msg));

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

  const resetDefaults = () => {
    if (mode === "assign") {
      setName("Janardhan");
      setAge(43);
      setEmail(DUMMY_REPORT_CONTACT.email);
      setPhone(DUMMY_REPORT_CONTACT.phone);
      setStYears(5);
      setStRet(7);
      setLtRet(12);
      setInfl(3);
      setTax(12.5);
      setDelay(12);
      setCorpus(10_000_000);
      setCorpusRet(7);
      setGoals(createDefaultAssignGoals());
      setAssignTimelineKey((k) => k + 1);
      return;
    }
    setWName("Opinder Jain");
    setWAge(28);
    setWEmail(DUMMY_REPORT_CONTACT.email);
    setWPhone(DUMMY_REPORT_CONTACT.phone);
    setWRet(12);
    setWTax(12.5);
    setWithdrawalGoals(createDefaultWithdrawalGoals());
    setTimelineKey((k) => k + 1);
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

  const profileName = mode === "assign" ? name : wName;
  const profileAge = mode === "assign" ? age : wAge;
  const profileEmail = mode === "assign" ? email : wEmail;
  const profilePhone = mode === "assign" ? phone : wPhone;
  const assumptionsRef = useRef<HTMLDivElement>(null);

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const heroPrimary =
    mode === "assign"
      ? (assignResult?.totalMonthlySip ?? 0)
      : (withdrawResult?.startMonthlySip ?? 0);
  const heroSecondary =
    mode === "assign"
      ? (assignResult?.totalAssigned ?? 0)
      : (withdrawResult?.totalWithdrawn ?? 0);
  const heroTertiary =
    mode === "assign"
      ? (assignResult?.totalLumpsum ?? 0)
      : (withdrawResult?.totalInvested ?? 0);

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/multi-goal", mode)}
      description={getCalculatorPageDescription("/multi-goal", mode)}
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
          goalLabel={mode === "assign" ? "Corpus assign" : "Withdrawals"}
          tenure={
            mode === "assign"
              ? Math.max(1, ...goals.map((g) => g.years), 1)
              : Math.max(
                  1,
                  ...withdrawalGoals.map((g) => Math.max(0, g.atAge - wAge)),
                  1,
                )
          }
          strategy={mode === "assign" ? "Multi-goal corpus" : "SIP with withdrawals"}
          onEdit={scrollToAssumptions}
          metrics={[
            {
              label: "Monthly SIP",
              value: heroPrimary,
              kind: "currency",
              tone: "emerald",
              mark: (
                <WealthIconMark tone="emerald" className="h-6 w-6">
                  <IconTarget className="h-3.5 w-3.5" />
                </WealthIconMark>
              ),
            },
            {
              label: mode === "assign" ? "Assigned" : "Withdrawn",
              value: heroSecondary,
              kind: "currency",
              tone: "slate",
            },
            {
              label: mode === "assign" ? "Lumpsum need" : "Invested",
              value: heroTertiary,
              kind: "currency",
              tone: "slate",
            },
          ]}
        />
      }
      form={
        <div ref={assumptionsRef} className="space-y-5">
        {mode === "assign" ? (

          <WealthSection
            badge="01 · Profile"
            title="Financial Assumptions & Modeling Suite"
            subtitle="Interactive engine for corpus assignment across short-term and long-term goals"
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
                  label="Client Name"
                  value={name}
                  onChange={(v) => setName(v)}
                  error={assignNameError}
                />
                <WealthAgeField value={age} onChange={setAge} error={assignAgeError} />
                <WealthTextField
                  label="Email"
                  value={email}
                  onChange={(v) => setEmail(v)}
                  error={assignEmailError}
                  type="email"
                  placeholder="client@email.com"
                />
                <WealthTextField
                  label="Phone"
                  value={phone}
                  onChange={(v) => setPhone(v)}
                  error={assignPhoneError}
                  type="tel"
                  placeholder="+91 98765 43210"
                />
                <WealthMoneyField
                  label="Current corpus"
                  value={corpus}
                  onChange={setCorpus}
                  error={corpusError}
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
                  label="ST years"
                  value={stYears}
                  min={1}
                  max={ST_YEARS_MAX}
                  onChange={setStYears}
                  error={stYearsError}
                  slider={{
                    min: 1,
                    max: ST_YEARS_MAX,
                    step: 1,
                    presets: WEALTH_YEAR_PRESETS_DEFAULT.filter((p) => p.value <= ST_YEARS_MAX),
                  }}
                />
                <WealthYearField
                  label="Delay (mos)"
                  value={delay}
                  min={0}
                  max={120}
                  onChange={setDelay}
                  error={delayError}
                  hint="Investment starts after X months"
                />
                <WealthPercentField
                  label="ST return (%)"
                  value={stRet}
                  onChange={setStRet}
                  hint="Short-Term Goals"
                  error={stRetError}
                />
                <WealthPercentField
                  label="LT return (%)"
                  value={ltRet}
                  onChange={setLtRet}
                  hint="Long-Term Goals"
                  error={ltRetError}
                />
                <WealthPercentField
                  label="Corpus ret. (%)"
                  value={corpusRet}
                  onChange={setCorpusRet}
                  error={corpusRetError}
                />
                <WealthPercentField
                  label="Inflation (%)"
                  value={infl}
                  onChange={setInfl}
                  error={inflError}
                />
                <WealthPercentField
                  label="Tax (%)"
                  value={tax}
                  onChange={setTax}
                  error={taxAssignError}
                />
                <div className="col-span-full min-w-0">
                  <AssignGoalEditTimeline
                    key={assignTimelineKey}
                    goals={sortedAssignGoals}
                    stYears={stYears}
                    resultRows={assignResult?.goals ?? []}
                    errors={assignGoalErrors}
                    warnings={assignGoalWarnings}
                    onPatch={patchAssignGoal}
                    onDuplicate={duplicateAssignGoal}
                    onRemove={removeAssignGoal}
                    onRequestReset={() => setAssignResetOpen(true)}
                    atCapacity={goals.length >= MAX_ASSIGN_GOALS}
                  />
                </div>
              </WealthProfileGrid>
            </div>
          </WealthSection>
        ) : (
          <WealthSection
            badge="01 · Profile"
            title="Financial Assumptions & Modeling Suite"
            subtitle="Interactive engine for SIP required across timed withdrawal goals"
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
                  label="Client Name"
                  value={wName}
                  onChange={(v) => setWName(v)}
                  error={withdrawNameError}
                />
                <WealthAgeField value={wAge} onChange={setWAge} error={withdrawAgeError} />
                <WealthTextField
                  label="Email"
                  value={wEmail}
                  onChange={(v) => setWEmail(v)}
                  error={withdrawEmailError}
                  type="email"
                  placeholder="client@email.com"
                />
                <WealthTextField
                  label="Phone"
                  value={wPhone}
                  onChange={(v) => setWPhone(v)}
                  error={withdrawPhoneError}
                  type="tel"
                  placeholder="+91 98765 43210"
                />
                <div className="col-span-full min-w-0">
                  <p className={META_TEXT}>
                    All returns compounded annualised. Tax evaluated at withdrawal.
                  </p>
                </div>
                <WealthPercentField
                  label="Expected return (%)"
                  value={wRet}
                  onChange={(v) => setWRet(Math.max(0, v))}
                  hint={returnHint}
                  error={wRetError}
                />
                <WealthPercentField
                  label="Tax (%)"
                  value={wTax}
                  onChange={(v) => setWTax(Math.min(100, Math.max(0, v)))}
                  error={taxError}
                />
                <div className="col-span-full min-w-0">
                  <GoalEditTimeline
                    key={timelineKey}
                    goals={sortedWithdrawalGoals}
                    clientAge={wAge}
                    resultRows={withdrawResult?.rows ?? []}
                    errors={goalErrors}
                    warnings={goalWarnings}
                    onPatch={patchWithdrawalGoal}
                    onDuplicate={duplicateWithdrawalGoal}
                    onRemove={removeWithdrawalGoal}
                    onAdd={addWithdrawalGoal}
                    onRequestReset={() => setResetConfirmOpen(true)}
                    atCapacity={withdrawalGoals.length >= MAX_GOALS}
                  />
                </div>
              </WealthProfileGrid>
            </div>
          </WealthSection>
        )}
        </div>
      }
      results={
        <>
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
          {loading && !result && canCalculate ? (
            <WealthStatusNote tone="info">Calculating…</WealthStatusNote>
          ) : null}
          {mode === "assign" && assignGoalErrors.size > 0 && validAssignGoals.length > 0 ? (
            <div className="rounded-xl border border-dashed border-rose-300 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold text-rose-800">Incomplete goals</p>
              <p className="mt-1 text-[11px] leading-relaxed text-rose-700">
                Some goals are incomplete or duplicated and are skipped until fixed.
              </p>
            </div>
          ) : null}
          {mode === "withdrawals" && hasInvalidGoals && validWithdrawalGoals.length > 0 ? (
            <div className="rounded-xl border border-dashed border-rose-300 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold text-rose-800">Incomplete goals</p>
              <p className="mt-1 text-[11px] leading-relaxed text-rose-700">
                Some goals are incomplete and are skipped until amount and age are fixed.
              </p>
            </div>
          ) : null}
          {mode === "assign" && assignResult ? (
            <AssignDashboard
              result={assignResult}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
            />
          ) : null}
          {mode === "withdrawals" && withdrawResult ? (
            <WithdrawalsDashboard
              clientAge={wAge}
              result={withdrawResult}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
            />
          ) : null}
          <ConfirmResetDialog
            open={assignResetOpen}
            onCancel={() => setAssignResetOpen(false)}
            onConfirm={() => {
              resetAssignGoals();
              setAssignTimelineKey((k) => k + 1);
              setAssignResetOpen(false);
            }}
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
      }
      footer={
        result ? (
        <WealthDisclaimer
          notes={[
            "Corpus assignment follows the schedule and priority rules entered for each goal.",
            "Inflation and tax assumptions apply uniformly unless a goal overrides them.",
            "Projections are illustrative. Actual market returns and withdrawal timing can differ.",
          ]}
        >
          Figures are for illustration only. Multi-goal projections depend on assumed returns,
          inflation, tax, corpus assignment rules, and the goal schedule entered. Markets carry
          risk; past performance does not guarantee future results.
        </WealthDisclaimer>
        ) : null
      }
    />
    {mode === "withdrawals" && withdrawResult ? (
      <MultiWithdrawalsDossier
        data={{
          clientName: wName,
          age: wAge,
          email: wEmail,
          phone: wPhone,
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
          email,
          phone,
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
  result,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  result: AssignResult;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const rows = result.goals;
  const active = rows.filter((g) => g.amount > 0 && g.years > 0);
  const maxSip = active.reduce((m, g) => Math.max(m, g.monthlySip), 0);
  const highestSip = active.find((g) => g.monthlySip === maxSip && maxSip > 0);
  const soonest = [...active].sort((a, b) => a.years - b.years || a.name.localeCompare(b.name))[0];
  const largest = [...active].sort((a, b) => b.amount - a.amount)[0];
  const stCount = active.filter((g) => g.bucket === "ST").length;
  const ltCount = active.filter((g) => g.bucket === "LT").length;
  const maxYears = active.reduce((m, g) => Math.max(m, g.years), 0);
  const hasAssigned = result.totalAssigned > 0;
  const hasUnassigned = result.unassignedCorpus > 0;
  const [chartTab, setChartTab] = useState<"sip" | "lumpsum" | "mix">("sip");

  const sipCompare = active.map((g) => ({
    category: g.name,
    sublabel: `${g.years}y · ${g.bucket}`,
    amount: g.monthlySip,
    goalAmount: g.amount,
    years: g.years,
    bucket: g.bucket,
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
      value: result.totalAssigned,
      color: wealthMixColors.invested,
    },
    {
      name: "Remaining lumpsum",
      value: result.totalLumpsum,
      color: wealthMixColors.gain,
    },
    {
      name: "Unused Corpus Remaining",
      value: result.unassignedCorpus,
      color: wealthMixColors.tax,
    },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-5">
      <WealthSection
        badge="02 · Milestones"
        title="Corpus Assignment Milestones"
        subtitle="Combined SIP, lumpsum, and corpus allocation across goals"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WealthMetricCard
            title="Total Investment Per Month"
            value={result.totalMonthlySip}
            description={
              highestSip
                ? `Highest: ${formatINRCurrency(highestSip.monthlySip)}/mo (${highestSip.name})`
                : "Combined monthly SIP across goals"
            }
            tone="positive"
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconChart className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Total Investment (One-Time)"
            value={result.totalLumpsum}
            description={largest ? `Largest goal · ${largest.name}` : "One-time investment alternative"}
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Total Investment (SIP)"
            value={result.totalSipInvested}
            description="Total SIP capital over the horizon"
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTimeline className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Corpus Assigned"
            value={result.totalAssigned}
            description="Amount of current corpus allocated to goals."
            tone="positive"
            footer={
              <>
                {soonest ? `${soonest.name} in ${soonest.years} years` : `${active.length} goals`}
                {" · "}
                {stCount} short term, {ltCount} long term
              </>
            }
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconCalendar className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          {hasUnassigned ? (
            <WealthMetricCard
              title="Unused Corpus Remaining"
              value={result.unassignedCorpus}
              description="Corpus not yet allocated to a goal"
              tone="neutral"
              mark={
                <WealthIconMark className="h-7 w-7">
                  <IconDonut className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
          ) : null}
        </div>
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Allocation Analytics"
        subtitle="SIP by goal, lumpsum stack, and funding mix"
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
              layoutId="assign-chart-tab"
              value={chartTab}
              onChange={setChartTab}
              options={[
                { id: "sip", label: "Monthly SIP", icon: <IconChart className="h-4 w-4" /> },
                { id: "lumpsum", label: "Lumpsum", icon: <IconChart className="h-4 w-4" /> },
                { id: "mix", label: "Funding mix", icon: <IconDonut className="h-4 w-4" /> },
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
          {chartTab === "sip" ? (
            <WealthCompareBars
              showBarLabels
              data={sipCompare}
              series={[{ key: "amount", label: "Monthly SIP", color: wealthChart.invested }]}
            />
          ) : null}
          {chartTab === "lumpsum" ? (
            <WealthStackedBars
              data={result.compare.map((row) => ({
                category: row.category,
                assigned: row.assigned,
                remaining: row.remaining,
              }))}
              series={[
                { key: "assigned", label: "Assigned", color: wealthChart.invested },
                { key: "remaining", label: "Remaining LS", color: wealthChart.standard },
              ]}
              totalLabel="Goal need"
            />
          ) : null}
          {chartTab === "mix" ? (
            <>
              {fundingSlices.length === 0 ? (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Funding mix
                  </div>
                  <p className="mt-3 text-[13px] text-slate-500">No corpus assigned yet</p>
                  <p className={`mt-1 ${META_TEXT}`}>Add current corpus or goals to see the mix.</p>
                </div>
              ) : (
                <div className="relative flex h-full flex-col">
                  {!hasAssigned ? (
                    <p className="mb-2 text-[11px] font-medium text-amber-700">
                      No corpus assigned yet · 100% remaining lumpsum path
                    </p>
                  ) : null}
                  <WealthMixDonut
                    title="Funding mix"
                    centerLabel={hasAssigned ? "Need" : "Remaining"}
                    centerValue={
                      hasAssigned
                        ? result.totalAssigned + result.totalLumpsum
                        : result.totalLumpsum
                    }
                    slices={fundingSlices}
                  />
                </div>
              )}
            </>
          ) : null}
          </motion.div>
        </AnimatePresence>
        </WealthAnalyticsChrome>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Goal Allocation Schedule"
        subtitle="Per-goal assigned corpus, SIP, lumpsum, and invested capital"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <div className="space-y-5">
        <WealthAuditLedger
          stats={[
            {
              label: "Goals",
              value: String(active.length),
              hint: `${stCount} short term · ${ltCount} long term`,
            },
            {
              label: "Monthly SIP",
              value: formatINRCurrency(result.totalMonthlySip),
              hint: soonest ? `Soonest · ${soonest.name} in ${soonest.years} years` : "Combined SIP",
              tone: "emerald",
            },
            {
              label: "Horizon",
              value: `${maxYears} yrs`,
              hint: largest ? `Largest · ${largest.name}` : "Longest goal term",
            },
          ]}
          chips={
            <WealthAuditChip label="Assigned corpus">
              {formatINRCurrency(result.totalAssigned)}
              {hasUnassigned ? ` · unused ${formatINRCurrency(result.unassignedCorpus)}` : ""}
            </WealthAuditChip>
          }
          columns={["Path", "Amount"]}
          rows={[
            {
              label: "One-time investment",
              cells: [{ text: formatINRCurrency(result.totalLumpsum) }],
            },
            {
              label: "SIP invested",
              cells: [{ text: formatINRCurrency(result.totalSipInvested), tone: "emerald" as const }],
            },
            {
              label: "Corpus assigned",
              highlight: true,
              cells: [{ text: formatINRCurrency(result.totalAssigned), tone: "pill" as const }],
            },
          ]}
          note="Assigned is corpus allocated today. Monthly SIP and lumpsum are alternate paths to close the remaining need."
        />
        <WealthDataTable
          rows={tableRows}
          getRowKey={(row) => `${row.name}-${row.years}`}
          filterPlaceholder="Filter goals…"
          summary={[
            { label: "Goals", value: String(tableRows.length) },
            {
              label: "Monthly SIP",
              value: formatINRCurrency(result.totalMonthlySip),
              tone: "step",
            },
            {
              label: "Assigned",
              value: formatINRCurrency(result.totalAssigned),
              tone: "std",
            },
            {
              label: "Lumpsum",
              value: formatINRCurrency(result.totalLumpsum),
            },
          ]}
          note="Each row is one funded goal. Assigned is corpus allocated today; Monthly SIP and Lumpsum are alternate paths to close the remaining need."
          columns={[
            {
              key: "name",
              header: "Goal",
              sticky: true,
              searchValue: (row) => row.name,
              render: (row) => (
                <GoalNameWithFunding name={row.name} status={row.fundingStatus} />
              ),
            },
            {
              key: "years",
              header: "Years",
              align: "right",
              searchValue: (row) => String(row.years),
              render: (row) => row.years,
            },
            {
              key: "bucket",
              header: "Bucket",
              searchValue: (row) => row.bucket,
              render: (row) => row.bucket,
            },
            {
              key: "amount",
              header: "Goal amount",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.amount),
            },
            {
              key: "inflAdjGoal",
              header: "Infl-adj",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.inflAdjGoal),
            },
            {
              key: "assigned",
              header: "Assigned",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.assigned),
            },
            {
              key: "monthlySip",
              header: "Monthly SIP",
              align: "right",
              render: (row) => moneyCell(row.monthlySip),
            },
            {
              key: "lumpsum",
              header: "Lumpsum",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.lumpsum),
            },
            {
              key: "sipInvested",
              header: "SIP invested",
              align: "right",
              render: (row) => moneyCell(row.sipInvested),
            },
          ]}
        />
        </div>
      </WealthSection>
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
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Goal timeline</h2>
          <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
            {goals.length} / {MAX_ASSIGN_GOALS}
          </span>
          {sorted.length > 0 ? (
            <span className={META_TEXT}>
              Review progress {doneCount}/{sorted.length}. Checkmarks mean reviewed, not funded.
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={onRequestReset}
            title="Reset Goals"
          >
            <IconRefresh className="size-3.5" />
            Reset
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-10 text-center">
          <IconTarget className="mb-2.5 size-7 text-[var(--app-text-subtle)]" />
          <p className="mb-1 text-[13px] text-[var(--app-text-muted)]">No goals added.</p>
          <p className={META_TEXT}>Use Reset to restore the sample goals.</p>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" aria-hidden />
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
                  <IconChevron className="size-5 -rotate-90" />
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
                      {isDone && !hasErr ? <IconCheck className="size-5" /> : <Icon className="size-5" />}
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
                          <span className={`${PILL} bg-[var(--app-step-bg)] text-[var(--app-step-text)]`}>
                            Reviewed
                          </span>
                        </div>
                      ) : null}
                      <div className="mt-0.5 flex justify-center">
                        <span
                          className={`${PILL} ${
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
              className="relative z-20 mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-md sm:p-4"
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
                          className={`${PILL} ${
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
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={() => onDuplicate(openGoal.id)}
                    disabled={atCapacity}
                  >
                    <IconCopy className="size-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className={BTN_DANGER}
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
                    <IconTrash className="size-3.5" />
                    Remove
                  </button>
                  <button
                    type="button"
                    className={BTN_PRIMARY}
                    onClick={() => markDoneAndAdvance(openGoal.id)}
                  >
                    <IconCheck className="size-3.5" />
                    Reviewed · Next
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <WealthFieldShell label="Category">
                  <select
                    value={openGoal.category}
                    onChange={(e) => {
                      const category = e.target.value as GoalCategory;
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
                    className={wealthInputClass}
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </WealthFieldShell>
                <WealthTextField
                  label="Goal name"
                  value={openGoal.name}
                  onChange={(name) => onPatch(openGoal.id, { name })}
                  placeholder="Goal name"
                  error={openErr?.name}
                />
                <WealthMoneyField
                  label="Amount"
                  value={openGoal.amount}
                  onChange={(amount) => onPatch(openGoal.id, { amount })}
                  error={openErr?.amount}
                />
                <WealthYearField
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
  clientAge,
  result,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  clientAge: number;
  result: WithdrawResult;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const rows = result.rows;
  const maxAge = rows.reduce((m, r) => Math.max(m, r.atAge), clientAge);
  const durationYears = Math.max(0, maxAge - clientAge);
  const distinctPayoutAges = new Set(
    result.ageChart.filter((r) => r.withdrawal > 0).map((r) => r.age),
  ).size;

  const sortedByAge = [...rows].sort((a, b) => a.atAge - b.atAge);
  const earliest = sortedByAge[0];
  const largest = [...rows].sort((a, b) => b.amount - a.amount)[0];

  const compareData = result.ageChart
    .filter((row) => row.withdrawal > 0)
    .map((row) => {
      const atAgeRows = rows.filter((r) => r.atAge === row.age);
      const payoutAges = result.ageChart.filter((r) => r.withdrawal > 0).length;
      return {
        category: payoutAges >= 7 ? String(row.age) : `Age ${row.age}`,
        sublabel: atAgeRows.map((r) => r.name).join(" + "),
        corpus: row.corpus,
        withdrawal: row.withdrawal,
      };
    });

  const pathData = result.schedule.map((row) => ({
    year: row.age,
    corpus: row.corpus,
    withdrawal: row.withdrawal,
    after: row.withdrawal > 0 ? Math.max(0, row.corpus - row.withdrawal) : null,
    marker: row.withdrawal > 0 ? row.corpus : null,
  }));

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
    peakCorpus: row.peakCorpus,
    yearsLabel: `${row.years} Years`,
  }));

  const totalSip = rows.reduce((s, r) => s + r.monthlySip, 0);
  const totalInvestedRows = rows.reduce((s, r) => s + r.invested, 0);
  const [chartTab, setChartTab] = useState<"path" | "withdrawals">("path");

  return (
    <div className="space-y-5">
      <WealthSection
        badge="02 · Milestones"
        title="Withdrawal Funding Milestones"
        subtitle="Start SIP, total investment, and tax across timed goals"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WealthMetricCard
            title="Start monthly SIP"
            value={result.startMonthlySip}
            description="Required starting SIP"
            tone="positive"
            footer={earliest ? <>Earliest · {earliest.name} at age {earliest.atAge}</> : undefined}
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconChart className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Total goals value"
            value={result.totalWithdrawn}
            description="Sum of planned withdrawals"
            tone="neutral"
            footer={largest ? <>Largest · {largest.name}</> : undefined}
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Total investment"
            value={result.totalInvested}
            description="Capital contributed"
            tone="neutral"
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTimeline className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Total tax"
            value={result.totalTax}
            description="Estimated tax on gains"
            tone="accent"
            footer={
              <>
                {rows.length} goals · {durationYears} years · age {clientAge} to {maxAge}
              </>
            }
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
        title="Withdrawal Path Analytics"
        subtitle="Corpus journey and payout bars by age"
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
              layoutId="withdraw-chart-tab"
              value={chartTab}
              onChange={setChartTab}
              options={[
                { id: "path", label: "Path", icon: <IconTimeline className="h-4 w-4" /> },
                {
                  id: "withdrawals",
                  label: "Withdrawals",
                  icon: <IconChart className="h-4 w-4" />,
                },
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
          {chartTab === "path" ? (
            <WealthWithdrawalPath data={pathData} milestones={milestones} />
          ) : (
            <WealthCompareBars
              showBarLabels
              data={compareData}
              series={[{ key: "corpus", label: "Corpus", color: wealthChart.stepUp }]}
            />
          )}
          </motion.div>
        </AnimatePresence>
        </WealthAnalyticsChrome>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Withdrawal Goal Schedule"
        subtitle="Per-goal SIP, invested capital, and corpus at withdrawal age"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <div className="space-y-5">
        <WealthAuditLedger
          stats={[
            {
              label: "Goals",
              value: String(rows.length),
              hint:
                distinctPayoutAges > 0
                  ? `${distinctPayoutAges} payout age${distinctPayoutAges === 1 ? "" : "s"}`
                  : "Planned",
            },
            {
              label: "Combined SIP",
              value: formatINRCurrency(totalSip),
              hint: earliest ? `Earliest · ${earliest.name}` : "Starting SIP",
              tone: "emerald",
            },
            {
              label: "Duration",
              value: `${durationYears} yrs`,
              hint: `Age ${clientAge} to ${maxAge}`,
            },
          ]}
          chips={
            <WealthAuditChip label="Invested">
              {formatINRCurrency(totalInvestedRows)}
              {largest ? ` · largest ${largest.name}` : ""}
            </WealthAuditChip>
          }
          columns={["Metric", "Amount"]}
          rows={[
            {
              label: "Total withdrawn",
              cells: [{ text: formatINRCurrency(result.totalWithdrawn) }],
            },
            {
              label: "Total tax",
              tax: true,
              cells: [{ text: formatINRCurrency(result.totalTax), tone: "rose" as const }],
            },
            {
              label: "Total invested",
              highlight: true,
              cells: [{ text: formatINRCurrency(result.totalInvested), tone: "pill" as const }],
            },
          ]}
          note="Each withdrawal is funded by its own SIP until the payout age."
        />
        <WealthDataTable
          rows={tableRows}
          getRowKey={(row, i) => `${row.goal}-${row.atAge}-${i}`}
          filterPlaceholder="Filter goals…"
          summary={[
            { label: "Goals", value: String(rows.length) },
            {
              label: "Combined SIP",
              value: formatINRCurrency(totalSip),
              tone: "step",
            },
            {
              label: "Invested",
              value: formatINRCurrency(totalInvestedRows),
              tone: "std",
            },
            {
              label: "Duration",
              value: `${durationYears} yrs`,
            },
          ]}
          note="Each row is one withdrawal goal. Monthly SIP funds that goal until the withdrawal age; corpus at withdrawal is the projected balance just before payout."
          columns={[
            {
              key: "goal",
              header: "Goal",
              sticky: true,
              searchValue: (row) => row.goal,
              render: (row) => row.goal,
            },
            {
              key: "atAge",
              header: "Withdrawal Age",
              align: "right",
              searchValue: (row) => String(row.atAge),
              render: (row) => row.atAge,
            },
            {
              key: "amount",
              header: "Goal Amount",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.amount),
            },
            {
              key: "monthlySip",
              header: "Monthly SIP",
              align: "right",
              render: (row) => moneyCell(row.monthlySip),
            },
            {
              key: "invested",
              header: "Total Invested",
              align: "right",
              render: (row) => moneyCell(row.invested),
            },
            {
              key: "peakCorpus",
              header: "Corpus at Withdrawal",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.peakCorpus),
            },
            {
              key: "yearsLabel",
              header: "Years Available",
              align: "right",
              tone: "emerald",
              render: (row) => row.yearsLabel,
            },
          ]}
        />
        </div>
      </WealthSection>
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
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Goal timeline</h2>
          <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
            {goals.length} / {MAX_GOALS}
          </span>
          {sorted.length > 0 ? (
            <span className={META_TEXT}>
              Reviewed {doneCount}/{sorted.length}. Click a dot to edit.
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={onRequestReset}
            title="Reset Goals"
          >
            <IconRefresh className="size-3.5" />
            Reset
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={onAdd}
            disabled={atCapacity}
            title="Add Goal"
          >
            <IconPlus className="size-3.5" />
            Add Goal
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-10 text-center">
          <IconTarget className="mb-2.5 size-7 text-[var(--app-text-subtle)]" />
          <p className="mb-3 text-[13px] text-[var(--app-text-muted)]">No withdrawal goals added.</p>
          <button type="button" className={BTN_PRIMARY} onClick={onAdd}>
            <IconPlus className="size-3.5" />
            Add First Goal
          </button>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" aria-hidden />
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
                  <IconChevron className="size-5 -rotate-90" />
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
                      {isDone && !hasErr ? <IconCheck className="size-5" /> : <Icon className="size-5" />}
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
              className="relative z-20 mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-md sm:p-4"
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
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={() => onDuplicate(openGoal.id)}
                    disabled={atCapacity}
                  >
                    <IconCopy className="size-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className={BTN_DANGER}
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
                    <IconTrash className="size-3.5" />
                    Remove
                  </button>
                  <button
                    type="button"
                    className={BTN_PRIMARY}
                    onClick={() => markDoneAndAdvance(openGoal.id)}
                  >
                    <IconCheck className="size-3.5" />
                    Done · Next
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <WealthFieldShell label="Category">
                  <select
                    value={openGoal.category}
                    onChange={(e) => {
                      const category = e.target.value as GoalCategory;
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
                    className={wealthInputClass}
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </WealthFieldShell>
                <WealthTextField
                  label="Goal name"
                  value={openGoal.name}
                  onChange={(name) => onPatch(openGoal.id, { name })}
                  placeholder="Goal name"
                />
                <WealthMoneyField
                  label="Amount"
                  value={openGoal.amount}
                  onChange={(amount) => onPatch(openGoal.id, { amount })}
                  error={openErr?.amount}
                />
                <WealthYearField
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
