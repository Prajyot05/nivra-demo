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
  { id: "irr", label: "IRR" },
  { id: "switch", label: "Term + invest" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);
type IrrResult = {
  totalPremium: number;
  maturity: number;
  gain: number;
  tax: number;
  net: number;
  xirr: number;
  payTermRate: number;
};

type TpResult = {
  remainingPremiums: number;
  keep: { totalPremium: number; maturity: number; tax: number; net: number; irr: number };
  switch: { surrenderValue: number; termCost: number; investMaturity: number; irr: number; totalPaidToDate: number };
  compare: Array<{ category: string; keep: number; switch: number }>;
};

export function InsuranceCalculator() {
  const [mode] = useCalculatorMode(MODE_IDS, "irr");
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState(42);

  const [premium, setPremium] = useState(200_000);
  const [payTerm, setPayTerm] = useState(5);
  const [corpusAtPayEnd, setCorpusAtPayEnd] = useState(1_160_000);
  const [policyTerm, setPolicyTerm] = useState(20);
  const [ret, setRet] = useState(11);
  const [tax, setTax] = useState(12.5);

  const [tpName, setTpName] = useState("Lucky Singh");
  const [tpAge, setTpAge] = useState(51);
  const [tpPremium, setTpPremium] = useState(300_000);
  const [tpPay, setTpPay] = useState(5);
  const [yearsPaid, setYearsPaid] = useState(3);
  const [tpPol, setTpPol] = useState(20);
  const [yearsLeft, setYearsLeft] = useState(11);
  const [maturity, setMaturity] = useState(5_000_000);
  const [tpTax, setTpTax] = useState(20);
  const [surrender, setSurrender] = useState(3_000_000);
  const [termPrem, setTermPrem] = useState(10_000);
  const [termYears, setTermYears] = useState(11);
  const [tpRet, setTpRet] = useState(11.88);

  const input = useMemo(() => {
    if (mode === "irr") {
      return {
        clientName: name,
        age,
        premium,
        payTerm,
        corpusAtPayEnd,
        policyTerm,
        returnPct: ret,
        taxPct: tax,
      };
    }
    return {
      clientName: tpName,
      age: tpAge,
      premium: tpPremium,
      payTerm: tpPay,
      yearsPaid,
      policyTerm: tpPol,
      yearsToMaturity: yearsLeft,
      maturityValue: maturity,
      taxPct: tpTax,
      surrenderValue: surrender,
      termPremium: termPrem,
      termYears,
      returnPct: tpRet,
    };
  }, [
    mode, name, age, premium, payTerm, corpusAtPayEnd, policyTerm, ret, tax,
    tpName, tpAge, tpPremium, tpPay, yearsPaid, tpPol, yearsLeft, maturity, tpTax, surrender, termPrem, termYears, tpRet,
  ]);

  const calculatorId = mode === "irr" ? "insurance-irr" : "insurance-tp";
  const { result, error, loading } = useCalculate<IrrResult & Partial<TpResult>>(calculatorId, input);

  const handleDownload = () => {
    if (!result) return;
    const client = mode === "irr" ? name : tpName;
    const clientAge = mode === "irr" ? age : tpAge;
    const tables: PdfTableData[] = [];

    if (mode === "irr") {
      const res = result as IrrResult;
      tables.push({
        title: "Policy Return Summary",
        head: ["Premiums Paid", "Maturity", "Gain", "Tax", "Net After Tax", "XIRR"],
        body: [[res.totalPremium, res.maturity, res.gain, res.tax, res.net, `${(res.xirr * 100).toFixed(2)}%`]],
        columnAlignments: ["right", "right", "right", "right", "right", "right"],
        currencyColumns: [0, 1, 2, 3, 4],
      });
      generateCalculatorReport({
        title: "Insurance Return Dossier",
        subtitle: `Policy IRR analysis for ${client}`,
        clientName: client,
        age: clientAge,
        status: "Validated Model",
        filename: `insurance-${client}`,
        headlines: [
          { label: "Maturity Value", value: res.maturity, highlight: true, hint: `${policyTerm} year policy term` },
          { label: "Net After Tax", value: res.net, hint: `XIRR ${(res.xirr * 100).toFixed(2)}%` },
        ],
        metrics: [
          { label: "Total Premiums", value: res.totalPremium },
          { label: "Pre-Tax Gain", value: res.gain },
          { label: "Tax", value: res.tax },
          { label: "Pay-Term Rate", value: `${(res.payTermRate * 100).toFixed(2)}%`, currency: false },
        ],
        assumptions: [
          ["Mode", "Policy IRR"],
          ["Annual Premium", premium, true],
          ["Pay Term", `${payTerm} yrs`],
          ["Policy Term", `${policyTerm} yrs`],
          ["Corpus at Pay End", corpusAtPayEnd, true],
          ["Assumed Return", `${ret}%`],
          ["Tax", `${tax}%`],
        ],
        tables,
        playbook: playbookForPdf("insurance"),
      });
      return;
    }

    const res = result as TpResult;
    tables.push({
      title: "Keep vs Switch Summary",
      head: ["Option", "Maturity / Corpus", "Term Cost", "Tax", "Net"],
      body: [
        ["Keep", res.keep.maturity, 0, res.keep.tax, res.keep.net],
        ["Switch", res.switch.investMaturity, res.switch.termCost, 0, res.switch.investMaturity],
      ],
      columnAlignments: ["left", "right", "right", "right", "right"],
      currencyColumns: [1, 2, 3, 4],
      highlightRows: [res.switch.investMaturity >= res.keep.net ? 1 : 0],
    });

    generateCalculatorReport({
      title: "Insurance Keep vs Switch Dossier",
      subtitle: `Surrender → term + invest analysis for ${client}`,
      clientName: client,
      age: clientAge,
      status: "Validated Model",
      filename: `insurance-${client}`,
      headlines: [
        { label: "Keep (Net)", value: res.keep.net, highlight: true, hint: `IRR ${(res.keep.irr * 100).toFixed(2)}%` },
        { label: "Switch Corpus", value: res.switch.investMaturity, hint: `Term cost ${Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(res.switch.termCost))}` },
      ],
      metrics: [
        { label: "Surrender Value", value: res.switch.surrenderValue },
        { label: "Remaining Premiums", value: res.remainingPremiums },
        { label: "Keep Tax", value: res.keep.tax },
        { label: "Paid to Date", value: res.switch.totalPaidToDate },
      ],
      assumptions: [
        ["Mode", "Keep vs Switch"],
        ["Premium", tpPremium, true],
        ["Years Paid", yearsPaid],
        ["Years to Maturity", yearsLeft],
        ["Maturity Value", maturity, true],
        ["Surrender", surrender, true],
        ["Invest Return", `${tpRet}%`],
      ],
      tables,
      playbook: playbookForPdf("insurance"),
    });
  };

  return (
    <CalculatorPage
      title={getCalculatorPageTitle("/insurance", mode)}
      description="Policy IRR and surrender → term + invest from Unprotected insurance sheets."
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
        mode === "irr" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Annual premium" value={premium} onChange={setPremium} />
            <YearInput label="Pay term" value={payTerm} min={1} max={50} onChange={setPayTerm} />
            <MoneyInput label="Pay-end corpus" value={corpusAtPayEnd} onChange={setCorpusAtPayEnd} />
            <YearInput label="Policy term" value={policyTerm} min={1} max={50} onChange={setPolicyTerm} />
            <PercentInput label="Return (%)" value={ret} onChange={setRet} />
            <PercentInput label="Tax (%)" value={tax} onChange={setTax} />
          </div>
        ) : (
          <div className={FORM_GRID}>
            <ClientHeader name={tpName} age={tpAge} onNameChange={setTpName} onAgeChange={setTpAge} />
            <MoneyInput label="Annual premium" value={tpPremium} onChange={setTpPremium} />
            <YearInput label="Pay term" value={tpPay} min={1} max={50} onChange={setTpPay} />
            <YearInput label="Years paid" value={yearsPaid} min={0} max={50} onChange={setYearsPaid} />
            <YearInput label="Policy term" value={tpPol} min={1} max={50} onChange={setTpPol} />
            <YearInput label="Yrs to maturity" value={yearsLeft} min={1} max={50} onChange={setYearsLeft} />
            <MoneyInput label="Maturity value" value={maturity} onChange={setMaturity} />
            <PercentInput label="Tax (%)" value={tpTax} onChange={setTpTax} />
            <MoneyInput label="Surrender value" value={surrender} onChange={setSurrender} />
            <MoneyInput label="Term premium" value={termPrem} onChange={setTermPrem} />
            <YearInput label="Term years" value={termYears} min={1} max={50} onChange={setTermYears} />
            <PercentInput label="Invest ret. (%)" value={tpRet} onChange={setTpRet} />
          </div>
        )
      }
      results={
        <div className="flex flex-col gap-3">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p> : null}
          {mode === "irr" && result && "maturity" in result && "xirr" in result ? (
            <IrrResults result={result as IrrResult} />
          ) : null}
          {mode === "switch" && result && "keep" in result ? (
            <TpResults result={result as TpResult} />
          ) : null}
        </div>
      }
    />
  );
}

