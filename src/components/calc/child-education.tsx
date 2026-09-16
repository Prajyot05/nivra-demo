"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Flag,
  GraduationCap,
  RotateCcw,
} from "lucide-react";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  Card,
  ClientHeader,
  CompareChart,
  Field,
  formatINRCurrency,
  FormGrid,
  META_TEXT,
  MoneyInput,
  PercentInput,
  ResultCard,
  ResultsSplit,
  ScheduleTable,
  SectionTitle,
  STACK_TIGHT,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  StackedBarChart,
  TextInput,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import {
  ChildEducationDossier,
  CHILD_EDUCATION_REPORT_ID,
} from "@/components/reports/child-education-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { generatePdfFromElement } from "@/lib/pdf-generator";

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

function isCollegeLabel(label: string) {
  return /college/i.test(label);
}

function interestError(value: number, label: string): string | undefined {
  if (value > 100) return `${label} cannot exceed 100%.`;
  if (value < 0) return `${label} cannot be negative.`;
  return undefined;
}

function FormBand({ title, children }: { title: string; children: React.ReactNode }) {
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

export function ChildEducationPlanner() {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(35);
  const [childName, setChildName] = useState("Jitender Agarwal");
  const [childAge, setChildAge] = useState(5);
  const [returnPct, setReturnPct] = useState(12);
  const [taxPct, setTaxPct] = useState(12.5);
  const [costs, setCosts] = useState(() => DEFAULT_COSTS.map((row) => ({ ...row })));
  const [timelineKey, setTimelineKey] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const nameError = !name.trim() ? "Client name is required." : undefined;
  const childNameError = !childName.trim() ? "Child name is required." : undefined;
  const ageError = age < 1 ? "Client age must be a positive integer." : undefined;
  const childAgeError =
    childAge < 0
      ? "Child age cannot be negative."
      : age >= 1 && childAge > age
        ? "Child age cannot exceed client age."
        : undefined;
  const returnError = interestError(returnPct, "Return");
  const taxError = interestError(taxPct, "Tax on gains");

  const canCalculate =
    !nameError &&
    !childNameError &&
    !ageError &&
    !childAgeError &&
    !returnError &&
    !taxError;

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
        title="Child Education Planner"
        description="Fund future school and college fees with a lumpsum today or a monthly SIP."
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={isDownloading}
          />
        }
        form={
          <div className={STACK_TIGHT}>
            <FormBand title="Family & assumptions">
              <FormGrid>
                <ClientHeader
                  name={name}
                  age={age}
                  onNameChange={setName}
                  onAgeChange={setAge}
                  nameError={nameError}
                  ageError={ageError}
                />
                <div className="col-span-2 min-w-0">
                  <Field label="Child name" error={childNameError}>
                    <TextInput
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />
                  </Field>
                </div>
                <YearInput
                  label="Child age"
                  value={childAge}
                  min={0}
                  max={40}
                  onChange={setChildAge}
                  error={childAgeError}
                />
                <PercentInput
                  label="Return (%)"
                  value={returnPct}
                  onChange={setReturnPct}
                  error={returnError}
                />
                <PercentInput
                  label="Tax on gains (%)"
                  value={taxPct}
                  onChange={setTaxPct}
                  error={taxError}
                  wrapLabel
                />
              </FormGrid>
            </FormBand>

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
        }
        results={
          <Stack>
            {!canCalculate ? (
              <StatusNote tone="warn">Fix the highlighted inputs to calculate.</StatusNote>
            ) : null}
            {error ? <StatusNote tone="error">{error}</StatusNote> : null}
            {loading && !result ? (
              <StatusNote tone="pending">Calculating…</StatusNote>
            ) : null}
            {result ? (
              <EducationResults
                result={result}
                childName={childName}
                childAge={childAge}
                taxPct={taxPct}
              />
            ) : null}
          </Stack>
        }
      />
      {result ? (
        <ChildEducationDossier
          data={{
            clientName: name,
            age,
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
        className="relative z-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-md sm:p-3.5"
      >
        <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--app-border)] pb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-8 items-center justify-center rounded-lg ${
                openIsCollege
                  ? "bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                  : "bg-[var(--app-std-bg)] text-[var(--app-std-text)]"
              }`}
            >
              {openIsCollege ? (
                <GraduationCap className="size-4" />
              ) : (
                <BookOpen className="size-4" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--app-text)]">
                {openRow.classLabel}
              </div>
              <div className="text-[11px] text-[var(--app-text-muted)]">
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
              className={BUTTON_SECONDARY}
              onClick={() => setOpenIndex(null)}
            >
              Close
            </button>
            <button
              type="button"
              className={BUTTON_PRIMARY}
              onClick={() => markDoneAndAdvance(openIndex)}
            >
              <Check className="size-3.5" />
              Done · Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MoneyInput
            label="Education cost"
            value={openRow.cost}
            onChange={(cost) => onPatchCost(openIndex, cost)}
            align="right"
            hint={
              openIsPast
                ? "Past years do not create withdrawals."
                : openIsCollege
                  ? "College fee for this year (₹0 keeps the slot)."
                  : "School fee for this year."
            }
          />
          <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Phase
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--app-text)]">
              {openIsCollege ? "Higher education" : "School education"}
            </div>
            <div className={`mt-0.5 ${META_TEXT}`}>
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
    <FormBand title="Education fee timeline">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-text-muted)]">
              {fundedYears} funded · {schoolFunded} school · {collegeFunded} college
            </span>
            <span className={META_TEXT}>Click a year to edit fees.</span>
          </div>
          <button
            type="button"
            className={BUTTON_SECONDARY}
            onClick={onReset}
            title="Reset fee grid"
          >
            <RotateCcw className="size-3.5" />
            Reset
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
          <p className={META_TEXT}>
            Dashed dots are ₹0 slots. Past school years stay on the rail but do not create
            withdrawals.
          </p>
        ) : null}
      </div>
    </FormBand>
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
  const StartIcon = college ? GraduationCap : ChevronRight;
  const EndIcon = Flag;
  const PhaseIcon = college ? GraduationCap : BookOpen;

  return (
    <Card className="gap-2" padding="tight">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
              college
                ? "bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                : "bg-[var(--app-std-bg)] text-[var(--app-std-text)]"
            }`}
          >
            <PhaseIcon className="size-3.5" />
          </div>
          <div className="min-w-0">
            <SectionTitle as="h2">{title}</SectionTitle>
            <div className={META_TEXT}>{hint}</div>
          </div>
        </div>
        <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--app-text-muted)]">
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
            className="pointer-events-none absolute left-[2.125rem] right-[2.125rem] top-[1.125rem] h-0.5 bg-[var(--app-border)]"
            aria-hidden
          />

          <div className="relative z-[1] flex w-[4.25rem] shrink-0 flex-col items-center">
            <div
              className={`flex size-9 items-center justify-center rounded-full border-2 ${
                college
                  ? "border-[var(--app-step-text)]/40 bg-[var(--app-step-bg)] text-[var(--app-step-text)]"
                  : "border-[var(--app-primary)] bg-[var(--app-primary)] text-[var(--app-primary-fg)]"
              }`}
            >
              <StartIcon className="size-4" />
            </div>
            <div className="mt-1.5 text-center">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                {startLabel}
              </div>
              <div className="text-[11px] font-semibold text-[var(--app-text)]">
                Age {startAge}
              </div>
              <div className="max-w-[4.25rem] truncate text-[9px] text-[var(--app-text-subtle)]">
                {startSub}
              </div>
            </div>
          </div>

          {entries.map(({ row, index }) => {
            const Icon = college ? GraduationCap : BookOpen;
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
                  className={`relative flex size-9 items-center justify-center rounded-full border-2 transition ${
                    isOpen || isActive
                      ? college
                        ? "border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)] ring-4 ring-[var(--app-step-text)]/20"
                        : "border-[var(--app-std-text)] bg-[var(--app-std-bg)] text-[var(--app-std-text)] ring-4 ring-[var(--app-std-text)]/15"
                      : isPast
                        ? "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-subtle)]"
                        : isFunded
                          ? college
                            ? "border-[var(--app-step-text)]/50 bg-[var(--app-surface)] text-[var(--app-step-text)] hover:border-[var(--app-step-text)]"
                            : "border-[var(--app-std-text)]/40 bg-[var(--app-surface)] text-[var(--app-std-text)] hover:border-[var(--app-std-text)]"
                          : "border-dashed border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-subtle)] hover:border-[var(--app-primary-soft)]"
                  }`}
                  onClick={() => onToggle(index)}
                  title={`${row.classLabel} · Age ${row.age} · ${formatINRCurrency(row.cost)}`}
                  aria-expanded={isOpen}
                >
                  <Icon className="size-4" />
                  {isActive ? (
                    <span
                      className={`absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                        college ? "bg-[var(--app-step-text)]" : "bg-[var(--app-std-text)]"
                      }`}
                    />
                  ) : null}
                </button>
                <div className="mt-1.5 max-w-[4.75rem] text-center">
                  <div className="truncate text-[11px] font-semibold text-[var(--app-text)]">
                    {row.classLabel}
                  </div>
                  <div className="text-[9px] text-[var(--app-text-muted)]">Age {row.age}</div>
                  <div className="truncate text-[9px] tabular-nums text-[var(--app-text-subtle)]">
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
            <div className="flex size-9 items-center justify-center rounded-full border-2 border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
              <EndIcon className="size-4" />
            </div>
            <div className="mt-1.5 text-center">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                {endLabel}
              </div>
              <div className="text-[11px] font-semibold text-[var(--app-text)]">
                Age {endAge}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editPanel}
    </Card>
  );
}

