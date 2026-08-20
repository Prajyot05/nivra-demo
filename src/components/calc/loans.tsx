"use client";

import { useMemo, useState } from "react";
import {
  CalculatorPage,
  ClientHeader,
  CompareChart,
  CompositionChart,
  GrowthChart,
  ModeTabs,
  MoneyInput,
  PercentInput,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  StackedAreaChart,
  StackedBarChart,
  StatCard,
  YearInput,
} from "@nivra/ui";
import { useCalculate } from "@/hooks/use-calculate";

const FORM_GRID =
  "grid grid-cols-1 items-start gap-3 min-[400px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 sm:gap-4 lg:gap-3 xl:gap-5";

const MODES = [
  { id: "emi", label: "EMI" },
  { id: "prepay", label: "Prepay" },
  { id: "extra-vs-invest", label: "Extra vs invest" },
  { id: "recovery", label: "Interest recovery" },
  { id: "vehicle", label: "Vehicle" },
] as const;

type Mode = (typeof MODES)[number]["id"];

const CALCULATOR_ID: Record<Mode, string> = {
  emi: "loan-emi",
  prepay: "loan-prepay",
  "extra-vs-invest": "loan-extra-vs-invest",
  recovery: "loan-interest-recovery",
  vehicle: "vehicle-loan",
};

type AmortRow = { month: number; emi: number; principal: number; interest: number; balance: number; extra?: number };

type EmiResult = {
  emi: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortRow[];
};

type PrepayResult = EmiResult & {
  monthsPaid: number;
  totalExtra: number;
  originalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  recoverSip: number;
  revisedRecoverSip: number;
  originalSchedule: AmortRow[];
};

type ExtraVsInvestResult = {
  emi: number;
  originalInterest: number;
  originalNetCost: number;
  option1Interest: number;
  option1Saving: number;
  option1NetCost: number;
  corpusAfterTax: number;
  option2Saving: number;
  option2NetCost: number;
  remainingMonths: number;
  interestSavedVsOriginal: number;
  path: Array<{ month: number; outstandingPrepay: number; investment: number }>;
};

type RecoveryResult = {
  baselineEmi: number;
  baselineInterest: number;
  baselinePaid: number;
  proposedEmi: number;
  proposedInterest: number;
  proposedPaid: number;
  monthlySip: number;
  sipInvested: number;
  sipAtHorizon: number;
  wealthCreated: number;
  totalAssetPlusWealth: number;
  additionalWealth: number;
  savingsVsBaselinePaid: number;
  schedule: Array<{ year: number; baseline: number; proposed: number; sip: number; loanPlusSip: number }>;
};

type VehicleResult = {
  emi: number;
  totalInterest: number;
  totalDepreciation: number;
  totalTaxSaved: number;
  compare: Array<{ category: string; benefit: number }>;
  stacked: Array<{ category: string; taxShield: number; opportunity: number; netBenefit: number }>;
  options: Array<{ name: string; financialBenefit: number; netOutOfPocket: number; netProfit: number }>;
  depreciation: Array<{ year: number; value: number; depreciation: number; balance: number }>;
};

type LoanResult = EmiResult & Partial<PrepayResult> & Partial<ExtraVsInvestResult> & Partial<RecoveryResult> & Partial<VehicleResult>;

