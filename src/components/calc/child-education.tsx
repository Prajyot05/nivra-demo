"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatINRCurrency,
  parseDigits,
  StackedBarChart,
  StatusNote,
  ageError,
  emailError,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import {
  ChildEducationDossier,
  CHILD_EDUCATION_REPORT_ID,
} from "@/components/reports/child-education-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  ChartFrame,
  IconAlert,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
  IconChevron,
  IconDonut,
  IconFlag,
  IconGrad,
  IconPerson,
  IconRefresh,
  IconSip,
  IconTarget,
  IconTimeline,
  moneyCell,
  WEALTH_CONTENT_CLASS,
  WealthCompareBars,
  WealthDataTable,
  WealthDisclaimer,
  WealthFieldShell,
  wealthChart,
  wealthInputClass,
  WealthHero,
  WealthIconMark,
  WealthMetricCard,
  WealthMoneyField,
  WealthProfileGrid,
  WealthSection,
  WealthSegmented,
  WEALTH_MONEY_PRESETS_DEFAULT,
} from "@/components/wealth";

const FEE_MIN = 1_000;
const FEE_MAX = 5_00_00_000;
const FEE_PRESETS = [
  { label: "₹25k", value: 25_000 },
  { label: "₹50k", value: 50_000 },
  { label: "₹1L", value: 1_00_000 },
  { label: "₹5L", value: 5_00_000 },
  { label: "₹25L", value: 25_00_000 },
  { label: "₹50L", value: 50_00_000 },
];
const DEFAULT_COSTS = [
  { age: 3, classLabel: "Nursery", cost: 20_000 },
  { age: 4, classLabel: "LKG", cost: 21_600 },
  { age: 5, classLabel: "UKG", cost: 24_000 },
  { age: 6, classLabel: "Class 1", cost: 25_000 },
  { age: 7, classLabel: "Class 2", cost: 26_200 },
  { age: 8, classLabel: "Class 3", cost: 27_400 },
  { age: 9, classLabel: "Class 4", cost: 28_700 },
  { age: 10, classLabel: "Class 5", cost: 30_000 },
  { age: 11, classLabel: "Class 6", cost: 31_400 },
  { age: 12, classLabel: "Class 7", cost: 32_900 },
  { age: 13, classLabel: "Class 8", cost: 34_400 },
  { age: 14, classLabel: "Class 9", cost: 36_000 },
  { age: 15, classLabel: "Class 10", cost: 37_700 },
  { age: 16, classLabel: "Class 11", cost: 39_400 },
  { age: 17, classLabel: "Class 12", cost: 41_200 },
  { age: 18, classLabel: "College - 1", cost: 2_500_000 },
  { age: 19, classLabel: "College - 2", cost: 2_500_000 },
  { age: 20, classLabel: "College - 3", cost: 2_500_000 },
  { age: 21, classLabel: "College - 4", cost: 7_000_000 },
  { age: 22, classLabel: "College - 5", cost: 0 },
  { age: 23, classLabel: "College - 6", cost: 0 },
  { age: 24, classLabel: "College - 7", cost: 0 },
  { age: 25, classLabel: "College - 8", cost: 0 },
];

type CostRow = { age: number; classLabel: string; cost: number };

type EducationResult = {
  childAge: number;
  lastFeeAge: number;
  sipYears: number;
  totalCost: number;
  totalTax: number;
  totalWithdrawal: number;
  lumpsum: {
    lumpsum: number;
    invested: number;
    tax: number;
    peakCorpus: number;
    remaining: number;
  };
  sip: {
    monthlySip: number;
    invested: number;
    tax: number;
    peakCorpus: number;
    remaining: number;
  };
  compare: Array<{ category: string; lumpsum: number; sip: number }>;
  costChart: Array<{ age: number; classLabel: string; cost: number; tax: number }>;
  schedule: Array<{
    age: number;
    classLabel: string;
    cost: number;
    tax: number;
    withdrawal: number;
    sipCorpus: number;
    sipBalance: number;
    lumpsumBalance: number;
  }>;
};

type CostEntry = { row: CostRow; index: number };
type AnalyticsTab = "compare" | "costs" | "summary";

function isCollegeLabel(label: string) {
  return /college/i.test(label);
}