function EducationResults({
  result,
  childName,
  childAge,
  taxPct,
}: {
  result: EducationResult;
  childName: string;
  childAge: number;
  taxPct: number;
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
    <Stack>
      <StatGrid>
        <StatCard
          title="Lumpsum required today"
          value={result.lumpsum.lumpsum}
          hint={`Peak ${formatINRCurrency(result.lumpsum.peakCorpus)}`}
          tone="neutral"
        />
        <StatCard
          title="Monthly SIP required"
          value={result.sip.monthlySip}
          tone="positive"
          hint={`${result.sipYears} years of SIP funding`}
        />
      </StatGrid>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <QuickStat
          icon={BookOpen}
          label="School start"
          value={`Age ${childAge}`}
          sub={childName.trim() || "Current age"}
        />
        <QuickStat
          icon={GraduationCap}
          label="College start"
          value={firstCollege ? `Age ${firstCollege.age}` : "None"}
          sub={firstCollege?.classLabel ?? "No college fees"}
        />
        <QuickStat
          icon={Calendar}
          label="Horizon"
          value={`Age ${result.lastFeeAge}`}
          sub={`${result.sipYears} SIP years`}
        />
        <QuickStat
          icon={Flag}
          label="Total withdrawal"
          value={formatINRCurrency(result.totalWithdrawal)}
          sub={`Tax ${taxPct}% on fees`}
        />
      </div>

      {hasShortfall ? (
        <StatusNote tone="error">
          Funding shortfall detected
          {shortfallRows[0]
            ? ` from ${shortfallRows[0].classLabel} (age ${shortfallRows[0].age})`
            : ""}
          . SIP balance turns negative before fees end. Raise monthly SIP or add a lumpsum top-up.
        </StatusNote>
      ) : null}

      <ResultsSplit
        left={
          <div className="flex min-h-0 flex-col gap-2.5">
            <CompareChart
              title="Lumpsum vs SIP"
              data={result.compare}
              series={[
                { key: "lumpsum", label: "Lumpsum", color: "var(--app-chart-invested)" },
                { key: "sip", label: "SIP", color: "var(--app-chart-gain)" },
              ]}
              className="min-h-[240px] h-[240px] flex-none sm:min-h-[260px] sm:h-[260px]"
            />
            <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
              {schoolChart.length > 0 ? (
                <StackedBarChart
                  title="School costs"
                  orientation="horizontal"
                  totalLabel="Total withdrawal"
                  className="min-h-[240px] h-[240px] flex-none"
                  data={schoolChart.map((row) => ({
                    category: row.classLabel,
                    cost: row.cost,
                    tax: row.tax,
                  }))}
                  series={[...costSeries]}
                />
              ) : null}
              {collegeChart.length > 0 ? (
                <StackedBarChart
                  title="College costs"
                  orientation="horizontal"
                  totalLabel="Total withdrawal"
                  className="min-h-[200px] h-[200px] flex-none"
                  data={collegeChart.map((row) => ({
                    category: row.classLabel,
                    cost: row.cost,
                    tax: row.tax,
                  }))}
                  series={[...costSeries]}
                />
              ) : null}
            </div>
          </div>
        }
        right={
          <ResultCard
            title="Plan summary"
            items={[
              {
                label: "Lumpsum required today",
                value: result.lumpsum.lumpsum,
                highlight: true,
              },
              {
                label: "Monthly SIP",
                value: result.sip.monthlySip,
                hint: `${result.sipYears} years`,
                tone: "maturity",
              },
              { label: "SIP invested", value: result.sip.invested },
              { label: "Peak corpus (SIP)", value: result.sip.peakCorpus, tone: "gain" },
              { label: "Total withdrawal", value: result.totalWithdrawal, tone: "delay" },
              { label: "Total tax drag", value: result.totalTax, tone: "tax" },
            ]}
          />
        }
      />

      <ScheduleTable
        caption="Education investment and withdrawal plan"
        meta={
          <>
            SIP{" "}
            <span className="font-semibold text-[var(--app-text)]">
              {formatINRCurrency(result.sip.monthlySip)}
            </span>
            <span className="mx-2 text-[var(--app-border)]">·</span>
            Withdrawals{" "}
            <span className="font-semibold text-[var(--app-text)]">
              {formatINRCurrency(result.totalWithdrawal)}
            </span>
          </>
        }
        zebra
        dense
        highlightLastRow
        emphasizeRow={(row) => {
          const r = row as EducationResult["schedule"][number];
          if (r.age <= childAge) return false;
          if (firstWithdrawal && r.age === firstWithdrawal.age) return true;
          if (firstCollege && r.age === firstCollege.age) return true;
          if (r.age === result.lastFeeAge) return true;
          return false;
        }}
        dangerRow={(row) => {
          const r = row as EducationResult["schedule"][number];
          return r.age > childAge && r.sipBalance < -0.5;
        }}
        columns={[
          { key: "age", header: "Age", sticky: true },
          { key: "classLabel", header: "Class", format: "text" },
          { key: "cost", header: "Edu. cost", format: "inr", align: "right", tone: "warn" },
          { key: "tax", header: "Cap. gains", format: "inr", align: "right", tone: "warn" },
          {
            key: "withdrawal",
            header: "Withdrawal",
            format: "inr",
            align: "right",
            tone: "warn",
          },
          { key: "sipCorpus", header: "SIP corpus", format: "inr", align: "right", tone: "std" },
          {
            key: "sipBalance",
            header: "SIP balance",
            format: "inr",
            align: "right",
            tone: "std",
            render: (value) => {
              const n = typeof value === "number" ? value : Number(value);
              if (!Number.isFinite(n)) return "";
              return (
                <span className={n < -0.5 ? "font-semibold text-[var(--app-danger)]" : undefined}>
                  {formatINRCurrency(n)}
                </span>
              );
            },
          },
          {
            key: "lumpsumBalance",
            header: "Lumpsum balance",
            format: "inr",
            align: "right",
            tone: "step",
          },
        ]}
        rows={result.schedule}
      />
    </Stack>
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
    <Card className="h-full gap-2" padding="tight">
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
          <Icon className="size-3.5" />
        </div>
        <SectionTitle>{label}</SectionTitle>
      </div>
      <div className="min-w-0">
        <div className="break-words text-[14px] font-semibold leading-snug text-[var(--app-text)] sm:text-[15px]">
          {value}
        </div>
        {sub ? <div className={`mt-0.5 ${META_TEXT}`}>{sub}</div> : null}
      </div>
    </Card>
  );
}
