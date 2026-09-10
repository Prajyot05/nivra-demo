"use client";

import { useState } from "react";
import {
  ClientHeader,
  GrowthChart,
  MoneyInput,
  PercentInput,
  ResultCard,
  ScheduleTable,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";

export function ComingSoonCalculator({
  title,
  calculatorId,
  description,
}: {
  title: string;
  calculatorId: string;
  description?: string;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(30);
  const [amount, setAmount] = useState(10_000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  return (
    <CalculatorPage
      title={title}
      description={
        description ??
        `Clone this page. Keep these inputs/results. Copy /growth for a live example. Call POST /api/calculate/${calculatorId} — do not add math in the UI.`
      }
      form={
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] items-start gap-x-3 gap-y-3">
          <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
          <MoneyInput label="Amount" value={amount} onChange={setAmount} />
          <YearInput value={years} onChange={setYears} />
          <PercentInput label="Return (%)" value={rate} onChange={setRate} />
        </div>
      }
      results={
        <div className="grid gap-4 lg:grid-cols-2">
          <ResultCard
            title="Results (wire the API next)"
            items={[
              { label: "Invested", value: 0 },
              { label: "Maturity", value: 0 },
              { label: "Gain", value: 0 },
              { label: "Tax", value: 0 },
            ]}
          />
          <GrowthChart
            data={[{ year: 0, corpus: 0 }, { year: years, corpus: 0 }]}
            series={[{ key: "corpus", label: "Corpus", color: "#0f172a" }]}
          />
          <div className="lg:col-span-2">
            <ScheduleTable
              caption="Yearly schedule"
              columns={[
                { key: "year", header: "Year", sticky: true },
                { key: "monthly", header: "SIP", format: "inr", align: "right", tone: "std" },
                { key: "yearEnd", header: "Year-end", format: "inr", align: "right", tone: "step" },
              ]}
              rows={[]}
            />
          </div>
        </div>
      }
    />
  );
}
