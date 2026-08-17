"use client";

import { useState } from "react";
import {
  CalculatorPage,
  ClientHeader,
  GrowthChart,
  ModeTabs,
  MoneyInput,
  PercentInput,
  ResultCard,
  ScheduleTable,
  YearInput,
} from "@nivra/ui";

export function ComingSoonCalculator({
  title,
  calculatorId,
  modes,
  description,
}: {
  title: string;
  calculatorId: string;
  modes: Array<{ id: string; label: string }>;
  description?: string;
}) {
  const [mode, setMode] = useState(modes[0]?.id ?? "");
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
        `Clone this page. Keep these inputs/results. Call POST /api/calculate/${calculatorId} — do not add math in the UI.`
      }
      header={<ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />}
      modes={<ModeTabs tabs={modes} value={mode} onChange={setMode} />}
      form={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                { key: "year", header: "Year" },
                { key: "monthly", header: "SIP", format: "inr", align: "right" },
                { key: "yearEnd", header: "Year-end", format: "inr", align: "right" },
              ]}
              rows={[]}
            />
          </div>
        </div>
      }
    />
  );
}
