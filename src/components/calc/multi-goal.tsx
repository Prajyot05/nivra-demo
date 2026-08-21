"use client";

import { useMemo, useState } from "react";
import {
  CalculatorPage,
  ClientHeader,
  CompareChart,
  Field,
  formatINR,
  GrowthChart,
  ModeTabs,
  MoneyInput,
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

const FORM_GRID =
  "grid grid-cols-1 items-start gap-3 min-[400px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 sm:gap-4 lg:gap-3 xl:gap-5";

const MODES = [
  { id: "assign", label: "Corpus assign" },
  { id: "withdrawals", label: "Withdrawals" },
] as const;

type Mode = (typeof MODES)[number]["id"];

const DEFAULT_GOALS = [
  { name: "Education", amount: 5_000_000, years: 10 },
  { name: "House1", amount: 8_000_000, years: 8 },
  { name: "House2", amount: 130_000_000, years: 12 },
  { name: "Car", amount: 4_800_000, years: 5 },
  { name: "Marriage", amount: 50_000_000, years: 25 },
];

const DEFAULT_WITHDRAWALS = [
  { name: "Car", amount: 2_000_000, atAge: 33 },
  { name: "Education 1", amount: 2_000_000, atAge: 41 },
  { name: "Education 2", amount: 5_000_000, atAge: 54 },
  { name: "Education 3", amount: 3_500_000, atAge: 54 },
  { name: "Education 4", amount: 2_000_000, atAge: 41 },
  { name: "Marriage", amount: 2_000_000, atAge: 58 },
  { name: "OldAge Home", amount: 16_000_000, atAge: 60 },
];

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
  rows: Array<{ name: string; atAge: number; amount: number; monthlySip: number; invested: number }>;
  phases: Array<{ fromAge: number; toAge: number; monthlySip: number }>;
};

export function MultiGoalCalculator() {
  const [mode, setMode] = useState<Mode>("assign");
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
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  const [wName, setWName] = useState("Opinder Jain");
  const [wAge, setWAge] = useState(28);
  const [wRet, setWRet] = useState(12);
  const [wTax, setWTax] = useState(12.5);
  const [withdrawals, setWithdrawals] = useState(DEFAULT_WITHDRAWALS);

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
      withdrawals,
    };
  }, [mode, name, age, stYears, stRet, ltRet, infl, tax, delay, corpus, corpusRet, goals, wName, wAge, wRet, wTax, withdrawals]);

  const id = mode === "assign" ? "multi-goal-assign" : "multi-withdrawals";
  const { result, error, loading } = useCalculate<AssignResult & Partial<WithdrawResult>>(id, input);

  return (
    <CalculatorPage
      title="Multi-Goal & Withdrawals"
      description="Corpus assignment (Full Set) and SIP for timed withdrawals (Unprotected v2)."
      modes={<ModeTabs tabs={[...MODES]} value={mode} onChange={(m) => setMode(m as Mode)} />}
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
            <div className={FORM_GRID}>
              <ClientHeader name={wName} age={wAge} onNameChange={setWName} onAgeChange={setWAge} />
              <PercentInput label="Return (%)" value={wRet} onChange={setWRet} />
              <PercentInput label="Tax (%)" value={wTax} onChange={setWTax} />
            </div>
            <WithdrawalGrid
              rows={withdrawals}
              onChange={(index, patch) =>
                setWithdrawals((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
              }
            />
          </div>
        )
      }
      results={
        <div className="flex flex-col gap-3">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p> : null}
          {mode === "assign" && result && "goals" in result ? <AssignResults result={result as AssignResult} /> : null}
          {mode === "withdrawals" && result && "ageChart" in result ? (
            <WithdrawResults result={result as WithdrawResult} />
          ) : null}
        </div>
      }
    />
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

function WithdrawalGrid({
  rows,
  onChange,
}: {
  rows: Array<{ name: string; amount: number; atAge: number }>;
  onChange: (index: number, patch: Partial<{ name: string; amount: number; atAge: number }>) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        Withdrawals
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <YearInput label="At age" value={row.atAge} min={1} max={120} onChange={(atAge) => onChange(index, { atAge })} />
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

function WithdrawResults({ result }: { result: WithdrawResult }) {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard title="Start monthly SIP" value={result.startMonthlySip} />
            <StatCard title="Total withdrawn" value={result.totalWithdrawn} variant="soft" />
          </div>
          <CompareChart
            title="Corpus by age at withdrawals"
            data={result.ageChart
              .filter((row) => row.withdrawal > 0)
              .map((row) => ({ category: String(row.age), corpus: row.corpus }))}
            series={[{ key: "corpus", label: "Corpus", color: "var(--app-chart-gain)" }]}
          />
          <GrowthChart
            title="Corpus over age"
            data={result.schedule.map((row) => ({
              year: row.age,
              corpus: row.corpus,
              withdrawal: row.withdrawal,
            }))}
            series={[
              { key: "corpus", label: "Corpus", color: "var(--app-chart-gain)" },
              { key: "withdrawal", label: "Withdrawal", color: "var(--app-chart-tax)" },
            ]}
          />
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="shrink-0">
            <ResultCard
              title="Results"
              items={[
                { label: "Start SIP", value: result.startMonthlySip },
                { label: "Invested", value: result.totalInvested },
                { label: "Withdrawn", value: result.totalWithdrawn },
                { label: "Tax", value: result.totalTax },
              ]}
            />
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Per withdrawal SIP"
        columns={[
          { key: "name", header: "Goal" },
          { key: "atAge", header: "Age" },
          { key: "monthlySip", header: "SIP", format: "inr", align: "right" },
          { key: "invested", header: "Invested", format: "inr", align: "right" },
        ]}
        rows={result.rows}
      />
    </div>
  );
}
