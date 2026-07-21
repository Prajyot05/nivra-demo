"use client";

import { useState, useMemo, useRef, ElementType, useEffect } from "react";
import { flushSync } from "react-dom";
import { calculateSipPlan, CalculatorInputs } from "@/utils/calculator";
import { formatIndianCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Calculator, TrendingUp, Wallet, ArrowRight, Clock, FileDown, Table } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PdfReport } from "@/components/pdf-report";
import { buildPdfFromSections } from "@/lib/pdf-export";
import { comparisonChartData } from "@/components/chart-bar-labels";

const chartConfig = {
  Standard: {
    label: "SIP",
    color: "#195b70",
  },
  StepUp: {
    label: "StepUP SIP",
    color: "#f4d5cc",
  },
} satisfies ChartConfig;

const StatBox = ({ title, value, icon: Icon, subtext = "", highlight = false }: { title: string; value: string | number; icon?: ElementType; subtext?: string; highlight?: boolean }) => (
  <div className={`p-4 rounded-lg border flex flex-col justify-center h-full print:bg-transparent print:text-black print:border-gray-300 ${highlight ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground'}`}>
    <div className="flex items-center gap-2 mb-2 opacity-80 print:opacity-100">
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="text-xs sm:text-sm font-medium tracking-wide">{title}</span>
    </div>
    <div className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight truncate print:whitespace-normal print:opacity-100" title={String(value)}>
      {value}
    </div>
    {subtext && <div className="mt-1 text-xs font-medium opacity-70 truncate print:text-gray-800 print:opacity-100 print:whitespace-normal">{subtext}</div>}
  </div>
);

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Home() {
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState<number | string>(30);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [inputs, setInputs] = useState<CalculatorInputs>({
    goalAmount: 10000000,
    years: 15,
    expectedReturnRate: 0.12,
    taxRate: 0.125,
    stepUpPercentage: 0.10,
    inflationRate: 0.0575,
    useInflationAdjusted: false,
    delayMonths: 0,
  });

  const handleInputChange = (field: keyof CalculatorInputs, value: string | number | boolean) => {
    if (field === 'delayMonths' && typeof value === 'number') {
      value = Math.max(0, value);
    }
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const debouncedInputs = useDebounce(inputs, 500);
  const isCalculating = inputs !== debouncedInputs;
  const results = useMemo(() => calculateSipPlan(debouncedInputs), [debouncedInputs]);

  const contentRef = useRef<HTMLDivElement>(null);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  const waitForPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  const handleDownloadPdf = async () => {
    flushSync(() => setIsGeneratingPdf(true));
    await waitForPaint();
    // Allow chart/SVG to finish layout before capture
    await new Promise((resolve) => setTimeout(resolve, 400));

    const root = pdfReportRef.current;
    if (!root) {
      setIsGeneratingPdf(false);
      return;
    }

    try {
      const { toCanvas } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF("p", "mm", "a4");
      await buildPdfFromSections(root, toCanvas, pdf);

      const safeName = name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "Client";
      pdf.save(`Goal_SIP_Planner_${safeName}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* Render report in-viewport (behind overlay) so the browser paints it for capture */}
      {isGeneratingPdf && (
        <>
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
            <p className="text-lg font-semibold text-white">Generating PDF report…</p>
          </div>
          <div className="fixed left-0 top-0 z-[9999]">
            <PdfReport
              ref={pdfReportRef}
              name={name}
              age={age}
              inputs={debouncedInputs}
              results={results}
            />
          </div>
        </>
      )}

    <main
      ref={contentRef}
      id="pdf-content"
      className="min-h-screen w-full py-6 px-4 sm:py-10 sm:px-6 md:px-8 lg:py-12 lg:px-12 xl:px-16 max-w-7xl mx-auto bg-background text-foreground overflow-x-hidden"
    >

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Goal SIP Planner
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base no-print">
            Compare Standard and Step-Up SIP requirements side-by-side.
          </p>
        </div>
        <div className="no-print shrink-0">
          <Button
            onClick={handleDownloadPdf}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            disabled={isGeneratingPdf}
          >
            <FileDown className="w-4 h-4" />
            {isGeneratingPdf ? "Generating..." : "Download PDF Report"}
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-8 sm:mb-10">

        {/* Financial Assumptions */}
        <div className="border-[1.5px] border-[#1a5163] rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="text-center py-2.5 px-3 text-sm sm:text-[15px] font-medium text-[#1a5163] tracking-wide">
            Financial Assumptions
          </div>
          <div className="p-4 sm:p-6 pt-2 space-y-4 sm:space-y-5">
            {/* Client details */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem] gap-3 sm:gap-4 max-w-xl">
              <div className="space-y-1 min-w-0">
                <Label className="text-xs text-gray-700 font-medium">Client Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1 w-full sm:w-28">
                <Label className="text-xs text-gray-700 font-medium">Age</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Goal & rates — responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs text-gray-700 font-medium">Target Goal Amount</Label>
                <Input
                  type="number"
                  value={inputs.goalAmount}
                  onChange={(e) => handleInputChange("goalAmount", Number(e.target.value))}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-700 font-medium">Tenure (Years)</Label>
                <Input
                  type="number"
                  value={inputs.years}
                  onChange={(e) => handleInputChange("years", Number(e.target.value))}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-700 font-medium">Expected Return (%)</Label>
                <Input
                  type="number"
                  value={inputs.expectedReturnRate * 100}
                  onChange={(e) => handleInputChange("expectedReturnRate", Number(e.target.value) / 100)}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-700 font-medium">Inflation Rate (%)</Label>
                <Input
                  type="number"
                  value={inputs.inflationRate * 100}
                  onChange={(e) => handleInputChange("inflationRate", Number(e.target.value) / 100)}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-700 font-medium">Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={inputs.taxRate * 100}
                  onChange={(e) => handleInputChange("taxRate", Number(e.target.value) / 100)}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Step-up + inflation adjusted */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-end">
              <div className="space-y-1 max-w-xs">
                <Label className="text-xs text-gray-700 font-medium">Step-Up SIP Rate (%)</Label>
                <Input
                  type="number"
                  value={inputs.stepUpPercentage * 100}
                  onChange={(e) => handleInputChange("stepUpPercentage", Number(e.target.value) / 100)}
                  className="h-9 sm:h-8 rounded-lg border-[#1a5163] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-700 font-medium mb-1 block">
                  Inflation Adjusted Goal Amount
                </Label>
                <div className="h-9 sm:h-8 w-full rounded-lg border border-[#1a5163] bg-[#d9ebd9] flex items-center justify-center px-3 font-medium text-sm text-[#1a5163]">
                  {formatIndianCurrency(results.targetGoal)}
                </div>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex flex-wrap items-center gap-3 pt-1 no-print">
              <Label
                className="text-xs text-gray-700 font-medium cursor-pointer leading-snug"
                htmlFor="inflation-toggle"
              >
                Use Inflation Adjusted Goal Amount
              </Label>
              <Switch
                id="inflation-toggle"
                checked={inputs.useInflationAdjusted}
                onCheckedChange={(checked) => handleInputChange("useInflationAdjusted", checked)}
                className="data-[state=checked]:bg-[#1a5163] border-[#1a5163]"
              />
            </div>
          </div>
        </div>

        {/* Target Goal Summary Banner */}
        <div className="bg-[#247c94] text-white rounded-lg p-3 px-4 sm:px-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <span className="font-semibold text-sm sm:text-base">
            Goal Amount / Infl. Adjusted Goal Amount:
          </span>
          <span className="font-bold text-base sm:text-lg tracking-wide">
            Rs. {results.targetGoal.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Results: 1 col mobile → 2 col tablet → 3 col laptop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:min-h-[420px]">

          {/* Standard SIP Panel */}
          <div className="bg-[#fff9eb] border-[1.5px] border-[#1a5163] rounded-2xl p-4 flex flex-col items-center">
            <h2 className="text-[#a47b2c] text-sm sm:text-[15px] font-semibold mb-3 sm:mb-4 text-center">
              SIP Based Investment
            </h2>
            <div className="w-full bg-[#af8821] rounded-xl p-3 sm:p-4 text-center text-white mb-3 sm:mb-4 shadow-sm border border-[#9c781d]">
              <div className="text-sm font-medium mb-1 sm:mb-2">Monthly SIP Required</div>
              <div className="text-xl sm:text-2xl font-bold break-all">
                {formatIndianCurrency(results.sipRequired).replace("₹", "")}
              </div>
            </div>

            <div className="w-full grow flex flex-col justify-between gap-2.5 sm:gap-3">
              <div className="bg-white border-[1.5px] border-[#1a5163] rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                <div className="text-xs font-semibold text-gray-800">Total Invested</div>
                <div className="text-base sm:text-lg font-bold text-gray-800 mt-1 break-all">
                  {formatIndianCurrency(results.sipTotalInvested).replace("₹", "")}
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-[#1a5163] rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                <div className="text-xs font-semibold text-gray-800">Capital Gains Tax</div>
                <div className="text-base sm:text-lg font-bold text-gray-800 mt-1 break-all">
                  {formatIndianCurrency(results.sipTax).replace("₹", "")}
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-[#1a5163] rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                <div className="text-xs font-semibold text-gray-800">Final Corpus Value</div>
                <div className="text-base sm:text-lg font-bold text-gray-800 mt-1 break-all">
                  {formatIndianCurrency(results.sipMaturityValue).replace("₹", "")}
                </div>
              </div>
            </div>
          </div>

          {/* Step-Up SIP Panel */}
          <div className="bg-[#e4eed7] border-[1.5px] border-[#1a5163] rounded-2xl p-4 flex flex-col items-center">
            <h2 className="text-[#a47b2c] text-sm sm:text-[15px] font-semibold mb-3 sm:mb-4 text-center">
              Step-Up SIP Based Investment
            </h2>
            <div className="w-full bg-[#af8821] rounded-xl p-3 text-center text-white mb-3 sm:mb-4 shadow-sm border border-[#9c781d]">
              <div className="text-xs sm:text-[13px] font-medium mb-1">Starting Monthly SIP Amount</div>
              <div className="text-lg sm:text-xl font-bold break-all">
                {formatIndianCurrency(results.suStartAmount).replace("₹", "")}
              </div>
              <div className="text-[11px] font-normal mt-1 opacity-90">
                Increase {inputs.stepUpPercentage * 100}% Annually
              </div>
              <div className="text-[11px] mt-1.5 opacity-90 break-all">
                Final Year SIP: Rs. {formatIndianCurrency(results.suEndAmount).replace("₹", "")}
              </div>
            </div>

            <div className="w-full grow flex flex-col justify-between gap-2.5 sm:gap-3">
              <div className="bg-white border-[1.5px] border-[#1a5163] rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                <div className="text-xs font-semibold text-gray-800">Total Invested</div>
                <div className="text-base sm:text-lg font-bold text-gray-800 mt-1 break-all">
                  {formatIndianCurrency(results.suTotalInvested).replace("₹", "")}
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-[#1a5163] rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                <div className="text-xs font-semibold text-gray-800">Capital Gains Tax</div>
                <div className="text-base sm:text-lg font-bold text-gray-800 mt-1 break-all">
                  {formatIndianCurrency(results.suTax).replace("₹", "")}
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-[#1a5163] rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                <div className="text-xs font-semibold text-gray-800">Final Corpus Value</div>
                <div className="text-base sm:text-lg font-bold text-gray-800 mt-1 break-all">
                  {formatIndianCurrency(results.suMaturityValue).replace("₹", "")}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white border-[1.5px] border-[#1a5163] rounded-2xl p-4 flex flex-col md:col-span-2 lg:col-span-1 min-h-[280px] sm:min-h-[320px] lg:min-h-0 lg:h-full">
            <h2 className="text-[#1a5163] text-sm font-semibold mb-2 text-center lg:hidden">
              Visual Comparison
            </h2>
            {results.targetGoal > 0 ? (
              <div className="flex-1 min-h-[240px] relative">
                <ChartContainer config={chartConfig} className="absolute inset-0 w-full h-full">
                  <BarChart
                    accessibilityLayer
                    data={comparisonChartData(results)}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    barGap={0}
                  >
                    <CartesianGrid vertical={false} horizontal={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Bar
                      dataKey="Standard"
                      name="SIP"
                      fill="var(--color-Standard)"
                      stroke="#000"
                      strokeWidth={1}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="StepUp"
                      name="StepUP SIP"
                      fill="var(--color-StepUp)"
                      stroke="#000"
                      strokeWidth={1}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#1a5163] opacity-80 h-full p-4 text-center">
                <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No active data to display.</p>
                <p className="text-xs mt-1">
                  Please enter a valid Target Goal Amount to view the comparison chart.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yearly Schedule Section */}
      <div className="mt-10 sm:mt-16 border-t pt-8 sm:pt-10 print:mt-16 print:pt-10 break-inside-avoid print:break-inside-avoid">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold">
            Investment Performance - Value by Year
          </h2>
          <Button
            variant="outline"
            className="no-print gap-2 w-full sm:w-auto shrink-0"
            onClick={() => setShowSchedule(!showSchedule)}
          >
            <Table className="w-4 h-4" />
            {showSchedule ? "Hide Yearly Schedule" : "Show Yearly Schedule"}
          </Button>
        </div>

        <div className={`${showSchedule ? "block" : "hidden"} print:block`}>
          {/* Web View: Tabs */}
          <div className="no-print">
            <Tabs defaultValue="standard" className="w-full flex flex-col">
              <div className="flex justify-center w-full mb-4 sm:mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-2 h-auto">
                  <TabsTrigger value="standard" className="text-xs sm:text-sm py-2">
                    Standard SIP
                  </TabsTrigger>
                  <TabsTrigger value="stepup" className="text-xs sm:text-sm py-2">
                    Step-Up SIP
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="standard" className="mt-0">
                <div className="overflow-x-auto rounded-lg border -mx-1 px-0">
                  <table className="w-full text-xs sm:text-sm text-left min-w-[320px]">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold border-b">Year</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold border-b border-l">
                          Monthly SIP
                        </th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold border-b">
                          Year-End Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.yearlyData.map((data) => (
                        <tr
                          key={data.year}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center w-16 sm:w-24">
                            {data.year}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 border-l text-right font-medium whitespace-nowrap">
                            {formatIndianCurrency(data.sipAmount)}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right whitespace-nowrap">
                            {formatIndianCurrency(data.sipBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="stepup" className="mt-0">
                <div className="overflow-x-auto rounded-lg border -mx-1 px-0">
                  <table className="w-full text-xs sm:text-sm text-left min-w-[320px]">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold border-b">Year</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold border-b border-l">
                          Monthly SIP
                        </th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold border-b">
                          Year-End Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.yearlyData.map((data) => (
                        <tr
                          key={data.year}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center w-16 sm:w-24">
                            {data.year}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 border-l text-right font-medium whitespace-nowrap">
                            {formatIndianCurrency(data.stepUpAmount)}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right whitespace-nowrap">
                            {formatIndianCurrency(data.stepUpBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Print View: Unified Table */}
          <div className="hidden print:block print:w-full">
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-bold border-b border-gray-300">Year</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300 border-l">
                      Standard Monthly SIP
                    </th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300">
                      Standard Year-End Value
                    </th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300 border-l">
                      Step-Up Monthly SIP
                    </th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300">
                      Step-Up Year-End Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.yearlyData.map((data) => (
                    <tr key={data.year} className="border-b border-gray-200 last:border-0">
                      <td className="px-4 py-3 text-center text-gray-900">{data.year}</td>
                      <td className="px-4 py-3 border-l border-gray-200 text-right font-medium text-gray-900">
                        {formatIndianCurrency(data.sipAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatIndianCurrency(data.sipBalance)}
                      </td>
                      <td className="px-4 py-3 border-l border-gray-200 text-right font-medium text-gray-900">
                        {formatIndianCurrency(data.stepUpAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatIndianCurrency(data.stepUpBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Cost of Delay */}
      <div className="mt-10 sm:mt-16 pt-8 sm:pt-10 border-t print:mt-16 print:pt-10 break-inside-avoid print:break-inside-avoid">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-8 flex items-center gap-2">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" /> Cost of Delay
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs sm:text-sm text-left min-w-[360px]">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold border-b text-center">
                  Delay
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold border-b border-l text-right">
                  SIP Amount Required
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold border-b border-l text-right">
                  Total Addt. Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {results.delayProjections.map((proj) => (
                <tr
                  key={proj.months}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center font-medium text-sm sm:text-base whitespace-nowrap">
                    {proj.months} Months
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 border-l text-right font-medium text-sm sm:text-base whitespace-nowrap">
                    {formatIndianCurrency(proj.sipRequired)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 border-l text-right font-medium text-sm sm:text-base text-destructive whitespace-nowrap">
                    {formatIndianCurrency(proj.costOfDelay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t text-center space-y-3 sm:space-y-4 px-1">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Thank you for reviewing the customized Goal SIP Planner. We appreciate your trust in
          Nivra Fintech and remain committed to providing high-quality, goal-oriented financial
          solutions. Please contact us should you require any further assistance.
        </p>
        <div>
          <p className="font-bold text-sm sm:text-base">Nivra Fintech Team!</p>
          <p className="text-xs sm:text-sm text-muted-foreground italic">The Financial Engineers</p>
        </div>
      </div>

    </main>
    </>
  );
}
