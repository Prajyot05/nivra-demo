"use client";

import { forwardRef } from "react";
import { CalculatorInputs, CalculationResults, calculateFV } from "@/utils/calculator";
import { formatIndianCurrency } from "@/lib/utils";
import { chunkArray } from "@/lib/pdf-export";
import { Bar, BarChart, CartesianGrid, LabelList } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  ChartBarLabelSIP,
  ChartBarLabelStepUp,
  comparisonChartData,
} from "@/components/chart-bar-labels";

const chartConfig = {
  Standard: { label: "SIP", color: "#195b70" },
  StepUp: { label: "Step-Up SIP", color: "#f4d5cc" },
} satisfies ChartConfig;

function ReportCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1a5163]/25 bg-[#f7fafb] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1a5163]/65">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-[#1a5163]">{value}</div>
    </div>
  );
}

function SipPanel({
  title,
  accent,
  monthlyLabel,
  monthlyValue,
  monthlySub,
  stats,
}: {
  title: string;
  accent: string;
  monthlyLabel: string;
  monthlyValue: string;
  monthlySub?: string;
  stats: { label: string; value: string }[];
}) {
  return (
    <div className={`rounded-xl border-[1.5px] border-[#1a5163] p-4 ${accent}`}>
      <h3 className="mb-3 text-center text-sm font-bold text-[#a47b2c]">{title}</h3>
      <div className="mb-3 rounded-xl border border-[#9c781d] bg-[#af8821] px-3 py-3 text-center text-white">
        <div className="text-xs font-medium">{monthlyLabel}</div>
        <div className="mt-1 text-lg font-bold">{monthlyValue}</div>
        {monthlySub && <div className="mt-1 text-[10px] opacity-90">{monthlySub}</div>}
      </div>
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-[#1a5163]/30 bg-[#d9ebd9] px-3 py-2 text-center">
            <div className="text-[10px] font-semibold text-[#1a5163]">{s.label}</div>
            <div className="text-sm font-bold text-[#1a5163]">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABLE_ROWS_PER_PAGE = 8;

function YearlyTableSection({
  rows,
  showTitle,
  chunkIndex,
}: {
  rows: CalculationResults["yearlyData"];
  showTitle: boolean;
  chunkIndex: number;
}) {
  return (
    <section data-pdf-section className="bg-white px-8 py-2">
      {showTitle ? (
        <h2 className="mb-3 border-b-2 border-[#1a5163]/20 pb-1 text-sm font-bold uppercase tracking-wide text-[#1a5163]">
          Investment Performance — Value by Year
        </h2>
      ) : (
        <p className="mb-2 text-xs font-semibold text-[#1a5163]/70">
          Investment Performance — Value by Year (continued)
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-[#1a5163]/30">
        <table className="w-full text-xs">
          <thead className="bg-[#1a5163] text-white">
            <tr>
              <th className="px-3 py-2 font-semibold">Year</th>
              <th className="border-l border-white/20 px-3 py-2 font-semibold text-right">Std. Monthly SIP</th>
              <th className="px-3 py-2 font-semibold text-right">Std. Year-End Value</th>
              <th className="border-l border-white/20 px-3 py-2 font-semibold text-right">Step-Up Monthly SIP</th>
              <th className="px-3 py-2 font-semibold text-right">Step-Up Year-End Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${chunkIndex}-${row.year}`} className={i % 2 === 0 ? "bg-white" : "bg-[#f7fafb]"}>
                <td className="px-3 py-1.5 text-center font-medium">{row.year}</td>
                <td className="border-l border-gray-200 px-3 py-1.5 text-right">{formatIndianCurrency(row.sipAmount)}</td>
                <td className="px-3 py-1.5 text-right">{formatIndianCurrency(row.sipBalance)}</td>
                <td className="border-l border-gray-200 px-3 py-1.5 text-right">{formatIndianCurrency(row.stepUpAmount)}</td>
                <td className="px-3 py-1.5 text-right">{formatIndianCurrency(row.stepUpBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const PdfReport = forwardRef<
  HTMLDivElement,
  {
    name: string;
    age: string | number;
    inputs: CalculatorInputs;
    results: CalculationResults;
  }
>(function PdfReport({ name, age, inputs, results }, ref) {
  const inflationAdjustedGoal = calculateFV(inputs.inflationRate, inputs.years, inputs.goalAmount);
  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fmt = (n: number) => formatIndianCurrency(n).replace("₹", "Rs. ");
  const yearlyChunks = chunkArray(results.yearlyData, TABLE_ROWS_PER_PAGE);

  return (
    <div ref={ref} className="bg-white text-gray-900" style={{ width: 794 }}>

      {/* Header — teal banner with white text (inline colors + forced print rendering for reliable PDF capture) */}
<section
  data-pdf-section
  className="relative overflow-hidden px-8 py-5"
  style={{
    width: 794,
    backgroundColor: "#123f4d",
    color: "#ffffff",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
    colorAdjust: "exact",
  }}
>
  {/* Solid paint layer — guarantees the fill survives canvas/print capture even if the
      section's own background is stripped */}
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: "#123f4d",
      zIndex: 0,
    }}
  />

  <div className="relative z-10 flex items-start justify-between gap-4">
    <div>
      <h1
        className="text-2xl font-bold tracking-tight"
        style={{ color: "#ffffff", margin: 0 }}
      >
        Goal SIP Planner
      </h1>
      <p className="mt-1 text-sm" style={{ color: "#eaf3f6", margin: 0 }}>
        Personalised Investment Plan Report
      </p>
    </div>
    <div className="text-right text-xs">
      <p className="font-semibold" style={{ color: "#ffffff", margin: 0 }}>
        Nivra Fintech
      </p>
      <p className="mt-1" style={{ color: "#eaf3f6", margin: 0 }}>
        {reportDate}
      </p>
    </div>
  </div>

  <div
    className="relative z-10 mt-4 rounded-lg px-4 py-2 text-sm"
    style={{
      backgroundColor: "#1a5163",
      color: "#ffffff",
      border: "1px solid rgba(255,255,255,0.25)",
    }}
  >
    <span className="font-medium" style={{ color: "#ffffff" }}>
      Prepared for:
    </span>{" "}
    <span style={{ color: "#ffffff" }}>{name}</span>
    <span style={{ color: "#ffffff", opacity: 0.6, margin: "0 8px" }}>|</span>
    <span className="font-medium" style={{ color: "#ffffff" }}>
      Age:
    </span>{" "}
    <span style={{ color: "#ffffff" }}>{age}</span>
  </div>
</section>
      {/* Assumptions + goal summary */}
      <section data-pdf-section className="space-y-6 px-8 py-6">
        <div>
          <h2 className="mb-3 border-b-2 border-[#1a5163]/20 pb-1 text-sm font-bold uppercase tracking-wide text-[#1a5163]">
            Financial Assumptions
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <ReportCell label="Target Goal (Today)" value={fmt(inputs.goalAmount)} />
            <ReportCell label="Future Goal (Inflation Adj.)" value={fmt(inflationAdjustedGoal)} />
            <ReportCell label="Tenure" value={`${inputs.years} Years`} />
            <ReportCell label="Expected Return" value={`${(inputs.expectedReturnRate * 100).toFixed(2)}%`} />
            <ReportCell label="Inflation Rate" value={`${(inputs.inflationRate * 100).toFixed(2)}%`} />
            <ReportCell label="Tax Rate" value={`${(inputs.taxRate * 100).toFixed(2)}%`} />
            <ReportCell label="Step-Up SIP Rate" value={`${(inputs.stepUpPercentage * 100).toFixed(2)}%`} />
            <ReportCell
              label="Goal Used for SIP"
              value={inputs.useInflationAdjusted ? fmt(inflationAdjustedGoal) : fmt(inputs.goalAmount)}
            />
          </div>
        </div>

        <div className="rounded-lg bg-[#247c94] px-5 py-3 text-white">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div>
              <span className="text-xs font-medium opacity-90">Goal Amount (Today): </span>
              <span className="font-bold">{fmt(inputs.goalAmount)}</span>
            </div>
            <div>
              <span className="text-xs font-medium opacity-90">Future Goal (After Inflation): </span>
              <span className="font-bold">{fmt(inflationAdjustedGoal)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIP Comparison */}
      <section data-pdf-section className="px-8 pb-6">
          <h2 className="mb-3 border-b-2 border-[#1a5163]/20 pb-1 text-sm font-bold uppercase tracking-wide text-[#1a5163]">
            Investment Comparison
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <SipPanel
              title="Standard SIP"
              accent="bg-[#fff9eb]"
              monthlyLabel="Monthly SIP Required"
              monthlyValue={fmt(results.sipRequired)}
              stats={[
                { label: "Total Invested", value: fmt(results.sipTotalInvested) },
                { label: "Capital Gains Tax", value: fmt(results.sipTax) },
                { label: "Final Corpus Value", value: fmt(results.sipMaturityValue) },
              ]}
            />
            <SipPanel
              title="Step-Up SIP"
              accent="bg-[#e4eed7]"
              monthlyLabel="Starting Monthly SIP"
              monthlyValue={fmt(results.suStartAmount)}
              monthlySub={`+${(inputs.stepUpPercentage * 100).toFixed(0)}% annually · Final year: ${fmt(results.suEndAmount)}`}
              stats={[
                { label: "Total Invested", value: fmt(results.suTotalInvested) },
                { label: "Capital Gains Tax", value: fmt(results.suTax) },
                { label: "Final Corpus Value", value: fmt(results.suMaturityValue) },
              ]}
            />
            <div className="rounded-xl border-[1.5px] border-[#1a5163] bg-white p-3">
              <h3 className="mb-2 text-center text-xs font-bold text-[#1a5163]">Visual Comparison</h3>
              <div className="h-[240px]">
                {results.targetGoal > 0 ? (
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart
                      data={comparisonChartData(results)}
                      margin={{ top: 28, right: 8, left: 8, bottom: 4 }}
                      barGap={0}
                    >
                      <CartesianGrid vertical={false} horizontal={false} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                      <Bar dataKey="Standard" name="SIP" fill="#195b70" stroke="#000" strokeWidth={1} isAnimationActive={false}>
                        <LabelList dataKey="Standard" content={ChartBarLabelSIP} />
                      </Bar>
                      <Bar dataKey="StepUp" name="Step-Up SIP" fill="#f4d5cc" stroke="#000" strokeWidth={1} isAnimationActive={false}>
                        <LabelList dataKey="StepUp" content={ChartBarLabelStepUp} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : null}
              </div>
              <div className="mt-2 flex justify-center gap-4 text-[10px] text-gray-600">
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#195b70]" /> SIP</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f4d5cc] border border-gray-400" /> Step-Up SIP</span>
              </div>
            </div>
          </div>
      </section>

      {/* Yearly schedule — one section per page chunk to avoid mid-table cuts */}
      {yearlyChunks.map((chunk, index) => (
        <YearlyTableSection
          key={index}
          rows={chunk}
          showTitle={index === 0}
          chunkIndex={index}
        />
      ))}

      {/* Cost of delay + footer */}
      <section data-pdf-section className="space-y-6 px-8 pb-8 pt-2">
          <h2 className="mb-3 border-b-2 border-[#1a5163]/20 pb-1 text-sm font-bold uppercase tracking-wide text-[#1a5163]">
            Cost of Delay
          </h2>
          <div className="overflow-hidden rounded-lg border border-[#1a5163]/30">
            <table className="w-full text-xs">
              <thead className="bg-[#1a5163] text-white">
                <tr>
                  <th className="px-4 py-2 font-semibold text-center">Delay</th>
                  <th className="border-l border-white/20 px-4 py-2 font-semibold text-right">SIP Amount Required</th>
                  <th className="border-l border-white/20 px-4 py-2 font-semibold text-right">Additional Amount</th>
                </tr>
              </thead>
              <tbody>
                {results.delayProjections.map((proj, i) => (
                  <tr key={proj.months} className={i % 2 === 0 ? "bg-white" : "bg-[#f7fafb]"}>
                    <td className="px-4 py-2 text-center font-medium">{proj.months} Months</td>
                    <td className="border-l border-gray-200 px-4 py-2 text-right">{formatIndianCurrency(proj.sipRequired)}</td>
                    <td className="border-l border-gray-200 px-4 py-2 text-right font-medium text-red-700">{formatIndianCurrency(proj.costOfDelay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        <div className="border-t border-[#1a5163]/20 pt-4 text-center">
          <p className="text-[10px] leading-relaxed text-gray-500">
            This report is for informational purposes only and does not constitute investment advice.
            Returns are based on the assumptions stated above and actual results may vary.
            Please consult your financial advisor before making investment decisions.
          </p>
          <p className="mt-3 text-sm font-bold text-[#1a5163]">Nivra Fintech Team</p>
          <p className="text-xs italic text-gray-500">The Financial Engineers</p>
        </div>
      </section>
    </div>
  );
});