function IrrResults({ result }: { result: IrrResult }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
      <div className="flex flex-col gap-3 lg:col-span-7">
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="Maturity" value={result.maturity} />
          <StatCard title="Net after tax" value={result.net} variant="soft" />
        </div>
        <CompositionChart
          title="Premium, gain, tax"
          slices={[
            { name: "Premium paid", value: result.totalPremium, color: "var(--app-chart-invested)" },
            { name: "Gain", value: result.gain, color: "var(--app-chart-gain)" },
            { name: "Tax", value: result.tax, color: "var(--app-chart-tax)" },
          ]}
          centerLabel="Maturity"
          centerValue={result.maturity}
        />
        <CompareChart
          title="Cash in vs cash out"
          data={[{ category: "Policy", in: result.maturity, out: result.totalPremium }]}
          series={[
            { key: "out", label: "Premiums", color: "var(--app-chart-tax)" },
            { key: "in", label: "Maturity", color: "var(--app-chart-gain)" },
          ]}
        />
      </div>
      <div className="flex flex-col gap-3 lg:col-span-5">
        <ResultCard
          title="Results"
          items={[
            { label: "Premiums paid", value: result.totalPremium },
            { label: "Maturity", value: result.maturity },
            { label: "Gain", value: result.gain },
            { label: "Tax", value: result.tax },
            { label: "Net after tax", value: result.net, hint: `XIRR ${(result.xirr * 100).toFixed(2)}%` },
          ]}
        />
      </div>
    </div>
  );
}

