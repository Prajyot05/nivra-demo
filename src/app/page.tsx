"use client";

import { useState, useMemo, useRef, ElementType, useDeferredValue } from "react";
import { useReactToPrint } from "react-to-print";
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  Standard: {
    label: "SIP",
    color: "#a8d8d8",
  },
  StepUp: {
    label: "StepUP SIP",
    color: "#c3544e",
  },
} satisfies ChartConfig;

const CustomBarLabelSIP = (props: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: React.ReactNode }) => {
  const x = Number(props.x || 0);
  const y = Number(props.y || 0);
  const width = Number(props.width || 0);
  const height = Number(props.height || 0);
  const value = props.value;
  const isSmall = height < 80;
  const textX = x + width / 2;
  const textY = isSmall ? y - 5 : y + height / 2;
  return (
    <text
      x={textX}
      y={textY}
      fill={isSmall ? '#555' : '#333'}
      fontSize={13}
      fontWeight={600}
      textAnchor={isSmall ? "start" : "middle"}
      dominantBaseline="middle"
      transform={`rotate(-90, ${textX}, ${textY})`}
    >
      {value ? `₹ ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : ''}
    </text>
  );
};

const CustomBarLabelStepUp = (props: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: React.ReactNode }) => {
  const x = Number(props.x || 0);
  const y = Number(props.y || 0);
  const width = Number(props.width || 0);
  const height = Number(props.height || 0);
  const value = props.value;
  const isSmall = height < 80;
  const textX = x + width / 2;
  const textY = isSmall ? y - 5 : y + height / 2;
  return (
    <text
      x={textX}
      y={textY}
      fill={isSmall ? '#555' : '#fff'}
      fontSize={13}
      fontWeight={600}
      textAnchor={isSmall ? "start" : "middle"}
      dominantBaseline="middle"
      transform={`rotate(-90, ${textX}, ${textY})`}
    >
      {value ? `₹ ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : ''}
    </text>
  );
};

const StatBox = ({ title, value, icon: Icon, subtext = "", highlight = false }: { title: string; value: string | number; icon?: ElementType; subtext?: string; highlight?: boolean }) => (
  <div className={`p-4 rounded-lg border flex flex-col justify-center h-full ${highlight ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground'}`}>
    <div className="flex items-center gap-2 mb-2 opacity-80">
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="text-xs sm:text-sm font-medium tracking-wide">{title}</span>
    </div>
    <div className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight truncate" title={String(value)}>
      {value}
    </div>
    {subtext && <div className="mt-1 text-xs font-medium opacity-70 truncate">{subtext}</div>}
  </div>
);

