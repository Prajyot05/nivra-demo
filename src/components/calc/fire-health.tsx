"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateCalculatorReport } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  ClientHeader,
  ComboChart,
  CompareChart,
  CompositionChart,
  GrowthChart,
  MoneyInput,
  PercentInput,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  SelectInput,
  StackedAreaChart,
  StatCard,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] items-start gap-x-3 gap-y-3";

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
  const [eventAge, setEventAge] = useState(62);
  const [eventAmt, setEventAmt] = useState(20_000_000);
  const [eventOn, setEventOn] = useState(true);

  const calculatorId = mode === "fire" ? "fire-planner" : "financial-health";

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
      events: eventOn
        ? [{ age: eventAge, amount: eventAmt, type: "Expense" as const }]
        : [],
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
    eventOn,
    eventAge,
    eventAmt,
  ]);

  const { result, error, loading } = useCalculate(calculatorId, input);
  const fire = mode === "fire" ? (result as FireResult | null) : null;
  const health = mode === "health" ? (result as HealthResult | null) : null;

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    if (!result) return;
    setIsDownloading(true);
    try {
      if (mode === "fire") {
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
      } else {
        const hr = result as HealthResult;
        const retireIdx = hr.schedule.findIndex((row) => row.age === hRet);

        generateCalculatorReport({
          title: "Financial Health & Longevity Dossier",
          subtitle: "Projected capital required vs longevity",
          clientName: hName,
          age: hAge,
          meta: [
            { label: "RETIRE", value: String(hRet) },
            { label: "SURVIVE", value: String(hSurv) },
          ],
          status: hr.funded ? "Funded" : "Action Needed",
          filename: `fire-health-${hName}`,
          headlines: [
            {
              label: "Corpus at Retirement",
              value: hr.corpusAtRetirement,
              highlight: true,
              hint: `Active ${hr.activeYears} yrs · Retired ${hr.retiredYears} yrs`,
            },
            {
              label: "Funding Gap @ Retirement",
              value: hr.gapAtRetirement,
              hint: hr.funded ? "Fully funded" : "Cashflow deficit identified",
            },
          ],
          metrics: [
            { label: "Surviving Corpus", value: hr.remainingAtSurvival },
            {
              label: "Months Lasting",
              value: hr.funded ? "Fully Survives" : `${hr.monthsLasting} mos`,
              currency: false,
            },
            { label: "PV Remaining", value: hr.remainingPvToday },
            { label: "Exp @ Ret+1", value: hr.monthlyExpAtRetPlus1 },
          ],
          assumptions: [
            ["Current Age", hAge],
            ["Retirement Age", hRet],
            ["Surviving Age", hSurv],
            ["Current Corpus", hCorpus, true],
            ["Monthly Expenses", hExp, true],
            ["Monthly Investment", hSav, true],
            ["Lifestyle Yearly", hLife, true],
            ["Pre-Ret Return", `${hReturn}%`],
            ["Post-Ret Return", `${hAfter}%`],
            ["Inflation", `${hInfl}%`],
            ["Tax", `${hTax}%`],
            ["Ret. Benefit", hBenefit, true],
          ],
          tables: [
            {
              title: "Age Path",
              head: ["Age", "Phase", "Yearly Expense", "Event", "Corpus"],
              body: hr.schedule.map((row) => [
                row.age,
                row.phase,
                row.yearlyExpense,
                row.eventAmount,
                row.corpus,
              ]),
              columnAlignments: ["left", "left", "right", "right", "right"],
              currencyColumns: [2, 3, 4],
              highlightRows: retireIdx >= 0 ? [retireIdx] : [],
            },
          ],
          playbook: playbookForPdf("health"),
        });
      }
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <CalculatorPage
      title={getCalculatorPageTitle("/fire", mode)}
      description="FIRE corpus / SIP planner and long-term financial health from Unprotected Excel."
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
          <div className={FORM_GRID}>
            <ClientHeader name={hName} age={hAge} onNameChange={setHName} onAgeChange={setHAge} />
            <YearInput label="Retirement age" value={hRet} onChange={setHRet} />
            <YearInput label="Surviving age" value={hSurv} onChange={setHSurv} />
            <MoneyInput label="Current corpus" value={hCorpus} onChange={setHCorpus} />
            <MoneyInput label="Monthly expenses" value={hExp} onChange={setHExp} />
            <MoneyInput label="Monthly investment" value={hSav} onChange={setHSav} />
            <MoneyInput label="Lifestyle (yearly)" value={hLife} onChange={setHLife} />
            <PercentInput label="Inflation" value={hInfl} onChange={setHInfl} />
            <PercentInput label="Return (pre)" value={hReturn} onChange={setHReturn} />
            <PercentInput label="Return (post)" value={hAfter} onChange={setHAfter} />
            <PercentInput label="Tax after ret." value={hTax} onChange={setHTax} />
            <MoneyInput label="Retirement benefit" value={hBenefit} onChange={setHBenefit} />
            <SelectInput
              label="Include sample event"
              value={eventOn ? "yes" : "no"}
              onChange={(v) => setEventOn(v === "yes")}
              options={[
                { value: "yes", label: "Yes · expense at event age" },
                { value: "no", label: "No events" },
              ]}
            />
            <YearInput label="Event age" value={eventAge} onChange={setEventAge} />
            <MoneyInput label="Event amount" value={eventAmt} onChange={setEventAmt} />
          </div>
        )
      }
      results={
        <div className="flex flex-col gap-3">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? (
            <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p>
          ) : null}
          {fire ? <FireResults result={fire} retirementAge={retAge} /> : null}
          {health ? <HealthResults result={health} /> : null}
        </div>
      }
    />
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
    <div className="flex flex-col gap-4 lg:gap-6">
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