export function LoansCalculator() {
  const [mode, setMode] = useState<Mode>("emi");
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(40);

  const [principal, setPrincipal] = useState(7_500_000);
  const [years, setYears] = useState(20);
  const [interest, setInterest] = useState(9.2);

  const [prepayPrincipal, setPrepayPrincipal] = useState(15_000_000);
  const [prepayYears, setPrepayYears] = useState(5);
  const [prepayRate, setPrepayRate] = useState(10);
  const [yearlyExtra, setYearlyExtra] = useState(318705.67);
  const [recoverReturn, setRecoverReturn] = useState(12);

  const [vsPrincipal, setVsPrincipal] = useState(20_000_000);
  const [vsYears, setVsYears] = useState(20);
  const [vsRate, setVsRate] = useState(8.5);
  const [extraAmount, setExtraAmount] = useState(5_000_000);
  const [extraMonth, setExtraMonth] = useState(49);
  const [investReturn, setInvestReturn] = useState(9);
  const [cgTax, setCgTax] = useState(12.5);
  const [incomeTax, setIncomeTax] = useState(20);

  const [recPrincipal, setRecPrincipal] = useState(20_000_000);
  const [recYears, setRecYears] = useState(20);
  const [recRate, setRecRate] = useState(8.5);
  const [proposedYears, setProposedYears] = useState(15);
  const [sipReturn, setSipReturn] = useState(12);

  const [onRoad, setOnRoad] = useState(3_500_000);
  const [vehLoan, setVehLoan] = useState(2_800_000);
  const [vehRate, setVehRate] = useState(8.5);
  const [vehYears, setVehYears] = useState(5);
  const [vehTax, setVehTax] = useState(20);
  const [depPct, setDepPct] = useState(15);
  const [fdRet, setFdRet] = useState(7);
  const [debtRet, setDebtRet] = useState(8);
  const [consRet, setConsRet] = useState(9);
  const [eqRet, setEqRet] = useState(12);
  const [fdTax, setFdTax] = useState(20);
  const [debtTax, setDebtTax] = useState(25);
  const [consTax, setConsTax] = useState(12.5);
  const [eqTax, setEqTax] = useState(12.5);

  const input = useMemo(() => {
    const client = { clientName: name, age };
    switch (mode) {
      case "emi":
        return { ...client, principal, years, interestPct: interest };
      case "prepay":
        return {
          ...client,
          principal: prepayPrincipal,
          years: prepayYears,
          interestPct: prepayRate,
          yearlyExtra,
          recoverReturnPct: recoverReturn,
        };
      case "extra-vs-invest":
        return {
          ...client,
          principal: vsPrincipal,
          years: vsYears,
          interestPct: vsRate,
          extraAmount,
          extraMonth,
          investReturnPct: investReturn,
          taxPct: cgTax,
          incomeTaxPct: incomeTax,
        };
      case "recovery":
        return {
          ...client,
          principal: recPrincipal,
          years: recYears,
          interestPct: recRate,
          proposedYears,
          sipReturnPct: sipReturn,
        };
      case "vehicle":
        return {
          ...client,
          onRoadCost: onRoad,
          loanAmount: vehLoan,
          interestPct: vehRate,
          years: vehYears,
          incomeTaxPct: vehTax,
          depreciationPct: depPct,
          fdReturnPct: fdRet,
          debtReturnPct: debtRet,
          conservativeReturnPct: consRet,
          equityReturnPct: eqRet,
          fdTaxPct: fdTax,
          debtTaxPct: debtTax,
          conservativeTaxPct: consTax,
          equityTaxPct: eqTax,
        };
    }
  }, [
    mode, name, age, principal, years, interest, prepayPrincipal, prepayYears, prepayRate, yearlyExtra, recoverReturn,
    vsPrincipal, vsYears, vsRate, extraAmount, extraMonth, investReturn, cgTax, incomeTax,
    recPrincipal, recYears, recRate, proposedYears, sipReturn,
    onRoad, vehLoan, vehRate, vehYears, vehTax, depPct, fdRet, debtRet, consRet, eqRet, fdTax, debtTax, consTax, eqTax,
  ]);

  const { result, error, loading } = useCalculate<LoanResult>(CALCULATOR_ID[mode], input);

  return (
    <CalculatorPage
      title="Loans"
      description="EMI, yearly prepay, extra vs invest (v2), interest recovery, and vehicle loan benefit."
      modes={<ModeTabs tabs={[...MODES]} value={mode} onChange={(id) => setMode(id as Mode)} />}
      form={
        mode === "emi" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Principal" value={principal} onChange={setPrincipal} />
            <YearInput value={years} min={1} max={50} onChange={setYears} />
            <PercentInput label="Interest (%)" value={interest} onChange={setInterest} />
          </div>
        ) : mode === "prepay" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Principal" value={prepayPrincipal} onChange={setPrepayPrincipal} />
            <YearInput value={prepayYears} min={1} max={50} onChange={setPrepayYears} />
            <PercentInput label="Interest (%)" value={prepayRate} onChange={setPrepayRate} />
            <MoneyInput label="Yearly extra" value={yearlyExtra} onChange={setYearlyExtra} />
            <PercentInput label="Recover ret. (%)" value={recoverReturn} onChange={setRecoverReturn} />
          </div>
        ) : mode === "extra-vs-invest" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Principal" value={vsPrincipal} onChange={setVsPrincipal} />
            <YearInput value={vsYears} min={1} max={50} onChange={setVsYears} />
            <PercentInput label="Interest (%)" value={vsRate} onChange={setVsRate} />
            <MoneyInput label="Extra payment" value={extraAmount} onChange={setExtraAmount} />
            <YearInput label="Extra month #" value={extraMonth} min={1} max={1200} onChange={setExtraMonth} />
            <PercentInput label="Invest ret. (%)" value={investReturn} onChange={setInvestReturn} />
            <PercentInput label="CG tax (%)" value={cgTax} onChange={setCgTax} />
            <PercentInput label="Income tax (%)" value={incomeTax} onChange={setIncomeTax} />
          </div>
        ) : mode === "recovery" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Principal" value={recPrincipal} onChange={setRecPrincipal} />
            <YearInput label="Baseline yrs" value={recYears} min={1} max={50} onChange={setRecYears} />
            <PercentInput label="Interest (%)" value={recRate} onChange={setRecRate} />
            <YearInput label="Proposed yrs" value={proposedYears} min={1} max={50} onChange={setProposedYears} />
            <PercentInput label="SIP return (%)" value={sipReturn} onChange={setSipReturn} />
          </div>
        ) : (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="On-road cost" value={onRoad} onChange={setOnRoad} />
            <MoneyInput label="Loan amount" value={vehLoan} onChange={setVehLoan} />
            <PercentInput label="Interest (%)" value={vehRate} onChange={setVehRate} />
            <YearInput value={vehYears} min={1} max={15} onChange={setVehYears} />
            <PercentInput label="Income tax (%)" value={vehTax} onChange={setVehTax} />
            <PercentInput label="Depreciation (%)" value={depPct} onChange={setDepPct} />
            <PercentInput label="FD return (%)" value={fdRet} onChange={setFdRet} />
            <PercentInput label="MF debt (%)" value={debtRet} onChange={setDebtRet} />
            <PercentInput label="Cons. (%)" value={consRet} onChange={setConsRet} />
            <PercentInput label="Equity (%)" value={eqRet} onChange={setEqRet} />
            <PercentInput label="FD tax (%)" value={fdTax} onChange={setFdTax} />
            <PercentInput label="Debt tax (%)" value={debtTax} onChange={setDebtTax} />
            <PercentInput label="Cons. tax (%)" value={consTax} onChange={setConsTax} />
            <PercentInput label="Equity tax (%)" value={eqTax} onChange={setEqTax} />
          </div>
        )
      }
      results={
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p> : null}
          {result && mode === "emi" ? <EmiResults result={result} /> : null}
          {result && mode === "prepay" ? <PrepayResults result={result as PrepayResult} /> : null}
          {result && mode === "extra-vs-invest" ? <ExtraVsInvestResults result={result as ExtraVsInvestResult} /> : null}
          {result && mode === "recovery" ? <RecoveryResults result={result as RecoveryResult} /> : null}
          {result && mode === "vehicle" ? <VehicleResults result={result as VehicleResult} /> : null}
        </div>
      }
    />
  );
}

