"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Download, Calendar, Clock } from "lucide-react";
import { useGoalSip } from "@/hooks/use-goal-sip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { downloadSipPdf } from "@/lib/download-sip-pdf";
import { NavToggleButton } from "@/components/layout/sidebar-context";
import {
  CalculatorPageHeader,
  getColorTheme,
  type ColorThemeId,
} from "@nivra/ui";

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.round(n)}`;
};

/** Human-readable Rs in Cr / Lakh / Thousand */
const fmtRsUnit = (n: number) => {
  if (!Number.isFinite(n)) return "Rs. —";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) {
    return `${sign}Rs. ${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}Rs. ${(abs / 100000).toFixed(2)} Lakh`;
  }
  if (abs >= 1000) {
    return `${sign}Rs. ${(abs / 1000).toFixed(2)} Thousand`;
  }
  return `${sign}Rs. ${Math.round(abs)}`;
};

export function GoalSipPlanner() {
  const [clientName, setClientName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [goal, setGoal] = useState(1000000);
  const [tenure, setTenure] = useState(15);
  const [returnPct, setReturnPct] = useState(12);
  const [inflation, setInflation] = useState(5.75);
  const [tax, setTax] = useState(12.5);
  const [stepUp, setStepUp] = useState(10);
  const [useInflAdj, setUseInflAdj] = useState(false);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [themeId, setThemeId] = useState<ColorThemeId>("classic");
  const theme = useMemo(() => getColorTheme(themeId), [themeId]);

  const { result, error, loading } = useGoalSip({
    clientName,
    age,
    goalAmount: goal,
    tenureYears: tenure,
    returnPct,
    inflationPct: inflation,
    taxPct: tax,
    stepUpPct: stepUp,
    useInflationAdjustedGoal: useInflAdj,
  });

  const inflAdjGoal = result?.inflAdjGoal ?? 0;
  const targetGoal = result?.targetGoal ?? goal;
  const standardSIP = result?.standard.monthlySip ?? 0;
  const stepUpSIP = result?.stepUp.monthlySip ?? 0;
  const stdInvested = result?.standard.invested ?? 0;
  const stepInvested = result?.stepUp.invested ?? 0;
  const stdCorpus = result?.standard.maturity ?? 0;
  const stepCorpus = result?.stepUp.maturity ?? 0;
  const stdGain = result?.standard.gain ?? 0;
  const stepGain = result?.stepUp.gain ?? 0;
  const stdTax = result?.standard.tax ?? 0;
  const stepTax = result?.stepUp.tax ?? 0;
  const combinedSchedule = result?.schedule ?? [];
  const delays = (result?.delays ?? []).map((d) => ({
    mo: d.months,
    sip: d.sipRequired,
    extra: d.extraInvested,
  }));
  const stdSchedule = combinedSchedule.map((row) => ({
    year: row.year,
    monthly: row.stdMonthly,
    yearEnd: row.stdYearEnd,
  }));
  const stepSchedule = combinedSchedule.map((row) => ({
    year: row.year,
    monthly: row.stepMonthly,
    yearEnd: row.stepYearEnd,
  }));

  const maxBar = Math.max(stdInvested, stepInvested, stdCorpus, stepCorpus);

  const stdDonut = [
    { name: "Invested", value: stdInvested, color: theme.chart.invested },
    { name: "Gain", value: stdGain, color: theme.chart.gain },
    { name: "Tax", value: stdTax, color: theme.chart.tax },
  ];
  const stepDonut = [
    { name: "Invested", value: stepInvested, color: theme.chart.invested },
    { name: "Gain", value: stepGain, color: theme.chart.gain },
    { name: "Tax", value: stepTax, color: theme.chart.tax },
  ];

  const handleDownload = () => {
    try {
      downloadSipPdf({
        clientName,
        age,
        goal,
        inflAdjGoal,
        useInflAdj,
        targetGoal,
        tenure,
        returnPct,
        inflation,
        tax,
        stepUp,
        standardSIP,
        stepUpSIP,
        stdInvested,
        stepInvested,
        stdGain,
        stepGain,
        stdTax,
        stepTax,
        stdCorpus,
        stepCorpus,
        stdSchedule,
        stepSchedule,
        delays,
      });
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  return (
    <div
      className="custom-scrollbar flex h-full min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--app-bg)] pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] sm:px-5 md:px-6 lg:px-8"
      style={theme.vars as CSSProperties}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3">
        <CalculatorPageHeader
          title="Goal SIP Planner"
          leading={<NavToggleButton />}
          themeId={themeId}
          onThemeChange={setThemeId}
          meta={
            error ? (
              <p className="mt-0.5 text-[11px] text-[var(--app-danger)]">
                {error}. Start the app with <code>npm run dev</code>.
              </p>
            ) : loading && !result ? (
              <p className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">Calculating…</p>
            ) : null
          }
          actions={
            <Button
              size="sm"
              className="h-8 bg-[var(--app-primary)] px-3 text-xs font-semibold text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)]"
              onClick={handleDownload}
            >
              <Download className="size-3.5" />
              Download
            </Button>
          }
        />

        <div className="flex shrink-0 flex-col justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5">
          <div className="mb-2 sm:mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
              Financial Assumptions
            </span>
          </div>

          <div className="grid grid-cols-1 items-start gap-3 min-[400px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 sm:gap-4 lg:gap-3 xl:gap-5">
            <Field label="Client Name">
              <Input
                className="h-10 sm:h-11"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </Field>
            <Field label="Age">
              <Input
                className="h-10 sm:h-11"
                type="number"
                value={age}
                onChange={(e) => setAge(+e.target.value)}
              />
            </Field>
            <Field label="Goal amount">
              <Input
                className="h-10 sm:h-11"
                inputMode="numeric"
                value={fmtINR(goal)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setGoal(raw === "" ? 0 : Number(raw));
                }}
              />
            </Field>
            <Field label="Tenure (yrs)">
              <Input
                className="h-10 sm:h-11"
                type="number"
                value={tenure}
                onChange={(e) => setTenure(+e.target.value)}
              />
            </Field>
            <Field label="Return (%)">
              <Input
                className="h-10 sm:h-11"
                type="number"
                value={returnPct}
                onChange={(e) => setReturnPct(+e.target.value)}
              />
            </Field>
            <Field label="Inflation (%)">
              <Input
                className="h-10 sm:h-11"
                type="number"
                value={inflation}
                onChange={(e) => setInflation(+e.target.value)}
              />
            </Field>
            <Field label="Tax (%)">
              <Input
                className="h-10 sm:h-11"
                type="number"
                value={tax}
                onChange={(e) => setTax(+e.target.value)}
              />
            </Field>
            <Field label="Step-Up (%)">
              <Input
                className="h-10 sm:h-11"
                type="number"
                value={stepUp}
                onChange={(e) => setStepUp(+e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)]">
              Use Infl. Adj. Goal
            </span>
            <Switch checked={useInflAdj} onCheckedChange={setUseInflAdj} />
            <div
              className={`flex min-w-0 flex-1 basis-full flex-col gap-2 sm:ml-6 sm:basis-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 ${useInflAdj
                ? "visible"
                : "hidden sm:invisible sm:flex"
                }`}
              aria-hidden={!useInflAdj}
            >
              <Badge
                variant="secondary"
                className="w-fit max-w-full border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-3 py-1.5 text-xs font-medium break-words text-[var(--app-warn-text)] shadow-sm"
              >
                Inflation Adjusted Goal:{" "}
                <span className="ml-1 font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                  ₹{fmtINR(inflAdjGoal)}
                </span>
              </Badge>
              <div className="flex flex-col gap-1 text-xs text-[var(--app-text-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                <span className="min-w-0">
                  Target Goal Amount:{" "}
                  <span className="font-semibold text-[var(--app-text)]">
                    {fmtRsUnit(goal)}
                  </span>
                </span>
                <span className="min-w-0 text-[var(--app-warn-muted)]">
                  Inflation Adjusted Goal:{" "}
                  <span className="font-semibold text-[var(--app-warn-text-strong)]">
                    {fmtRsUnit(inflAdjGoal)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:gap-4 lg:min-h-0 lg:grid-cols-12">
          {/* Chart + SIP panel */}
          <div className="flex min-h-0 lg:col-span-7">
            <div className="flex min-h-0 w-full flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
              <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
                <SipCard
                  title="Standard SIP"
                  amount={standardSIP}
                  accent="bg-[var(--app-primary)]"
                />
                <SipCard
                  title="Step-Up SIP"
                  amount={stepUpSIP}
                  accent="bg-[var(--app-primary-soft)]"
                />
              </div>

              <div className="mt-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
                  {chartType === "pie"
                    ? "Corpus Breakdown"
                    : "Standard vs Step-Up Comparison"}
                </span>
                <Select
                  value={chartType}
                  onValueChange={(v) => setChartType(v as "pie" | "bar")}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {chartType === "pie" ? (
                <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                  <DonutPanel
                    title="Standard SIP"
                    data={stdDonut}
                    corpus={stdCorpus}
                    invested={stdInvested}
                    gain={stdGain}
                    taxAmt={stdTax}
                    chartColors={theme.chart}
                  />
                  <DonutPanel
                    title="Step-Up SIP"
                    data={stepDonut}
                    corpus={stepCorpus}
                    invested={stepInvested}
                    gain={stepGain}
                    taxAmt={stepTax}
                    chartColors={theme.chart}
                  />
                </div>
              ) : (
                <div className="mt-3 flex min-h-0 flex-1 flex-col justify-evenly overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <div className="mb-1 flex shrink-0 items-center justify-end gap-4 text-xs text-[var(--app-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[var(--app-primary)]" />
                      SIP
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[var(--app-primary-soft)]" />
                      Step-Up
                    </span>
                  </div>
                  <ComparisonGroup
                    label="Invested"
                    sip={stdInvested}
                    step={stepInvested}
                    max={maxBar}
                  />
                  <ComparisonGroup
                    label="Tax Liability"
                    sip={stdTax}
                    step={stepTax}
                    max={Math.max(stdTax, stepTax)}
                  />
                  <ComparisonGroup
                    label="Final Corpus"
                    sip={stdCorpus}
                    step={stepCorpus}
                    max={maxBar}
                  />
                  <div className="mt-2 flex justify-between text-[10px] text-[var(--app-text-subtle)] sm:text-[11px]">
                    <div className="w-14 shrink-0 mr-2 sm:w-20 sm:mr-3" />
                    <div className="flex flex-1 justify-between">
                      <span>0</span>
                      <span className="hidden sm:inline">
                        {fmtLakh(maxBar * 0.25)}
                      </span>
                      <span>{fmtLakh(maxBar * 0.5)}</span>
                      <span className="hidden sm:inline">
                        {fmtLakh(maxBar * 0.75)}
                      </span>
                      <span>{fmtLakh(maxBar)}</span>
                    </div>
                    <div className="w-20 shrink-0 ml-2 sm:w-28 sm:ml-3" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule + Delay */}
          <div className="flex min-h-0 flex-col gap-3 lg:col-span-5 lg:min-h-0">
            <div className="flex min-h-[280px] flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:min-h-[320px] sm:p-4 xl:min-h-0">
              <div className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
                <Calendar className="h-4 w-4 shrink-0" />
                Yearly Schedule
              </div>
              <div className="mt-2 flex shrink-0 flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider sm:gap-3">
                <span className="rounded bg-[var(--app-std-bg)] px-2 py-0.5 text-[var(--app-std-text)]">
                  Standard SIP
                </span>
                <span className="rounded bg-[var(--app-step-bg)] px-2 py-0.5 text-[var(--app-step-text)]">
                  Step-Up SIP
                </span>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-auto">
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 h-8 bg-[var(--app-surface)] px-1 sm:px-2 text-[9px] sm:text-[10px] uppercase tracking-widest">
                          Yr
                        </TableHead>
                        <TableHead className="sticky top-0 h-8 bg-[var(--app-std-bg-soft)] px-1 sm:px-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--app-std-text)]">
                          Std SIP
                        </TableHead>
                        <TableHead className="sticky top-0 h-8 bg-[var(--app-std-bg-soft)] px-1 sm:px-2 text-right text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--app-std-text)]">
                          Std End
                        </TableHead>
                        <TableHead className="sticky top-0 h-8 bg-[var(--app-step-bg-soft)] px-1 sm:px-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--app-step-text)]">
                          Step SIP
                        </TableHead>
                        <TableHead className="sticky top-0 h-8 bg-[var(--app-step-bg-soft)] px-1 sm:px-2 text-right text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--app-step-text)]">
                          Step End
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedSchedule.map((row) => (
                        <TableRow key={row.year}>
                          <TableCell className="px-1 sm:px-2 py-1.5 text-[10px] sm:text-[11px] font-medium">
                            {row.year}
                          </TableCell>
                          <TableCell className="bg-[var(--app-std-bg-soft)] px-1 sm:px-2 py-1.5 text-[10px] sm:text-[11px] whitespace-nowrap text-[var(--app-std-text-strong)]">
                            ₹{fmtINR(row.stdMonthly)}
                          </TableCell>
                          <TableCell className="bg-[var(--app-std-bg-soft)] px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[11px] whitespace-nowrap text-[var(--app-std-text-strong)]">
                            ₹{fmtINR(row.stdYearEnd)}
                          </TableCell>
                          <TableCell className="bg-[var(--app-step-bg-soft)] px-1 sm:px-2 py-1.5 text-[10px] sm:text-[11px] whitespace-nowrap text-[var(--app-step-text-strong)]">
                            ₹{fmtINR(row.stepMonthly)}
                          </TableCell>
                          <TableCell className="bg-[var(--app-step-bg-soft)] px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[11px] whitespace-nowrap text-[var(--app-step-text-strong)]">
                            ₹{fmtINR(row.stepYearEnd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
                <Clock className="h-4 w-4 shrink-0" />
                Cost of Delay
              </div>

              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 px-2 text-[10px] uppercase tracking-widest">
                        Delay
                      </TableHead>
                      <TableHead className="h-8 px-2 text-[10px] uppercase tracking-widest">
                        SIP Req.
                      </TableHead>
                      <TableHead className="h-8 px-2 text-right text-[10px] uppercase tracking-widest">
                        Extra
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delays.map((d) => (
                      <TableRow key={d.mo}>
                        <TableCell className="px-2 py-1.5 text-[11px] whitespace-nowrap">
                          {d.mo} Mo
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-[11px] whitespace-nowrap">
                          ₹{fmtINR(d.sip)}
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-right text-[11px] font-medium whitespace-nowrap text-[var(--app-danger)]">
                          ₹{fmtINR(d.extra)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)]">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SipCard({
  title,
  amount,
  accent,
}: {
  title: string;
  amount: number;
  accent: string;
}) {
  return (
    <div className={`rounded-lg ${accent} px-3 py-2.5 text-center sm:px-4 sm:py-3`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)] sm:text-xs">
        {title} · Monthly SIP
      </div>
      <div className="mt-1 truncate text-lg font-semibold tabular-nums text-[var(--app-primary-fg)] sm:mt-1.5 sm:text-2xl lg:text-2xl">
        Rs. {fmtINR(amount)}
      </div>
    </div>
  );
}

function DonutPanel({
  title,
  data,
  corpus,
  invested,
  gain,
  taxAmt,
  chartColors,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  corpus: number;
  invested: number;
  gain: number;
  taxAmt: number;
  chartColors: { invested: string; gain: string; tax: string };
}) {
  const corpusLabel = fmtINR(corpus);
  const len = corpusLabel.length;
  // Larger by default; shrinks by screen size and by digit length for huge amounts
  const corpusFont =
    len > 14
      ? "text-[10px] sm:text-xs md:text-[11px] lg:text-xs xl:text-sm"
      : len > 11
        ? "text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base"
        : len > 8
          ? "text-sm sm:text-base md:text-[15px] lg:text-base xl:text-lg"
          : "text-base sm:text-lg md:text-lg lg:text-xl xl:text-2xl";

  return (
    <div className="flex min-h-0 flex-col overflow-y-auto overflow-x-hidden custom-scrollbar rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-2 sm:p-3">
      <div className="shrink-0 text-center text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="mt-1 flex min-h-[140px] shrink-0 items-center justify-center py-1 sm:min-h-[160px]">
        <div className="relative aspect-square w-full max-w-[130px] sm:max-w-[160px] md:max-w-[140px] lg:max-w-[140px] xl:max-w-[200px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="95%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={true}
                animationDuration={800}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex w-[78%] flex-col items-center justify-center overflow-hidden text-center">
              <div className="text-[8px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)] sm:text-[9px] xl:text-[10px]">
                Corpus
              </div>
              <div
                className={`mt-0.5 w-full font-semibold leading-tight tabular-nums text-[var(--app-text)] ${corpusFont}`}
                style={{ wordBreak: "break-all" }}
              >
                {corpusLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 shrink-0 space-y-1.5">
        <LegendRow
          color={chartColors.invested}
          label="Invested"
          value={invested}
        />
        <LegendRow
          color={chartColors.gain}
          label="Gain (Pre-Tax)"
          value={gain}
        />
        <LegendRow
          color={chartColors.tax}
          label="Capital Gain Tax"
          value={taxAmt}
        />
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex min-w-0 items-center gap-2 text-[var(--app-text-muted)]">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
          {label}
        </span>
      </div>
      <span className="shrink-0 truncate text-right text-xs font-medium tabular-nums text-[var(--app-text)] sm:text-sm">
        {fmtINR(value)}
      </span>
    </div>
  );
}

function ComparisonGroup({
  label,
  sip,
  step,
  max,
}: {
  label: string;
  sip: number;
  step: number;
  max: number;
}) {
  return (
    <div className="mt-2 shrink-0 sm:mt-3">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {label}
      </div>
      <BarRow label="SIP" value={sip} max={max} color="var(--app-primary)" />
      <BarRow
        label="Step-Up"
        value={step}
        max={max}
        color="var(--app-primary-soft)"
      />
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="mb-2 flex items-center gap-2 sm:mb-2.5 sm:gap-3">
      <div className="w-14 shrink-0 text-right text-[9px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)] sm:w-20 sm:text-[10px]">
        {label}
      </div>
      <div className="relative h-2.5 min-w-0 flex-1 rounded bg-[var(--app-bar-track)] sm:h-3.5">
        <div
          className="h-full rounded transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-20 shrink-0 text-right text-[11px] font-medium tabular-nums text-[var(--app-text)] sm:w-28 sm:text-sm">
        {fmtINR(value)}
      </div>
    </div>
  );
}