function childNameErrorMsg(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Child name is required.";
  if (trimmed.length < 2) return "Enter at least 2 characters.";
  if (trimmed.length > 80) return "Child name is too long (max 80 characters).";
  return undefined;
}

function childAgeErrorMsg(childAge: number, clientAge: number): string | undefined {
  if (!Number.isFinite(childAge)) return "Child age must be a valid number.";
  if (childAge < 0) return "Child age cannot be negative.";
  if (childAge > 40) return "Child age cannot exceed 40 years.";
  if (clientAge >= 18 && childAge > clientAge) {
    return "Child age cannot exceed client age.";
  }
  return undefined;
}

export function ChildEducationPlanner() {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(35);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [childName, setChildName] = useState("Jitender Agarwal");
  const [childAge, setChildAge] = useState(5);
  const [returnPct, setReturnPct] = useState(12);
  const [taxPct, setTaxPct] = useState(12.5);
  const [costs, setCosts] = useState(() => DEFAULT_COSTS.map((row) => ({ ...row })));
  const [timelineKey, setTimelineKey] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("compare");

  const assumptionsRef = useRef<HTMLDivElement>(null);

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const childNameErr = childNameErrorMsg(childName);
  const childAgeErr = childAgeErrorMsg(childAge, age);
  const returnError = rateError(returnPct, "Return");
  const taxError = rateError(taxPct, "Tax on gains");

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    childNameErr,
    childAgeErr,
    returnError,
    taxError,
  ].filter((msg): msg is string => Boolean(msg));

  const canCalculate = fieldErrors.length === 0;

  const input = useMemo(
    () => ({
      clientName: name,
      age,
      childName,
      childAge,
      returnPct,
      taxPct,
      costs,
    }),
    [name, age, childName, childAge, returnPct, taxPct, costs],
  );

  const { result, error, loading } = useCalculate<EducationResult>(
    "education",
    input,
    canCalculate,
  );

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(35);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setChildName("Jitender Agarwal");
    setChildAge(5);
    setReturnPct(12);
    setTaxPct(12.5);
    setCosts(DEFAULT_COSTS.map((row) => ({ ...row })));
    setTimelineKey((k) => k + 1);
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      const safe = (name || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(
        CHILD_EDUCATION_REPORT_ID,
        `child-education-${safe || "report"}`,
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const patchCost = (index: number, cost: number) => {
    setCosts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, cost: Math.max(0, cost) } : row)),
    );
  };

  const resetCosts = () => {
    setCosts(DEFAULT_COSTS.map((row) => ({ ...row })));
    setTimelineKey((k) => k + 1);
  };

  const fundedYears = costs.filter((row) => row.age > childAge && row.cost > 0).length;
  const schoolFunded = costs.filter(
    (row) => !isCollegeLabel(row.classLabel) && row.age > childAge && row.cost > 0,
  ).length;
  const collegeFunded = costs.filter(
    (row) => isCollegeLabel(row.classLabel) && row.age > childAge && row.cost > 0,
  ).length;

  return (
    <>
      <CalculatorPage
        title="Nivra Wealth"
        description="Child education funding via lumpsum or monthly SIP"
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
            goalLabel={childName.trim() || "Child education"}
            tenure={result?.sipYears ?? Math.max(0, (result?.lastFeeAge ?? childAge) - childAge)}
            strategy="Education corpus planning"
            targetCorpus={canCalculate && result ? result.totalWithdrawal : 0}
            monthlySip={canCalculate && result ? result.sip.monthlySip : 0}
            realReturnPct={returnPct}
            onEdit={scrollToAssumptions}
          />
        }
        form={
          <div ref={assumptionsRef}>
            <WealthSection
              id="assumptions"
              badge="01 · Profile"
              title="Investor Profile and Fee Schedule"
              subtitle="Client identity, child details, return assumptions, and year-wise education costs"
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
                  <WealthFieldShell label="Client name" error={clientNameError}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={wealthInputClass}
                      autoComplete="name"
                    />
                  </WealthFieldShell>
                  <WealthFieldShell
                    label="Age"
                    suffix="Years"
                    error={clientAgeError}
                  >
                    <input
                      inputMode="numeric"
                      value={String(age)}
                      onChange={(e) => setAge(Math.round(parseDigits(e.target.value)))}
                      className={`${wealthInputClass} !pr-14`}
                    />
                  </WealthFieldShell>
                  <WealthFieldShell label="Email" error={clientEmailError}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@email.com"
                      className={wealthInputClass}
                      autoComplete="email"
                    />
                  </WealthFieldShell>
                  <WealthFieldShell label="Phone" error={clientPhoneError}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={wealthInputClass}
                      autoComplete="tel"
                    />
                  </WealthFieldShell>
                  <WealthFieldShell label="Child name" error={childNameErr}>
                    <input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className={wealthInputClass}
                    />
                  </WealthFieldShell>
                  <WealthFieldShell
                    label="Child age"
                    suffix="Years"
                    error={childAgeErr}
                  >
                    <input
                      inputMode="numeric"
                      value={String(childAge)}
                      onChange={(e) => {
                        const next = Math.round(parseDigits(e.target.value));
                        setChildAge(Math.min(40, Math.max(0, next)));
                      }}
                      className={`${wealthInputClass} !pr-14`}
                    />
                  </WealthFieldShell>
                  <WealthFieldShell label="Expected return" suffix="%" error={returnError}>
                    <input
                      inputMode="decimal"
                      value={String(returnPct)}
                      onChange={(e) => setReturnPct(Math.max(0, parseDigits(e.target.value)))}
                      className={`${wealthInputClass} !pr-8`}
                    />
                  </WealthFieldShell>
                  <WealthFieldShell label="Tax on gains" suffix="%" error={taxError}>
                    <input
                      inputMode="decimal"
                      value={String(taxPct)}
                      onChange={(e) => setTaxPct(Math.max(0, parseDigits(e.target.value)))}
                      className={`${wealthInputClass} !pr-8`}
                    />
                  </WealthFieldShell>
                  <div className="min-w-0">
                    <div className="mb-1.5 text-sm text-slate-600">Phase mix</div>
                    <div className="flex h-[42px] items-center justify-between rounded-lg bg-slate-50 px-3 ring-1 ring-slate-200">
                      <span className="text-xs text-slate-500">
                        {schoolFunded} school · {collegeFunded} college
                      </span>
                      <span className="text-sm font-medium tabular-nums text-emerald-700">
                        {taxPct}% tax drag
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                    <EducationFeeTimeline
                      key={timelineKey}
                      costs={costs}
                      childAge={childAge}
                      childName={childName}
                      fundedYears={fundedYears}
                      schoolFunded={schoolFunded}
                      collegeFunded={collegeFunded}
                      onPatchCost={patchCost}
                      onReset={resetCosts}
                    />
                  </div>
                </WealthProfileGrid>
              </div>
            </WealthSection>
          </div>
        }
        results={
          <>
            {error ? <StatusNote tone="error">{error}</StatusNote> : null}
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
            {loading && !result && canCalculate ? (
              <StatusNote tone="pending">Calculating…</StatusNote>
            ) : null}
            {result ? (
              <EducationResults
                result={result}
                childName={childName}
                childAge={childAge}
                taxPct={taxPct}
                openMilestones={openMilestones}
                onToggleMilestones={() => setOpenMilestones((v) => !v)}
                openAnalytics={openAnalytics}
                onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
                openSchedule={openSchedule}
                onToggleSchedule={() => setOpenSchedule((v) => !v)}
                analyticsTab={analyticsTab}
                onAnalyticsTabChange={setAnalyticsTab}
              />
            ) : null}
          </>
        }
        footer={
          <WealthDisclaimer
            notes={[
              "Fee inflation compounds the future education cost faster than headline tuition suggests.",
              "Tax is applied on gains only when corpus is withdrawn for fees.",
              "Projections are illustrative. Actual market returns and fee inflation can differ.",
            ]}
          >
            Figures are for illustration only. Education funding depends on assumed returns, tax on
            gains at withdrawal, and the fee schedule entered. Markets carry risk; past performance
            does not guarantee future results.
          </WealthDisclaimer>
        }
      />

      {result ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-[94rem] gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 rounded-[14px] bg-emerald-700 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {isDownloading ? "Exporting…" : "Export PDF"}
            </button>
            <button
              type="button"
              onClick={scrollToAssumptions}
              className="rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Edit
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <ChildEducationDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            childName,
            childAge,
            returnPct,
            taxPct,
            lastFeeAge: result.lastFeeAge,
            sipYears: result.sipYears,
            totalCost: result.totalCost,
            totalTax: result.totalTax,
            totalWithdrawal: result.totalWithdrawal,
            lumpsum: result.lumpsum,
            sip: result.sip,
            compare: result.compare,
            schedule: result.schedule,
          }}
        />
      ) : null}
    </>
  );
}