export default function Home() {
  const [name, setName] = useState("Mr. John Doe");
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

  const deferredInputs = useDeferredValue(inputs);
  const results = useMemo(() => calculateSipPlan(deferredInputs), [deferredInputs]);

  const contentRef = useRef<HTMLDivElement>(null);

  const executePrint = useReactToPrint({
    contentRef,
    documentTitle: 'Goal_SIP_Planner',
    onAfterPrint: () => {
      setIsGeneratingPdf(false);
    }
  });

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    // Give React time to re-render the DOM with print-specific elements visible
    setTimeout(() => {
      executePrint();
    }, 100);
  };

  return (
    <main ref={contentRef} id="pdf-content" className="min-h-screen py-12 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto bg-background text-foreground">
      
      {/* Disclaimer (Visible always, specifically for the report) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Goal SIP Planner
          </h1>
          <p className={`text-muted-foreground mt-1 text-sm sm:text-base ${isGeneratingPdf ? 'hidden' : 'block'}`}>
            Compare Standard and Step-Up SIP requirements side-by-side.
          </p>
        </div>
        <div className={isGeneratingPdf ? 'hidden' : 'block'}>
          <Button onClick={handleDownloadPdf} variant="outline" className="gap-2" disabled={isGeneratingPdf}>
            <FileDown className="w-4 h-4" />
            {isGeneratingPdf ? 'Generating...' : 'Download PDF Report'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mb-10">

        {/* Left Column: Inputs */}
        <div className="xl:col-span-4 space-y-6">

          <Card className="shadow-none border rounded-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">

              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-medium h-10 print-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Goal Amount (₹)</Label>
                <Input
                  type="number"
                  value={inputs.goalAmount}
                  onChange={(e) => handleInputChange('goalAmount', Number(e.target.value))}
                  className="font-medium h-10 print-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tenure (Years)</Label>
                  <Input
                    type="number"
                    value={inputs.years}
                    onChange={(e) => handleInputChange('years', Number(e.target.value))}
                    className="h-10 print-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expected Return (%)</Label>
                  <Input
                    type="number"
                    value={inputs.expectedReturnRate * 100}
                    onChange={(e) => handleInputChange('expectedReturnRate', Number(e.target.value) / 100)}
                    className="h-10 print-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={inputs.taxRate * 100}
                    onChange={(e) => handleInputChange('taxRate', Number(e.target.value) / 100)}
                    className="h-10 print-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Inflation Rate (%)</Label>
                  <Input
                    type="number"
                    value={inputs.inflationRate * 100}
                    onChange={(e) => handleInputChange('inflationRate', Number(e.target.value) / 100)}
                    className="h-10 print-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Step-Up Rate (%)</Label>
                  <Input
                    type="number"
                    value={inputs.stepUpPercentage * 100}
                    onChange={(e) => handleInputChange('stepUpPercentage', Number(e.target.value) / 100)}
                    className="h-10 print-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Delay (Months)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={inputs.delayMonths}
                    onChange={(e) => handleInputChange('delayMonths', Number(e.target.value))}
                    className="h-10 print-input"
                  />
                </div>
              </div>

              <div className="pt-4 border-t no-print">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium cursor-pointer" htmlFor="inflation-toggle">
                    Adjust target for inflation
                  </Label>
                  <Switch
                    id="inflation-toggle"
                    checked={inputs.useInflationAdjusted}
                    onCheckedChange={(checked) => handleInputChange('useInflationAdjusted', checked)}
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="xl:col-span-8 space-y-6">

          {/* Target Goal Summary */}
          <Card className="shadow-none border rounded-xl overflow-hidden bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                    {inputs.useInflationAdjusted ? "Inflation Adjusted Target" : "Target Goal"}
                  </div>
                  <div
                    className="text-4xl font-bold tracking-tight truncate"
                    title={formatIndianCurrency(results.targetGoal)}
                  >
                    {formatIndianCurrency(results.targetGoal)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard SIP Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                SIP Based Investment
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <StatBox
                    title="Monthly SIP Required"
                    value={formatIndianCurrency(results.sipRequired)}
                    icon={Wallet}
                    highlight={true}
                  />
                </div>
                <StatBox
                  title="Total Invested"
                  value={formatIndianCurrency(results.sipTotalInvested)}
                  icon={TrendingUp}
                />
                <StatBox
                  title="Capital Gains Tax"
                  value={formatIndianCurrency(results.sipTax)}
                  icon={Info}
                />
              </div>
            </div>

            {/* Step-Up SIP Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                Step-Up SIP Based Investment
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <StatBox
                    title="Starting SIP Amount"
                    value={formatIndianCurrency(results.suStartAmount)}
                    icon={Wallet}
                    highlight={true}
                    subtext={`Increases by ${inputs.stepUpPercentage * 100}% annually`}
                  />
                </div>
                <StatBox
                  title="Total Invested"
                  value={formatIndianCurrency(results.suTotalInvested)}
                  icon={TrendingUp}
                />
                <StatBox
                  title="Capital Gains Tax"
                  value={formatIndianCurrency(results.suTax)}
                  icon={Info}
                />
              </div>

              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4" /> End of Tenure Outlook
                </h3>
                <div className="overflow-hidden">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Final Year Monthly SIP Amount</div>
                  <div className="text-base font-semibold truncate">
                    {formatIndianCurrency(results.suEndAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="md:col-span-2 break-inside-avoid print:break-inside-avoid">
              <Card className="shadow-none border rounded-xl overflow-hidden bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Standard vs Step-Up Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
                    <BarChart
                      accessibilityLayer
                      data={[
                        {
                          name: "Amount Invested",
                          Standard: results.sipTotalInvested,
                          StepUp: results.suTotalInvested,
                        },
                        {
                          name: "Cap Gains Tax",
                          Standard: results.sipTax,
                          StepUp: results.suTax,
                        },
                        {
                          name: "Final Corpus Value",
                          Standard: results.sipMaturityValue,
                          StepUp: results.suMaturityValue,
                        },
                      ]}
                      margin={{ top: 30, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={15}
                        axisLine={true}
                        tick={{ fontSize: 12, fontWeight: 500 }}
                      />
                      <YAxis
                        width={90}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        tick={{ fontSize: 12, fill: "#666" }}
                        tickFormatter={(value) => `₹ ${value.toLocaleString('en-IN')}`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar dataKey="Standard" name="SIP" fill="var(--color-Standard)" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                        <LabelList dataKey="Standard" content={<CustomBarLabelSIP />} />
                      </Bar>
                      <Bar dataKey="StepUp" name="StepUP SIP" fill="var(--color-StepUp)" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                        <LabelList dataKey="StepUp" content={<CustomBarLabelStepUp />} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>

      {/* Yearly Schedule Section */}
      <div className="mt-16 border-t pt-10 print:mt-16 print:pt-10 break-inside-avoid print:break-inside-avoid">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Investment Performance - Value by Year</h2>
          <Button
            variant="outline"
            className={`gap-2 ${isGeneratingPdf ? 'hidden' : 'flex'}`}
            onClick={() => setShowSchedule(!showSchedule)}
          >
            <Table className="w-4 h-4" />
            {showSchedule ? "Hide Yearly Schedule" : "Show Yearly Schedule"}
          </Button>
        </div>

        <div className={`${showSchedule || isGeneratingPdf ? 'block' : 'hidden'} print:block`}>
          
          {/* Web View: Tabs */}
          <div className={isGeneratingPdf ? 'hidden' : 'block'}>
            <Tabs defaultValue="standard" className="w-full flex flex-col">
              <div className="flex justify-center w-full mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="standard">Standard SIP Schedule</TabsTrigger>
                  <TabsTrigger value="stepup">Step-Up SIP Schedule</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="standard" className="mt-0">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold border-b">Year</th>
                        <th className="px-4 py-3 font-semibold border-b border-l">Monthly SIP</th>
                        <th className="px-4 py-3 font-semibold border-b">Year-End Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.yearlyData.map((data) => (
                        <tr key={data.year} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-center w-24">{data.year}</td>
                          <td className="px-4 py-3 border-l text-right font-medium">{formatIndianCurrency(data.sipAmount)}</td>
                          <td className="px-4 py-3 text-right">{formatIndianCurrency(data.sipBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="stepup" className="mt-0">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold border-b">Year</th>
                        <th className="px-4 py-3 font-semibold border-b border-l">Monthly SIP</th>
                        <th className="px-4 py-3 font-semibold border-b">Year-End Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.yearlyData.map((data) => (
                        <tr key={data.year} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-center w-24">{data.year}</td>
                          <td className="px-4 py-3 border-l text-right font-medium">{formatIndianCurrency(data.stepUpAmount)}</td>
                          <td className="px-4 py-3 text-right">{formatIndianCurrency(data.stepUpBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Print View: Unified Table */}
          <div className={isGeneratingPdf ? 'block w-full' : 'hidden print:block print:w-full'}>
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-bold border-b border-gray-300">Year</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300 border-l">Standard Monthly SIP</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300">Standard Year-End Value</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300 border-l">Step-Up Monthly SIP</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-300">Step-Up Year-End Value</th>
                  </tr>
                </thead>
                <tbody>
                  {results.yearlyData.map((data) => (
                    <tr key={data.year} className="border-b border-gray-200 last:border-0">
                      <td className="px-4 py-3 text-center text-gray-900">{data.year}</td>
                      <td className="px-4 py-3 border-l border-gray-200 text-right font-medium text-gray-900">{formatIndianCurrency(data.sipAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatIndianCurrency(data.sipBalance)}</td>
                      <td className="px-4 py-3 border-l border-gray-200 text-right font-medium text-gray-900">{formatIndianCurrency(data.stepUpAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatIndianCurrency(data.stepUpBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Cost of Delay Projections (As in the official template) */}
      <div className="mt-16 pt-10 border-t print:mt-16 print:pt-10 break-inside-avoid print:break-inside-avoid">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Cost of Delay
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold border-b text-center">Delay</th>
                <th className="px-6 py-4 font-semibold border-b border-l text-right">SIP Amount Required</th>
                <th className="px-6 py-4 font-semibold border-b border-l text-right">Total Addt. Amount</th>
              </tr>
            </thead>
            <tbody>
              {results.delayProjections.map((proj) => (
                <tr key={proj.months} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-center font-medium text-base">{proj.months} Months</td>
                  <td className="px-6 py-4 border-l text-right font-medium text-base">{formatIndianCurrency(proj.sipRequired)}</td>
                  <td className="px-6 py-4 border-l text-right font-medium text-base text-destructive">{formatIndianCurrency(proj.costOfDelay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer (Visible primarily for reports) */}
      <div className="mt-20 pt-10 border-t text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Thank you for reviewing the customized Goal SIP Planner. We appreciate your trust in Nivra Fintech and remain committed to providing high-quality, goal-oriented financial solutions. Please contact us should you require any further assistance.
        </p>
        <div>
          <p className="font-bold">Nivra Fintech Team!</p>
          <p className="text-sm text-muted-foreground italic">The Financial Engineers</p>
        </div>
      </div>

    </main>
  );
}