function EmiResults({ result }: { result: EmiResult }) {
  let interestToDate = 0;
  const area = result.schedule.map((row) => {
    interestToDate += row.interest;
    return { year: row.month, remaining: row.balance, interestPaid: interestToDate };
  });
  return (
    <div className={RESULTS_SPLIT}>
      <div className={RESULTS_LEFT}>
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="EMI" value={result.emi} />
          <StatCard title="Total interest" value={result.totalInterest} variant="soft" />
        </div>
        <GrowthChart
          title="Principal vs interest by month"
          data={result.schedule.map((row) => ({
            year: row.month,
            principal: row.principal,
            interest: row.interest,
          }))}
          series={[
            { key: "principal", label: "Principal", color: "var(--app-chart-invested)" },
            { key: "interest", label: "Interest", color: "var(--app-chart-tax)" },
          ]}
        />
        <CompositionChart
          title="Lifetime mix"
          slices={[
            { name: "Principal", value: result.totalPrincipal, color: "var(--app-chart-invested)" },
            { name: "Interest", value: result.totalInterest, color: "var(--app-chart-tax)" },
          ]}
          centerLabel="Paid"
          centerValue={result.totalPaid}
        />
        <StackedAreaChart
          title="Remaining principal vs interest paid"
          data={area}
          series={[
            { key: "remaining", label: "Remaining principal", color: "var(--app-chart-invested)" },
            { key: "interestPaid", label: "Interest paid", color: "var(--app-chart-tax)" },
          ]}
        />
      </div>
      <div className={RESULTS_RIGHT}>
        <div className="shrink-0">
          <ResultCard
            title="Results"
            items={[
              { label: "EMI", value: result.emi },
              { label: "Principal", value: result.totalPrincipal },
              { label: "Interest", value: result.totalInterest },
              { label: "Total paid", value: result.totalPaid },
            ]}
          />
        </div>
        <ScheduleTable
          caption="Amortisation"
          columns={[
            { key: "month", header: "Month" },
            { key: "emi", header: "EMI", format: "inr", align: "right" },
            { key: "principal", header: "Principal", format: "inr", align: "right" },
            { key: "interest", header: "Interest", format: "inr", align: "right" },
            { key: "balance", header: "Balance", format: "inr", align: "right" },
          ]}
          rows={result.schedule}
        />
      </div>
    </div>
  );
}