function EducationFeeTimeline({
  costs,
  childAge,
  childName,
  fundedYears,
  schoolFunded,
  collegeFunded,
  onPatchCost,
  onReset,
}: {
  costs: CostRow[];
  childAge: number;
  childName: string;
  fundedYears: number;
  schoolFunded: number;
  collegeFunded: number;
  onPatchCost: (index: number, cost: number) => void;
  onReset: () => void;
}) {
  const indexed = useMemo(
    () => costs.map((row, index) => ({ row, index })),
    [costs],
  );
  const schoolEntries = useMemo(
    () => indexed.filter(({ row }) => !isCollegeLabel(row.classLabel)),
    [indexed],
  );
  const collegeEntries = useMemo(
    () => indexed.filter(({ row }) => isCollegeLabel(row.classLabel)),
    [indexed],
  );

  const defaultOpen =
    schoolEntries.find(({ row }) => row.age > childAge && row.cost > 0)?.index ??
    collegeEntries.find(({ row }) => row.age > childAge && row.cost > 0)?.index ??
    schoolEntries.find(({ row }) => row.age > childAge)?.index ??
    schoolEntries[0]?.index ??
    null;

  const [activeIndex, setActiveIndex] = useState<number | null>(defaultOpen);
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (indexed.length === 0) {
      setActiveIndex(null);
      setOpenIndex(null);
      return;
    }
    if (activeIndex == null || !indexed.some(({ index }) => index === activeIndex)) {
      setActiveIndex(defaultOpen);
    }
  }, [indexed, activeIndex, defaultOpen]);

  useEffect(() => {
    if (openIndex == null) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-fee-dot]")) return;
      if (panelRef.current && !panelRef.current.contains(target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openIndex]);

  const togglePanel = (index: number) => {
    setActiveIndex(index);
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const openRow = openIndex != null ? costs[openIndex] : null;
  const openIsCollege = openRow ? isCollegeLabel(openRow.classLabel) : false;
  const openIsPast = openRow ? openRow.age <= childAge : false;

  const schoolLastAge = schoolEntries.reduce(
    (last, { row }) => (row.cost > 0 ? Math.max(last, row.age) : last),
    childAge,
  );
  const collegeLastAge = collegeEntries.reduce(
    (last, { row }) => (row.cost > 0 ? Math.max(last, row.age) : last),
    schoolLastAge,
  );
  const schoolTotal = schoolEntries.reduce(
    (sum, { row }) => sum + (row.age > childAge ? row.cost : 0),
    0,
  );
  const collegeTotal = collegeEntries.reduce(
    (sum, { row }) => sum + (row.age > childAge ? row.cost : 0),
    0,
  );

  const advanceOrder = [...schoolEntries, ...collegeEntries];

  const markDoneAndAdvance = (index: number) => {
    const pos = advanceOrder.findIndex((item) => item.index === index);
    const next =
      advanceOrder.slice(pos + 1).find(({ row }) => row.age > childAge) ??
      advanceOrder[pos + 1];
    setOpenIndex(null);
    if (next) {
      setActiveIndex(next.index);
      setOpenIndex(next.index);
    } else {
      setActiveIndex(index);
    }
  };

  const editPanel =
    openRow && openIndex != null ? (
      <div
        ref={panelRef}
        className="relative z-20 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-3.5"
      >
        <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5">
            <WealthIconMark tone={openIsCollege ? "emerald" : "slate"}>
              {openIsCollege ? <IconGrad /> : <IconBook />}
            </WealthIconMark>
            <div>
              <div className="text-sm font-medium text-slate-900">{openRow.classLabel}</div>
              <div className="text-[11px] text-slate-500">
                Age {openRow.age}
                {openIsPast
                  ? " · already passed (not withdrawn in this plan)"
                  : openRow.age > childAge
                    ? ` · ${openRow.age - childAge} year${openRow.age - childAge === 1 ? "" : "s"} out`
                    : ""}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              onClick={() => setOpenIndex(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800"
              onClick={() => markDoneAndAdvance(openIndex)}
            >
              <IconCheck className="h-3.5 w-3.5" />
              Done · Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <WealthMoneyField
            label="Education cost"
            value={openRow.cost}
            onChange={(v) => onPatchCost(openIndex, Math.max(0, v))}
            max={FEE_MAX}
            hint={
              openIsPast
                ? "Past years do not create withdrawals."
                : openIsCollege
                  ? "College fee for this year (₹0 keeps the slot)."
                  : "School fee for this year."
            }
            slider={{
              min: FEE_MIN,
              max: FEE_MAX,
              step: 10_000,
              scale: "log",
              presets: FEE_PRESETS,
            }}
          />
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Phase
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {openIsCollege ? "Higher education" : "School education"}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {formatINRCurrency(openRow.cost)}
              {!openIsPast && openRow.cost > 0
                ? " will be grossed up for tax on gains at withdrawal"
                : ""}
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {fundedYears} funded · {schoolFunded} school · {collegeFunded} college
          </span>
          <span className="text-xs text-slate-400">Click a year to edit fees.</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          onClick={onReset}
          title="Reset fee grid"
        >
          <IconRefresh className="h-3.5 w-3.5" />
          Reset fees
        </button>
      </div>

      <FeePhaseRail
        title="School education"
        hint="Nursery to Class 12"
        accent="school"
        entries={schoolEntries}
        childAge={childAge}
        startLabel="Today"
        startAge={childAge}
        startSub={childName.trim() || "Child"}
        endLabel="Class 12"
        endAge={schoolLastAge}
        meta={`${schoolFunded} funded · ${formatINRCurrency(schoolTotal)}`}
        activeIndex={activeIndex}
        openIndex={openIndex}
        onToggle={togglePanel}
        editPanel={!openIsCollege ? editPanel : null}
      />

      <FeePhaseRail
        title="Higher education"
        hint="College 1 to College 8"
        accent="college"
        entries={collegeEntries}
        childAge={childAge}
        startLabel="College"
        startAge={collegeEntries[0]?.row.age ?? schoolLastAge + 1}
        startSub="After school"
        endLabel="Horizon"
        endAge={collegeLastAge}
        meta={`${collegeFunded} funded · ${formatINRCurrency(collegeTotal)}`}
        activeIndex={activeIndex}
        openIndex={openIndex}
        onToggle={togglePanel}
        editPanel={openIsCollege ? editPanel : null}
      />

      {!editPanel ? (
        <p className="text-xs text-slate-400">
          Dashed dots are ₹0 slots. Past school years stay on the rail but do not create
          withdrawals.
        </p>
      ) : null}
    </div>
  );
}

function FeePhaseRail({
  title,
  hint,
  accent,
  entries,
  childAge,
  startLabel,
  startAge,
  startSub,
  endLabel,
  endAge,
  meta,
  activeIndex,
  openIndex,
  onToggle,
  editPanel,
}: {
  title: string;
  hint: string;
  accent: "school" | "college";
  entries: CostEntry[];
  childAge: number;
  startLabel: string;
  startAge: number;
  startSub: string;
  endLabel: string;
  endAge: number;
  meta: string;
  activeIndex: number | null;
  openIndex: number | null;
  onToggle: (index: number) => void;
  editPanel: React.ReactNode;
}) {
  const college = accent === "college";
  const PhaseIcon = college ? IconGrad : IconBook;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <WealthIconMark tone={college ? "emerald" : "slate"}>
            <PhaseIcon className="h-3.5 w-3.5" />
          </WealthIconMark>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">{title}</div>
            <div className="text-[11px] text-slate-500">{hint}</div>
          </div>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-500">
          {meta}
        </span>
      </div>

      <div className="custom-scrollbar w-full overflow-x-auto pb-1.5 pt-4">
        <div
          className="relative flex w-full items-start justify-between px-1 sm:px-2"
          style={{
            minWidth: `max(100%, ${4.25 + entries.length * 5 + 4.25}rem)`,
          }}
        >
          <div
            className="pointer-events-none absolute left-[2.125rem] right-[2.125rem] top-[1.125rem] h-0.5 bg-slate-200"
            aria-hidden
          />

          <div className="relative z-[1] flex w-[4.25rem] shrink-0 flex-col items-center">
            <div
              className={`flex size-9 items-center justify-center rounded-md border ${
                college
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-emerald-600 bg-emerald-700 text-white"
              }`}
            >
              {college ? (
                <IconGrad className="size-4" />
              ) : (
                <IconChevron className="size-4 -rotate-90" />
              )}
            </div>
            <div className="mt-1.5 text-center">
              <div className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                {startLabel}
              </div>
              <div className="text-[11px] font-medium text-slate-900">Age {startAge}</div>
              <div className="max-w-[4.25rem] truncate text-[9px] text-slate-400">{startSub}</div>
            </div>
          </div>

          {entries.map(({ row, index }) => {
            const Icon = college ? IconGrad : IconBook;
            const isPast = row.age <= childAge;
            const isFunded = row.cost > 0;
            const isActive = activeIndex === index;
            const isOpen = openIndex === index;
            const yearsAway = row.age - childAge;

            return (
              <div
                key={`${row.age}-${row.classLabel}`}
                className="relative z-[1] flex w-[4.75rem] shrink-0 flex-col items-center"
              >
                <button
                  type="button"
                  data-fee-dot
                  className={`relative flex size-9 items-center justify-center rounded-md border transition ${
                    isOpen || isActive
                      ? college
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-500/15"
                        : "border-slate-500 bg-slate-100 text-slate-800 ring-4 ring-slate-500/10"
                      : isPast
                        ? "border-slate-200 bg-slate-50 text-slate-300"
                        : isFunded
                          ? college
                            ? "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400"
                            : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"
                          : "border-dashed border-slate-300 bg-white text-slate-300 hover:border-emerald-300"
                  }`}
                  onClick={() => onToggle(index)}
                  title={`${row.classLabel} · Age ${row.age} · ${formatINRCurrency(row.cost)}`}
                  aria-expanded={isOpen}
                >
                  <Icon className="size-4" />
                  {isActive ? (
                    <span
                      className={`absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                        college ? "bg-emerald-600" : "bg-slate-600"
                      }`}
                    />
                  ) : null}
                </button>
                <div className="mt-1.5 max-w-[4.75rem] text-center">
                  <div className="truncate text-[11px] font-medium text-slate-900">
                    {row.classLabel}
                  </div>
                  <div className="text-[9px] text-slate-500">Age {row.age}</div>
                  <div className="truncate text-[9px] tabular-nums text-slate-400">
                    {isPast
                      ? "past"
                      : isFunded
                        ? `${yearsAway > 0 ? `${yearsAway}y · ` : ""}${formatINRCurrency(row.cost)}`
                        : "₹0"}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="relative z-[1] flex w-[4.25rem] shrink-0 flex-col items-center">
            <div className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
              <IconFlag className="size-4" />
            </div>
            <div className="mt-1.5 text-center">
              <div className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                {endLabel}
              </div>
              <div className="text-[11px] font-medium text-slate-900">Age {endAge}</div>
            </div>
          </div>
        </div>
      </div>

      {editPanel}
    </div>
  );
}

function EducationResults({
  result,
  childName,
  childAge,
  taxPct,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
  analyticsTab,
  onAnalyticsTabChange,
}: {
  result: EducationResult;
  childName: string;
  childAge: number;
  taxPct: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
  analyticsTab: AnalyticsTab;
  onAnalyticsTabChange: (tab: AnalyticsTab) => void;
}) {
  const schoolChart = result.costChart.filter((row) => !isCollegeLabel(row.classLabel));
  const collegeChart = result.costChart.filter((row) => isCollegeLabel(row.classLabel));

  const firstWithdrawal = result.schedule.find(
    (row) => row.age > childAge && row.withdrawal > 0,
  );
  const firstCollege = result.schedule.find(
    (row) => row.age > childAge && isCollegeLabel(row.classLabel) && row.cost > 0,
  );
  const shortfallRows = result.schedule.filter(
    (row) => row.age > childAge && row.sipBalance < -0.5,
  );
  const hasShortfall = shortfallRows.length > 0 || result.sip.remaining < -0.5;

  const costSeries = [
    { key: "cost", label: "Edu. cost", color: "var(--app-chart-invested)" },
    { key: "tax", label: "Cap. gains", color: "var(--app-chart-tax)" },
  ] as const;

  return (
    <div className="space-y-5">
      <WealthSection
        badge="02 · Milestones"
        title="Education Funding Milestones"
        subtitle="Lumpsum today versus monthly SIP required to fund the fee schedule"
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Horizon: Age {result.lastFeeAge} · {result.sipYears} SIP years
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <WealthMetricCard
            title="Lumpsum today"
            value={result.lumpsum.lumpsum}
            description="One-time corpus required at the start"
            badge="One-time"
            tone="neutral"
            trend={`Peak ${formatINRCurrency(result.lumpsum.peakCorpus)}`}
            footer={
              <>
                Invested path ·{" "}
                <span className="font-semibold tabular-nums text-slate-700">
                  {formatINRCurrency(result.lumpsum.invested)}
                </span>
              </>
            }
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Monthly SIP"
            value={result.sip.monthlySip}
            description={`${result.sipYears} years of SIP funding`}
            badge="SIP"
            tone="positive"
            footer={
              <>
                SIP invested ·{" "}
                <span className="font-semibold tabular-nums text-emerald-700">
                  {formatINRCurrency(result.sip.invested)}
                </span>
              </>
            }
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconSip className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <QuickStat
            icon={<IconBook className="h-3.5 w-3.5" />}
            label="School start"
            value={`Age ${childAge}`}
            sub={childName.trim() || "Current age"}
          />
          <QuickStat
            icon={<IconGrad className="h-3.5 w-3.5" />}
            label="College start"
            value={firstCollege ? `Age ${firstCollege.age}` : "None"}
            sub={firstCollege?.classLabel ?? "No college fees"}
          />
          <QuickStat
            icon={<IconCalendar className="h-3.5 w-3.5" />}
            label="Horizon"
            value={`Age ${result.lastFeeAge}`}
            sub={`${result.sipYears} SIP years`}
          />
          <QuickStat
            icon={<IconFlag className="h-3.5 w-3.5" />}
            label="Total withdrawal"
            value={formatINRCurrency(result.totalWithdrawal)}
            sub={`Tax ${taxPct}% on fees`}
          />
        </div>

        {hasShortfall ? (
          <div className="mt-4">
            <StatusNote tone="error">
              <span className="inline-flex items-start gap-2">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Funding shortfall detected
                  {shortfallRows[0]
                    ? ` from ${shortfallRows[0].classLabel} (age ${shortfallRows[0].age})`
                    : ""}
                  . SIP balance turns negative before fees end. Raise monthly SIP or add a lumpsum
                  top-up.
                </span>
              </span>
            </StatusNote>
          </div>
        ) : null}
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Education Analytics"
        subtitle="Lumpsum vs SIP compare, fee composition, and plan summary"
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
          layoutId="education-analytics-tab"
          value={analyticsTab}
          onChange={onAnalyticsTabChange}
          options={[
            {
              id: "compare",
              label: "Compare",
              icon: <IconChart className="h-3.5 w-3.5" />,
            },
            {
              id: "costs",
              label: "Fee mix",
              icon: <IconDonut className="h-3.5 w-3.5" />,
            },
            {
              id: "summary",
              label: "Summary",
              icon: <IconTimeline className="h-3.5 w-3.5" />,
            },
          ]}
        />

        <div className="mt-4">
          {analyticsTab === "compare" ? (
            <WealthCompareBars
              data={result.compare}
              series={[
                { key: "lumpsum", label: "Lumpsum", color: wealthChart.invested },
                { key: "sip", label: "SIP", color: wealthChart.stepUp },
              ]}
            />
          ) : null}

          {analyticsTab === "costs" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {schoolChart.length > 0 ? (
                <ChartFrame height="h-[260px]">
                  <StackedBarChart
                    title="School costs"
                    orientation="horizontal"
                    totalLabel="Total withdrawal"
                    className="h-full min-h-0"
                    data={schoolChart.map((row) => ({
                      category: row.classLabel,
                      cost: row.cost,
                      tax: row.tax,
                    }))}
                    series={[...costSeries]}
                  />
                </ChartFrame>
              ) : null}
              {collegeChart.length > 0 ? (
                <ChartFrame height="h-[220px]">
                  <StackedBarChart
                    title="College costs"
                    orientation="horizontal"
                    totalLabel="Total withdrawal"
                    className="h-full min-h-0"
                    data={collegeChart.map((row) => ({
                      category: row.classLabel,
                      cost: row.cost,
                      tax: row.tax,
                    }))}
                    series={[...costSeries]}
                  />
                </ChartFrame>
              ) : null}
            </div>
          ) : null}

          {analyticsTab === "summary" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryRow label="Lumpsum required today" value={result.lumpsum.lumpsum} accent />
              <SummaryRow
                label="Monthly SIP"
                value={result.sip.monthlySip}
                hint={`${result.sipYears} years`}
              />
              <SummaryRow label="SIP invested" value={result.sip.invested} />
              <SummaryRow label="Peak corpus (SIP)" value={result.sip.peakCorpus} />
              <SummaryRow label="Total withdrawal" value={result.totalWithdrawal} />
              <SummaryRow label="Total tax drag" value={result.totalTax} />
            </div>
          ) : null}
        </div>
      </WealthSection>

      <WealthSection
        badge="04 · Schedule"
        title="Education Withdrawal Schedule"
        subtitle="Year-wise fees, tax, SIP corpus, and lumpsum balance"
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
          getRowKey={(row) => `${row.age}-${row.classLabel}`}
          filterPlaceholder="Filter by age or class…"
          summary={[
            { label: "SIP monthly", value: formatINRCurrency(result.sip.monthlySip) },
            {
              label: "Withdrawals",
              value: formatINRCurrency(result.totalWithdrawal),
              tone: "std",
            },
            {
              label: "Tax drag",
              value: formatINRCurrency(result.totalTax),
              tone: "std",
            },
            {
              label: "SIP invested",
              value: formatINRCurrency(result.sip.invested),
              tone: "step",
            },
          ]}
          columns={[
            {
              key: "age",
              header: "Age",
              sticky: true,
              searchValue: (row) => String(row.age),
              render: (row) => row.age,
            },
            {
              key: "classLabel",
              header: "Class",
              searchValue: (row) => row.classLabel,
              render: (row) => (
                <span
                  className={
                    firstWithdrawal?.age === row.age ||
                    firstCollege?.age === row.age ||
                    row.age === result.lastFeeAge
                      ? "font-medium text-emerald-800"
                      : undefined
                  }
                >
                  {row.classLabel}
                </span>
              ),
            },
            {
              key: "cost",
              header: "Edu. cost",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.cost),
            },
            {
              key: "tax",
              header: "Cap. gains",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.tax),
            },
            {
              key: "withdrawal",
              header: "Withdrawal",
              align: "right",
              tone: "amber",
              render: (row) => moneyCell(row.withdrawal),
            },
            {
              key: "sipCorpus",
              header: "SIP corpus",
              align: "right",
              tone: "emerald",
              render: (row) => moneyCell(row.sipCorpus),
            },
            {
              key: "sipBalance",
              header: "SIP balance",
              align: "right",
              tone: "emerald",
              render: (row) => {
                const n = row.sipBalance;
                if (row.age > childAge && n < -0.5) {
                  return (
                    <span className="font-semibold text-rose-700">{formatINRCurrency(n)}</span>
                  );
                }
                return moneyCell(n);
              },
            },
            {
              key: "lumpsumBalance",
              header: "Lumpsum balance",
              align: "right",
              render: (row) => moneyCell(row.lumpsumBalance),
            },
          ]}
        />
      </WealthSection>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-2">
        <WealthIconMark className="h-7 w-7">{icon}</WealthIconMark>
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
          {label}
        </div>
      </div>
      <div className="mt-2 break-words text-[14px] font-medium leading-snug text-slate-900 sm:text-[15px]">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-slate-400">{sub}</div> : null}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1.5 text-[20px] font-medium tabular-nums tracking-tight ${
          accent ? "text-emerald-800" : "text-slate-900"
        }`}
      >
        {formatINRCurrency(value)}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}
