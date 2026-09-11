"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateCalculatorReport, type PdfTableData } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  ClientHeader,
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
  StackedAreaChart,
  StackedBarChart,
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
  { id: "emi", label: "EMI" },
  { id: "prepay", label: "Prepay" },
  { id: "extra-vs-invest", label: "Extra vs invest" },
  { id: "recovery", label: "Interest recovery" },
  { id: "vehicle", label: "Vehicle" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);
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
  const [mode] = useCalculatorMode(MODE_IDS, "emi");
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

  const handleDownload = () => {
    if (!result) return;
    const tables: PdfTableData[] = [];
    const modeLabel =
      MODES.find((m) => m.id === mode)?.label ??
      MODES.find((m) => m.id === mode)?.label ??
      String(mode);

    let headlines = [
      { label: "Monthly EMI", value: result.emi ?? 0, highlight: true as const, hint: modeLabel },
      { label: "Total Interest", value: result.totalInterest ?? result.originalInterest ?? 0, hint: "Lifetime interest cost" },
    ];
    let metrics: Array<{ label: string; value: string | number; currency?: boolean; danger?: boolean }> = [
      { label: "Principal", value: result.totalPrincipal ?? principal },
      { label: "Tenure", value: `${years} yrs`, currency: false },
      { label: "Rate", value: `${interest}%`, currency: false },
      { label: "Total Paid", value: result.totalPaid ?? 0 },
    ];
    const assumptions: Array<[string, string | number, boolean?]> = [
      ["Mode", modeLabel],
    ];

    if (mode === "emi") {
      assumptions.push(
        ["Principal", principal, true],
        ["Years", years],
        ["Interest", `${interest}%`],
      );
      if (result.schedule && Array.isArray(result.schedule)) {
        const rows = result.schedule as Array<Record<string, number>>;
        const keys = Object.keys(rows[0] || {});
        tables.push({
          title: "Amortisation Schedule",
          head: keys.map((k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())),
          body: rows.map((row) => keys.map((k) => row[k])),
          columnAlignments: keys.map((_, i) => (i === 0 ? "left" : "right")),
          currencyColumns: keys.map((k, i) => (k === "month" || k === "year" ? -1 : i)).filter((i) => i >= 0),
        });
      }
    } else if (mode === "prepay" && result.schedule) {
      headlines = [
        { label: "Interest Saved", value: result.interestSaved ?? 0, highlight: true, hint: `${result.monthsSaved ?? 0} months saved` },
        { label: "Total Extra Paid", value: result.totalExtra ?? 0, hint: "Prepayment outlay" },
      ];
      metrics = [
        { label: "Original Interest", value: result.originalInterest ?? 0 },
        { label: "Recover SIP", value: result.recoverSip ?? 0 },
        { label: "Months Paid", value: String(result.monthsPaid ?? 0), currency: false },
        { label: "EMI", value: result.emi ?? 0 },
      ];
      assumptions.push(
        ["Principal", prepayPrincipal, true],
        ["Years", prepayYears],
        ["Rate", `${prepayRate}%`],
        ["Yearly Extra", yearlyExtra, true],
      );
      tables.push({
        title: "Prepaid Schedule",
        head: ["Month", "EMI", "Extra", "Interest", "Balance"],
        body: result.schedule.map((row: { month: number; emi: number; extra?: number; interest: number; balance: number }) => [
          row.month,
          row.emi,
          row.extra ?? 0,
          row.interest,
          row.balance,
        ]),
        columnAlignments: ["left", "right", "right", "right", "right"],
        currencyColumns: [1, 2, 3, 4],
      });
    } else if (mode === "extra-vs-invest") {
      headlines = [
        { label: "Prepay Saving", value: result.option1Saving ?? 0, highlight: true, hint: "Pay down loan early" },
        { label: "Invest Saving", value: result.option2Saving ?? 0, hint: "Deploy surplus instead" },
      ];
      metrics = [
        { label: "EMI", value: result.emi ?? 0 },
        { label: "Original Interest", value: result.originalInterest ?? 0 },
        { label: "Corpus After Tax", value: result.corpusAfterTax ?? 0 },
        { label: "Remaining Months", value: String(result.remainingMonths ?? 0), currency: false },
      ];
      assumptions.push(
        ["Principal", vsPrincipal, true],
        ["Years", vsYears],
        ["Rate", `${vsRate}%`],
        ["Extra Amount", extraAmount, true],
      );
    } else if (mode === "recovery") {
      headlines = [
        { label: "Proposed EMI", value: result.proposedEmi ?? 0, highlight: true, hint: `${proposedYears} year tenure` },
        { label: "Monthly SIP", value: result.monthlySip ?? 0, hint: "Parallel wealth build" },
      ];
      metrics = [
        { label: "Baseline EMI", value: result.baselineEmi ?? 0 },
        { label: "Wealth Created", value: result.wealthCreated ?? 0 },
        { label: "Additional Wealth", value: result.additionalWealth ?? 0 },
        { label: "Savings vs Baseline", value: result.savingsVsBaselinePaid ?? 0 },
      ];
      assumptions.push(
        ["Principal", recPrincipal, true],
        ["Baseline Years", recYears],
        ["Proposed Years", proposedYears],
        ["Rate", `${recRate}%`],
      );
      if (result.schedule) {
        const recoveryRows = result.schedule as Array<{
          year: number;
          baseline: number;
          proposed: number;
          sip: number;
          loanPlusSip: number;
        }>;
        tables.push({
          title: "Recovery Path",
          head: ["Year", "Baseline", "Proposed", "SIP", "Loan+SIP"],
          body: recoveryRows.map((row) => [
            row.year,
            row.baseline,
            row.proposed,
            row.sip,
            row.loanPlusSip,
          ]),
          columnAlignments: ["left", "right", "right", "right", "right"],
          currencyColumns: [1, 2, 3, 4],
        });
      }
    } else if (mode === "vehicle" && result.depreciation) {
      headlines = [
        { label: "EMI", value: result.emi ?? 0, highlight: true, hint: "Vehicle loan EMI" },
        { label: "Tax Saved", value: result.totalTaxSaved ?? 0, hint: "Depreciation shield" },
      ];
      metrics = [
        { label: "Total Interest", value: result.totalInterest ?? 0 },
        { label: "Total Depreciation", value: result.totalDepreciation ?? 0 },
        { label: "On-Road Price", value: onRoad },
        { label: "Loan Amount", value: vehLoan },
      ];
      assumptions.push(
        ["On-Road", onRoad, true],
        ["Loan", vehLoan, true],
        ["Rate", `${vehRate}%`],
        ["Years", vehYears],
      );
      tables.push({
        title: "Depreciation Schedule",
        head: ["Year", "Value", "Depreciation", "Balance"],
        body: result.depreciation.map((row) => [row.year, row.value, row.depreciation, row.balance]),
        columnAlignments: ["left", "right", "right", "right"],
        currencyColumns: [1, 2, 3],
      });
    }

    generateCalculatorReport({
      title: "Loan Analysis Dossier",
      subtitle: `${modeLabel} · ${name}`,
      clientName: name,
      age,
      status: "Validated Model",
      filename: `loans-${name}`,
      headlines,
      metrics,
      assumptions,
      tables,
      playbook: playbookForPdf(
        mode === "prepay" || mode === "extra-vs-invest" ? "loan-extra" : "loan-emi",
      ),
    });
  };

  return (
    <CalculatorPage
      title={getCalculatorPageTitle("/loans", mode)}
      description="Monthly EMI for a home or personal loan — principal, tenure, and interest rate."
      actions={
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] transition-colors"
          onClick={handleDownload}
          title="Download Report"
        >
          <Download className="size-4" />
        </Button>
      }
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
          {result && mode === "emi" && Array.isArray(result.schedule) ? (
            <EmiResults result={result} />
          ) : null}
          {result && mode === "prepay" && Array.isArray(result.originalSchedule) ? (
            <PrepayResults result={result as PrepayResult} />
          ) : null}
          {result && mode === "extra-vs-invest" && Array.isArray(result.path) ? (
            <ExtraVsInvestResults result={result as ExtraVsInvestResult} />
          ) : null}
          {result && mode === "recovery" && result.baselineEmi != null ? (
            <RecoveryResults result={result as RecoveryResult} />
          ) : null}
          {result && mode === "vehicle" && Array.isArray(result.depreciation) ? (
            <VehicleResults result={result as VehicleResult} />
          ) : null}
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
    <div className="flex flex-col gap-4">
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
        </div>
      </div>
      <ScheduleTable
        caption="Amortisation"
        zebra
        columns={[
          { key: "month", header: "Month", sticky: true },
          { key: "emi", header: "EMI", format: "inr", align: "right", tone: "std" },
          { key: "principal", header: "Principal", format: "inr", align: "right", tone: "std" },
          { key: "interest", header: "Interest", format: "inr", align: "right", tone: "warn" },
          { key: "balance", header: "Balance", format: "inr", align: "right", tone: "step" },
        ]}
        rows={result.schedule}
      />
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
    <div className="flex flex-col gap-4">
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
        </div>
      </div>
      <ScheduleTable
        caption="Prepaid schedule"
        zebra
        columns={[
          { key: "month", header: "Month", sticky: true },
          { key: "emi", header: "EMI", format: "inr", align: "right", tone: "std" },
          { key: "extra", header: "Extra", format: "inr", align: "right", tone: "warn" },
          { key: "interest", header: "Interest", format: "inr", align: "right", tone: "warn" },
          { key: "balance", header: "Balance", format: "inr", align: "right", tone: "step" },
        ]}
        rows={result.schedule}
      />
    </div>
  );
}

function ExtraVsInvestResults({ result }: { result: ExtraVsInvestResult }) {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}

function RecoveryResults({ result }: { result: RecoveryResult }) {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}

function VehicleResults({ result }: { result: VehicleResult }) {
  return (
    <div className="flex flex-col gap-4">
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
        </div>
      </div>
      <ScheduleTable
        caption="Depreciation"
        zebra
        columns={[
          { key: "year", header: "Year", sticky: true },
          { key: "value", header: "Value", format: "inr", align: "right", tone: "std" },
          {
            key: "depreciation",
            header: "Depreciation",
            format: "inr",
            align: "right",
            tone: "warn",
          },
          { key: "balance", header: "Balance", format: "inr", align: "right", tone: "step" },
        ]}
        rows={result.depreciation}
      />
    </div>
  );
}