function TpResults({ result }: { result: TpResult }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
      <div className="flex flex-col gap-3 lg:col-span-7">
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="Keep (net)" value={result.keep.net} />
          <StatCard title="Switch corpus" value={result.switch.investMaturity} variant="soft" />
        </div>
        <CompareChart
          title="Keep vs surrender + term + invest"
          data={result.compare}
          series={[
            { key: "keep", label: "Keep policy", color: "var(--app-chart-tax)" },
            { key: "switch", label: "Term + invest", color: "var(--app-chart-gain)" },
          ]}
        />
        <CompositionChart
          title="Switch mix"
          slices={[
            { name: "Term cost", value: result.switch.termCost, color: "var(--app-chart-tax)" },
            { name: "Invested (surrender)", value: result.switch.surrenderValue, color: "var(--app-chart-invested)" },
          ]}
          centerLabel="Corpus"
          centerValue={result.switch.investMaturity}
        />
        <GrowthChart
          title="Switched corpus vs years"
          data={[
            { year: 0, corpus: result.switch.surrenderValue },
            { year: result.remainingPremiums || 1, corpus: result.switch.investMaturity },
          ]}
          series={[{ key: "corpus", label: "Switched corpus", color: "var(--app-chart-gain)" }]}
        />
      </div>
      <div className="flex flex-col gap-3 lg:col-span-5">
        <ResultCard
          title="Keep"
          items={[
            { label: "Maturity", value: result.keep.maturity },
            { label: "Tax", value: result.keep.tax },
            { label: "Net", value: result.keep.net, hint: `IRR ${(result.keep.irr * 100).toFixed(2)}%` },
          ]}
        />
        <ResultCard
          title="Switch"
          items={[
            { label: "Surrender", value: result.switch.surrenderValue },
            { label: "Term cost", value: result.switch.termCost },
            { label: "Invested corpus", value: result.switch.investMaturity, hint: `IRR ${(result.switch.irr * 100).toFixed(2)}%` },
          ]}
        />
      </div>
    </div>
  );
}
