"use client";

import { useMemo, useState } from "react";
import {
  CalculatorPage,
  ClientHeader,
  CompareChart,
  Field,
  formatINR,
  parseDigits,
  PercentInput,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  StackedBarChart,
  StatCard,
  TextInput,
  YearInput,
} from "@nivra/ui";
import { useCalculate } from "@/hooks/use-calculate";

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

export function ChildEducationPlanner() {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(35);
  const [childName, setChildName] = useState("Jitender Agarwal");
  const [childAge, setChildAge] = useState(5);
  const [returnPct, setReturnPct] = useState(12);
  const [taxPct, setTaxPct] = useState(12.5);
  const [costs, setCosts] = useState(() => DEFAULT_COSTS.map((row) => ({ ...row })));

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

  const { result, error, loading } = useCalculate<EducationResult>("education", input);

  return (
    <CalculatorPage
      title="Child Education Planner"
      description="Fund future school and college fees with a lumpsum today or a monthly SIP."
      form={
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 items-start gap-3 min-[400px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 sm:gap-4 lg:gap-3 xl:gap-5">
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <Field label="Child name">
              <TextInput
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </Field>
            <YearInput
              label="Child age"
              value={childAge}
              min={0}
              max={40}
              onChange={setChildAge}
            />
            <PercentInput label="Return (%)" value={returnPct} onChange={setReturnPct} />
            <PercentInput label="Fee tax (%)" value={taxPct} onChange={setTaxPct} />
          </div>
          <CostGrid
            costs={costs}
            onCostChange={(index, cost) =>
              setCosts((prev) =>
                prev.map((row, i) => (i === index ? { ...row, cost } : row)),
              )
            }
          />
        </div>
      }
      results={
        <div className="flex flex-col gap-4">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? (
            <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p>
          ) : null}
          {result ? <EducationResults result={result} /> : null}
        </div>
      }
    />
  );
}

function CostGrid({
  costs,
  onCostChange,
}: {
  costs: Array<{ age: number; classLabel: string; cost: number }>;
  onCostChange: (index: number, cost: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        Education cost by class
      </div>
      <div className="max-h-36 overflow-y-auto pr-1 lg:max-h-32">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {costs.map((row, index) => (
            <label key={`${row.age}-${row.classLabel}`} className="block min-w-0">
              <span
                className="mb-1.5 block h-4 truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                title={row.classLabel}
              >
                {row.classLabel}
              </span>
              <TextInput
                inputMode="numeric"
                aria-label={`${row.classLabel} cost`}
                className="h-8 text-right"
                value={formatINR(row.cost)}
                onChange={(e) =>
                  onCostChange(index, parseDigits(e.target.value.replace(/,/g, "")))
                }
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function EducationResults({ result }: { result: EducationResult }) {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard title="Lumpsum required today" value={result.lumpsum.lumpsum} />
            <StatCard title="Monthly SIP required" value={result.sip.monthlySip} variant="soft" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CompareChart
              title="Lumpsum vs SIP"
              data={result.compare}
              series={[
                { key: "lumpsum", label: "Lumpsum", color: "var(--app-chart-invested)" },
                { key: "sip", label: "SIP", color: "var(--app-chart-gain)" },
              ]}
            />
            <StackedBarChart
              title="Year-wise education cost"
              data={result.costChart.map((row) => ({
                category: row.classLabel,
                cost: row.cost,
                tax: row.tax,
              }))}
              series={[
                { key: "cost", label: "Edu. cost", color: "var(--app-chart-invested)" },
                { key: "tax", label: "Cap. gains", color: "var(--app-chart-tax)" },
              ]}
            />
          </div>
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="shrink-0">
            <ResultCard
              title="Plan summary"
              items={[
                { label: "Amount today", value: result.lumpsum.lumpsum },
                { label: "Monthly SIP", value: result.sip.monthlySip, hint: `${result.sipYears} years` },
                { label: "Total withdrawal", value: result.totalWithdrawal },
                { label: "Peak corpus (SIP)", value: result.sip.peakCorpus },
              ]}
            />
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Education investment and withdrawal plan"
        columns={[
          { key: "age", header: "Age" },
          { key: "classLabel", header: "Class", format: "text" },
          { key: "cost", header: "Edu. cost", format: "inr", align: "right" },
          { key: "tax", header: "Cap. gains", format: "inr", align: "right" },
          { key: "withdrawal", header: "Withdrawal", format: "inr", align: "right" },
          { key: "sipCorpus", header: "SIP corpus", format: "inr", align: "right" },
          { key: "sipBalance", header: "SIP balance", format: "inr", align: "right" },
          { key: "lumpsumBalance", header: "Lumpsum balance", format: "inr", align: "right" },
        ]}
        rows={result.schedule}
      />
    </div>
  );
}