function PrepayResults({ result }: { result: PrepayResult }) {
  const origByMonth = new Map(result.originalSchedule.map((row) => [row.month, row.balance]));
  const last = Math.max(result.originalSchedule.length, result.schedule.length);
  const line = Array.from({ length: last }, (_, i) => {
    const month = i + 1;
    return {
      year: month,
      scheduled: origByMonth.get(month) ?? 0,
      prepaid: result.schedule[i]?.balance ?? 0,
    };
  });
  return (
    <div className={RESULTS_SPLIT}>
      <div className={RESULTS_LEFT}>
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="Interest saved" value={result.interestSaved} />
          <StatCard title="Total extra" value={result.totalExtra} variant="soft" />
        </div>
        <GrowthChart
          title="Outstanding: scheduled vs extra"
          data={line}
          series={[
            { key: "scheduled", label: "Scheduled", color: "var(--app-chart-tax)" },
            { key: "prepaid", label: "With extra", color: "var(--app-chart-invested)" },
          ]}
        />
        <CompareChart
          title="Interest and tenure"
          data={[
            { category: "Interest", original: result.originalInterest, prepaid: result.totalInterest },
            { category: "Months", original: result.originalSchedule.length, prepaid: result.monthsPaid },
          ]}
          series={[
            { key: "original", label: "Original", color: "var(--app-chart-tax)" },
            { key: "prepaid", label: "With extra", color: "var(--app-chart-gain)" },
          ]}
        />
      </div>
      <div className={RESULTS_RIGHT}>
        <div className="shrink-0">
          <ResultCard
            title="Results"
            items={[
              { label: "EMI", value: result.emi, hint: `Paid in ${result.monthsPaid} months` },
              { label: "Interest saved", value: result.interestSaved, hint: `${result.monthsSaved} months saved` },
              { label: "Total extra", value: result.totalExtra },
              { label: "SIP to recover original interest", value: result.recoverSip },
              { label: "SIP to recover revised interest", value: result.revisedRecoverSip },
            ]}
          />
        </div>
        <ScheduleTable
          caption="Prepaid schedule"
          columns={[
            { key: "month", header: "Month" },
            { key: "emi", header: "EMI", format: "inr", align: "right" },
            { key: "extra", header: "Extra", format: "inr", align: "right" },
            { key: "interest", header: "Interest", format: "inr", align: "right" },
            { key: "balance", header: "Balance", format: "inr", align: "right" },
          ]}
          rows={result.schedule}
        />
      </div>
    </div>
  );
}

function ExtraVsInvestResults({ result }: { result: ExtraVsInvestResult }) {
  return (
    <div className={RESULTS_SPLIT}>
      <div className={RESULTS_LEFT}>
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="Prepay saving" value={result.option1Saving} />
          <StatCard title="Invest saving" value={result.option2Saving} variant="soft" />
        </div>
        <CompareChart
          title="Prepay vs invest"
          data={[
            { category: "Interest saved", prepay: result.interestSavedVsOriginal, invest: 0 },
            { category: "Corpus", prepay: 0, invest: result.corpusAfterTax },
            { category: "Net saving", prepay: result.option1Saving, invest: result.option2Saving },
          ]}
          series={[
            { key: "prepay", label: "Prepay", color: "var(--app-chart-invested)" },
            { key: "invest", label: "Invest extra", color: "var(--app-chart-gain)" },
          ]}
        />
        <GrowthChart
          title="Outstanding vs investment"
          data={result.path.map((row) => ({
            year: row.month,
            outstanding: row.outstandingPrepay,
            investment: row.investment,
          }))}
          series={[
            { key: "outstanding", label: "Loan outstanding", color: "var(--app-chart-tax)" },
            { key: "investment", label: "Investment", color: "var(--app-chart-gain)" },
          ]}
        />
      </div>
      <div className={RESULTS_RIGHT}>
        <ResultCard
          title="Option 1 · Prepay"
          items={[
            { label: "Interest after extra", value: result.option1Interest, hint: `${result.remainingMonths.toFixed(1)} months left` },
            { label: "Net cost", value: result.option1NetCost },
            { label: "Net saving vs original", value: result.option1Saving },
          ]}
        />
        <ResultCard
          title="Option 2 · Invest"
          items={[
            { label: "Corpus after tax", value: result.corpusAfterTax },
            { label: "Net cost", value: result.option2NetCost },
            { label: "Net saving vs original", value: result.option2Saving },
          ]}
        />
      </div>
    </div>
  );
}

