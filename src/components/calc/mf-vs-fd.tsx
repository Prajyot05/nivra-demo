"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateCalculatorReport } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  ClientHeader,
  CompareChart,
  CompositionChart,
  MoneyInput,
  PercentInput,
  ResultCard,
  StatCard,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] items-start gap-x-2 gap-y-2";

type Leg = {
  invested: number;
  gain: number;
  tax: number;
  net: number;
  preTax: number;
  postTax: number;
};

type MfFdResult = {
  mf: Leg;
  fd: Leg;
  difference: number;
  mfAdvantage: number;
  fdAdvantage: number;
  compare: Array<{ category: string; mf: number; fd: number }>;
};

export function MfVsFd() {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(30);
  const [amount, setAmount] = useState(1_000_000_000);
  const [days, setDays] = useState(15);
  const [mfReturn, setMfReturn] = useState(5);
  const [fdReturn, setFdReturn] = useState(3);
  const [mfTax, setMfTax] = useState(20);
  const [fdTax, setFdTax] = useState(25);

  const input = useMemo(
    () => ({
      clientName: name,
      age,
      amount,
      days,
      mfReturnPct: mfReturn,
      fdReturnPct: fdReturn,
      mfTaxPct: mfTax,
      fdTaxPct: fdTax,
    }),
    [name, age, amount, days, mfReturn, fdReturn, mfTax, fdTax],
  );

  const { result, error, loading } = useCalculate<MfFdResult>("mf-fd", input);

  const handleDownload = () => {
    if (!result) return;
    const winner = result.mfAdvantage >= result.fdAdvantage ? "MF" : "FD";
    generateCalculatorReport({
      title: "MF vs FD Comparison Dossier",
      subtitle: `Short-horizon post-tax analysis · ${days} day holding`,
      clientName: name,
      age,
      status: `${winner} Preferred`,
      filename: `mf-vs-fd-${name}`,
      headlines: [
        { label: "MF Post-Tax Value", value: result.mf.postTax, highlight: true, hint: "Mutual fund after tax" },
        { label: "FD Post-Tax Value", value: result.fd.postTax, hint: "Fixed deposit after tax" },
      ],
      metrics: [
        { label: "Principal", value: amount },
        { label: "MF Net Gain", value: result.mf.net },
        { label: "FD Net Gain", value: result.fd.net },
        { label: "MF Advantage", value: result.difference, danger: result.difference < 0 },
      ],
      assumptions: [
        ["Amount", amount, true],
        ["Holding Period", `${days} days`],
        ["MF Return", `${mfReturn}%`],
        ["FD Return", `${fdReturn}%`],
        ["MF Tax", `${mfTax}%`],
        ["FD Tax", `${fdTax}%`],
      ],
      tables: [
        {
          title: "Post-Tax Return Breakdown",
          head: ["Category", "Pre-Tax", "Tax", "Net", "Post-Tax Value"],
          body: [
            ["Mutual Fund", result.mf.preTax, result.mf.tax, result.mf.net, result.mf.postTax],
            ["Fixed Deposit", result.fd.preTax, result.fd.tax, result.fd.net, result.fd.postTax],
          ],
          columnAlignments: ["left", "right", "right", "right", "right"],
          currencyColumns: [1, 2, 3, 4],
          highlightRows: [result.mfAdvantage >= result.fdAdvantage ? 0 : 1],
        },
      ],
      playbook: playbookForPdf("mf-vs-fd"),
    });
  };

  return (
    <CalculatorPage
      title="MF vs FD"
      description="Short-horizon post-tax compare from Unprotected MF vs FD v1."
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
        <div className={FORM_GRID}>
          <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
          <MoneyInput label="Amount" value={amount} onChange={setAmount} />
          <YearInput label="Days" value={days} min={1} max={36500} onChange={setDays} />
          <PercentInput label="MF return (%)" value={mfReturn} onChange={setMfReturn} />
          <PercentInput label="FD return (%)" value={fdReturn} onChange={setFdReturn} />
          <PercentInput label="MF tax (%)" value={mfTax} onChange={setMfTax} />
          <PercentInput label="FD tax (%)" value={fdTax} onChange={setFdTax} />
        </div>
      }
      results={
        <div className="flex flex-col gap-3">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p> : null}
          {result ? (
            <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
              <div className="flex flex-col gap-3 lg:col-span-7">
                <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
                  <StatCard title="MF post-tax" value={result.mf.postTax} />
                  <StatCard title="FD post-tax" value={result.fd.postTax} variant="soft" />
                </div>
                <CompareChart
                  title="MF vs FD"
                  data={result.compare}
                  series={[
                    { key: "mf", label: "Mutual fund", color: "var(--app-chart-gain)" },
                    { key: "fd", label: "Fixed deposit", color: "var(--app-chart-invested)" },
                  ]}
                />
                <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                  <CompositionChart
                    title="MF mix"
                    slices={[
                      { name: "Invested", value: result.mf.invested, color: "var(--app-chart-invested)" },
                      { name: "Gain", value: result.mf.gain, color: "var(--app-chart-gain)" },
                      { name: "Tax", value: result.mf.tax, color: "var(--app-chart-tax)" },
                    ]}
                    centerLabel="Net"
                    centerValue={result.mf.net}
                  />
                  <CompositionChart
                    title="FD mix"
                    slices={[
                      { name: "Invested", value: result.fd.invested, color: "var(--app-chart-invested)" },
                      { name: "Gain", value: result.fd.gain, color: "var(--app-chart-gain)" },
                      { name: "Tax", value: result.fd.tax, color: "var(--app-chart-tax)" },
                    ]}
                    centerLabel="Net"
                    centerValue={result.fd.net}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:col-span-5">
                <ResultCard
                  title="Mutual fund"
                  items={[
                    { label: "Pre-tax return", value: result.mf.preTax },
                    { label: "Tax", value: result.mf.tax },
                    { label: "Post-tax return", value: result.mf.postTax },
                    { label: "Net (amount + post-tax)", value: result.mf.net },
                  ]}
                />
                <ResultCard
                  title="Fixed deposit"
                  items={[
                    { label: "Pre-tax return", value: result.fd.preTax },
                    { label: "Tax", value: result.fd.tax },
                    { label: "Post-tax return", value: result.fd.postTax },
                    { label: "Net (amount + post-tax)", value: result.fd.net },
                    {
                      label: "Advantage",
                      value: result.mfAdvantage || result.fdAdvantage,
                      hint: result.mfAdvantage > 0 ? "MF ahead" : result.fdAdvantage > 0 ? "FD ahead" : "Tied",
                    },
                  ]}
                />
              </div>
            </div>
          ) : null}
        </div>
      }
    />
  );
}