function HealthResults({ result }: { result: HealthResult }) {
  const combo = result.schedule.map((row) => ({
    age: row.age,
    corpus: row.corpus,
    expense: row.yearlyExpense,
  }));

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard title="Corpus at retirement" value={result.corpusAtRetirement} />
            <StatCard
              title={result.funded ? "Remaining at survival" : "Corpus when funds run out"}
              value={result.funded ? result.remainingAtSurvival : 0}
              variant="soft"
              hint={
                result.funded
                  ? `Lasts full ${result.retiredYears} yrs`
                  : `Lasts ~${result.yearsLasting} of ${result.retiredYears} yrs`
              }
            />
          </div>
          <ComboChart
            title="Corpus and expenses vs age"
            data={combo}
            bars={[{ key: "corpus", label: "Corpus", color: "var(--app-chart-invested)" }]}
            lines={[{ key: "expense", label: "Yearly expense", color: "var(--app-chart-tax)" }]}
          />
          <CompositionChart
            title="Savings vs retirement gap"
            slices={[
              {
                name: "Corpus at retirement",
                value: result.corpusAtRetirement,
                color: "var(--app-chart-invested)",
              },
              {
                name: "Gap",
                value: result.gapAtRetirement,
                color: "var(--app-chart-tax)",
              },
            ]}
            centerLabel={result.funded ? "Funded" : "Short"}
            centerValue={result.corpusAtRetirement}
          />
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="shrink-0">
            <p className="mb-3 text-sm text-[var(--app-text-muted)]">{result.message}</p>
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
                { label: "Monthly exp. @ ret+1", value: result.monthlyExpAtRetPlus1 },
                { label: "Lifestyle @ ret+1", value: result.lifestyleAtRetPlus1 },
                { label: "Retirement gap", value: result.gapAtRetirement },
              ]}
            />
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Age path"
        zebra
        columns={[
          { key: "age", header: "Age", sticky: true },
          { key: "phase", header: "Phase", format: "text" },
          {
            key: "yearlyExpense",
            header: "Expense",
            format: "inr",
            align: "right",
            tone: "warn",
          },
          { key: "eventAmount", header: "Event", format: "inr", align: "right", tone: "warn" },
          { key: "corpus", header: "Corpus", format: "inr", align: "right", tone: "step" },
        ]}
        rows={result.schedule}
      />
    </div>
  );
}