function RecoveryResults({ result }: { result: RecoveryResult }) {
  return (
    <div className={RESULTS_SPLIT}>
      <div className={RESULTS_LEFT}>
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="Proposed EMI" value={result.proposedEmi} />
          <StatCard title="Monthly SIP" value={result.monthlySip} variant="soft" />
        </div>
        <GrowthChart
          title="Baseline, SIP, loan + SIP"
          data={result.schedule.map((row) => ({
            year: row.year,
            baseline: row.baseline,
            sip: row.sip,
            proposed: row.loanPlusSip,
          }))}
          series={[
            { key: "baseline", label: "Baseline", color: "var(--app-chart-tax)" },
            { key: "sip", label: "SIP value", color: "var(--app-chart-gain)" },
            { key: "proposed", label: "Loan + SIP", color: "var(--app-chart-invested)" },
          ]}
        />
        <CompareChart
          title="Wealth at horizon"
          data={[
            { category: "Loan-only wealth", value: 0 },
            { category: "Loan + SIP wealth", value: result.totalAssetPlusWealth },
          ]}
          series={[{ key: "value", label: "Wealth", color: "var(--app-chart-gain)" }]}
        />
      </div>
      <div className={RESULTS_RIGHT}>
        <ResultCard
          title="Results"
          items={[
            { label: "Baseline EMI", value: result.baselineEmi },
            { label: "Baseline interest", value: result.baselineInterest },
            { label: "Proposed EMI", value: result.proposedEmi },
            { label: "Proposed interest", value: result.proposedInterest },
            { label: "Monthly SIP", value: result.monthlySip },
            { label: "SIP at horizon", value: result.sipAtHorizon },
            { label: "Asset + wealth", value: result.totalAssetPlusWealth },
            { label: "Additional wealth", value: result.additionalWealth },
          ]}
        />
      </div>
    </div>
  );
}

function VehicleResults({ result }: { result: VehicleResult }) {
  return (
    <div className={RESULTS_SPLIT}>
      <div className={RESULTS_LEFT}>
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="EMI" value={result.emi} />
          <StatCard title="Tax saved" value={result.totalTaxSaved} variant="soft" />
        </div>
        <CompareChart
          title="Financial benefit"
          data={result.compare.map((row) => ({ category: row.category, benefit: row.benefit }))}
          series={[{ key: "benefit", label: "Benefit", color: "var(--app-chart-gain)" }]}
        />
        <StackedBarChart
          title="Tax shield vs opportunity vs net"
          data={result.stacked}
          series={[
            { key: "taxShield", label: "Tax shield", color: "var(--app-chart-invested)" },
            { key: "opportunity", label: "Opportunity", color: "var(--app-chart-gain)" },
            { key: "netBenefit", label: "Net benefit", color: "var(--app-chart-tax)" },
          ]}
        />
      </div>
      <div className={RESULTS_RIGHT}>
        <div className="shrink-0">
          <ResultCard
            title="Results"
            items={[
              { label: "EMI", value: result.emi },
              { label: "Interest", value: result.totalInterest },
              { label: "Depreciation", value: result.totalDepreciation },
              { label: "Tax saved", value: result.totalTaxSaved },
              ...result.options.map((opt) => ({ label: `${opt.name} benefit`, value: opt.financialBenefit })),
            ]}
          />
        </div>
        <ScheduleTable
          caption="Depreciation"
          columns={[
            { key: "year", header: "Year" },
            { key: "value", header: "Value", format: "inr", align: "right" },
            { key: "depreciation", header: "Depreciation", format: "inr", align: "right" },
            { key: "balance", header: "Balance", format: "inr", align: "right" },
          ]}
          rows={result.depreciation}
        />
      </div>
    </div>
  );
}
