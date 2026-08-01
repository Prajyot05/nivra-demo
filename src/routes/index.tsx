import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Download, Calendar, Clock, Palette } from "lucide-react";
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
import {
  COLOR_THEMES,
  getColorTheme,
  type ColorThemeId,
} from "@/lib/color-themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Goal SIP Planner — Compare Standard vs Step-Up SIP" },
      {
        name: "description",
        content:
          "Plan and compare Standard and Step-Up SIP requirements side-by-side with tax, inflation and delay-cost analysis.",
      },
      { property: "og:title", content: "Goal SIP Planner" },
      {
        property: "og:description",
        content: "Compare Standard and Step-Up SIP requirements side-by-side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

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

function calcStandardSIP(goal: number, years: number, annualReturn: number) {
  const n = years * 12;
  const r = annualReturn / 100 / 12;
  if (r === 0) return goal / n;
  return (goal * r) / (Math.pow(1 + r, n) - 1);
}

function calcStepUpSIP(
  goal: number,
  years: number,
  annualReturn: number,
  stepUpPct: number,
) {
  const r = annualReturn / 100 / 12;
  const g = stepUpPct / 100;
  let fvFactor = 0;
  for (let year = 0; year < years; year++) {
    const yearlyMultiplier = Math.pow(1 + g, year);
    for (let m = 0; m < 12; m++) {
      const monthsRemaining = (years - year) * 12 - m - 1;
      fvFactor += yearlyMultiplier * Math.pow(1 + r, monthsRemaining);
    }
  }
  return goal / fvFactor;
}

function buildSchedule(
  initial: number,
  years: number,
  annualReturn: number,
  stepUpPct: number,
  isStepUp: boolean,
) {
  const r = annualReturn / 100 / 12;
  const rows: { year: number; monthly: number; yearEnd: number }[] = [];
  let corpus = 0;
  for (let year = 0; year < years; year++) {
    const monthly = isStepUp
      ? initial * Math.pow(1 + stepUpPct / 100, year)
      : initial;
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + r) + monthly;
    }
    rows.push({ year: year + 1, monthly, yearEnd: corpus });
  }
  return rows;
}

function totalInvested(
  initial: number,
  years: number,
  stepUpPct: number,
  isStepUp: boolean,
) {
  if (!isStepUp) return initial * 12 * years;
  let sum = 0;
  for (let y = 0; y < years; y++) {
    sum += initial * Math.pow(1 + stepUpPct / 100, y) * 12;
  }
  return sum;
}

function Index() {
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

  const inflAdjGoal = useMemo(
    () => goal * Math.pow(1 + inflation / 100, tenure),
    [goal, inflation, tenure],
  );

  const targetGoal = useInflAdj ? inflAdjGoal : goal;

  const standardSIP = useMemo(
    () => calcStandardSIP(targetGoal, tenure, returnPct),
    [targetGoal, tenure, returnPct],
  );
  const stepUpSIP = useMemo(
    () => calcStepUpSIP(targetGoal, tenure, returnPct, stepUp),
    [targetGoal, tenure, returnPct, stepUp],
  );

  const stdInvested = totalInvested(standardSIP, tenure, stepUp, false);
  const stepInvested = totalInvested(stepUpSIP, tenure, stepUp, true);
  const stdCorpus = targetGoal;
  const stepCorpus = targetGoal;
  const stdGain = stdCorpus - stdInvested;
  const stepGain = stepCorpus - stepInvested;
  const stdTax = (stdGain * tax) / 100;
  const stepTax = (stepGain * tax) / 100;

  const stdSchedule = useMemo(
    () => buildSchedule(standardSIP, tenure, returnPct, stepUp, false),
    [standardSIP, tenure, returnPct, stepUp],
  );
  const stepSchedule = useMemo(
    () => buildSchedule(stepUpSIP, tenure, returnPct, stepUp, true),
    [stepUpSIP, tenure, returnPct, stepUp],
  );

  const combinedSchedule = useMemo(
    () =>
      stdSchedule.map((row, i) => ({
        year: row.year,
        stdMonthly: row.monthly,
        stdYearEnd: row.yearEnd,
        stepMonthly: stepSchedule[i]?.monthly ?? 0,
        stepYearEnd: stepSchedule[i]?.yearEnd ?? 0,
      })),
    [stdSchedule, stepSchedule],
  );

  const delays = [3, 6, 9, 12].map((mo) => {
    const remaining = tenure - mo / 12;
    const sip = calcStandardSIP(targetGoal, remaining, returnPct);
    return { mo, sip, extra: (sip - standardSIP) * 12 * remaining };
  });

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
      className="flex h-dvh flex-col overflow-y-auto bg-[var(--app-bg)] px-4 py-3 sm:px-6 md:px-8 lg:overflow-hidden lg:px-10"
      style={theme.vars as CSSProperties}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-2 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)] sm:text-3xl">
              Goal SIP Planner
            </h1>
            <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">
              Compare Standard and Step-Up SIP requirements side-by-side.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Palette className="hidden h-4 w-4 text-[var(--app-text-muted)] sm:block" />
              <Select
                value={themeId}
                onValueChange={(v) => setThemeId(v as ColorThemeId)}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_THEMES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] sm:w-auto"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--app-border)]" />

        <div className="mt-3 flex shrink-0 flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-6 sm:px-7 sm:py-7">
          <div className="mb-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
              Financial Assumptions
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-8 sm:gap-5">
            <Field label="Client Name">
              <Input
                className="h-11"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </Field>
            <Field label="Age">
              <Input
                className="h-11"
                type="number"
                value={age}
                onChange={(e) => setAge(+e.target.value)}
              />
            </Field>
            <Field label="Target Goal Amount">
              <Input
                className="h-11"
                inputMode="numeric"
                value={fmtINR(goal)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setGoal(raw === "" ? 0 : Number(raw));
                }}
              />
            </Field>
            <Field label="Tenure (Yrs)">
              <Input
                className="h-11"
                type="number"
                value={tenure}
                onChange={(e) => setTenure(+e.target.value)}
              />
            </Field>
            <Field label="Return (%)">
              <Input
                className="h-11"
                type="number"
                value={returnPct}
                onChange={(e) => setReturnPct(+e.target.value)}
              />
            </Field>
            <Field label="Inflation (%)">
              <Input
                className="h-11"
                type="number"
                value={inflation}
                onChange={(e) => setInflation(+e.target.value)}
              />
            </Field>
            <Field label="Tax (%)">
              <Input
                className="h-11"
                type="number"
                value={tax}
                onChange={(e) => setTax(+e.target.value)}
              />
            </Field>
            <Field label="Step-Up (%)">
              <Input
                className="h-11"
                type="number"
                value={stepUp}
                onChange={(e) => setStepUp(+e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5 flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)]">
              Use Infl. Adj. Goal
            </span>
            <Switch checked={useInflAdj} onCheckedChange={setUseInflAdj} />
            <div
              className={`flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 sm:ml-6 ${
                useInflAdj ? "visible" : "invisible"
              }`}
              aria-hidden={!useInflAdj}
            >
              <Badge
                variant="secondary"
                className="border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-3 py-1.5 text-xs font-medium text-[var(--app-warn-text)] shadow-sm"
              >
                Inflation Adjusted Goal:{" "}
                <span className="ml-1 font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                  ₹{fmtINR(inflAdjGoal)}
                </span>
              </Badge>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--app-text-muted)]">
                <span>
                  Target Goal Amount:{" "}
                  <span className="font-semibold text-[var(--app-text)]">
                    {fmtRsUnit(goal)}
                  </span>
                </span>
                <span className="text-[var(--app-warn-muted)]">
                  Inflation Adjusted Goal:{" "}
                  <span className="font-semibold text-[var(--app-warn-text-strong)]">
                    {fmtRsUnit(inflAdjGoal)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid min-h-[520px] flex-1 grid-cols-1 gap-3 md:gap-4 lg:min-h-0 lg:grid-cols-12">
          {/* Chart + SIP panel */}
          <div className="flex min-h-0 lg:col-span-7">
            <div className="flex min-h-0 w-full flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
              <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
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
                <div className="mt-3 flex min-h-0 flex-1 flex-col justify-evenly">
                  <div className="mb-1 flex items-center justify-end gap-4 text-xs text-[var(--app-text-muted)]">
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
                  <div className="mt-2 flex justify-between pl-12 text-[10px] text-[var(--app-text-subtle)] sm:pl-20 sm:pr-24 sm:text-[11px]">
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
                </div>
              )}
            </div>
          </div>

          {/* Schedule + Delay */}
          <div className="flex min-h-0 flex-col gap-3 lg:col-span-5">
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
              <div className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
                <Calendar className="h-4 w-4 shrink-0" />
                Yearly Schedule
              </div>
              <div className="mt-2 flex shrink-0 flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wider">
                <span className="rounded bg-[var(--app-std-bg)] px-2 py-0.5 text-[var(--app-std-text)]">
                  Standard SIP
                </span>
                <span className="rounded bg-[var(--app-step-bg)] px-2 py-0.5 text-[var(--app-step-text)]">
                  Step-Up SIP
                </span>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-[var(--app-surface)] text-[10px] uppercase tracking-widest">
                        Yr
                      </TableHead>
                      <TableHead className="sticky top-0 bg-[var(--app-std-bg-soft)] text-[10px] uppercase tracking-widest text-[var(--app-std-text)]">
                        Std Monthly
                      </TableHead>
                      <TableHead className="sticky top-0 bg-[var(--app-std-bg-soft)] text-right text-[10px] uppercase tracking-widest text-[var(--app-std-text)]">
                        Std Year-End
                      </TableHead>
                      <TableHead className="sticky top-0 bg-[var(--app-step-bg-soft)] text-[10px] uppercase tracking-widest text-[var(--app-step-text)]">
                        Step Monthly
                      </TableHead>
                      <TableHead className="sticky top-0 bg-[var(--app-step-bg-soft)] text-right text-[10px] uppercase tracking-widest text-[var(--app-step-text)]">
                        Step Year-End
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedSchedule.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="py-1 text-xs font-medium">
                          {row.year}
                        </TableCell>
                        <TableCell className="bg-[var(--app-std-bg-soft)] py-1 text-xs whitespace-nowrap text-[var(--app-std-text-strong)]">
                          ₹{fmtINR(row.stdMonthly)}
                        </TableCell>
                        <TableCell className="bg-[var(--app-std-bg-soft)] py-1 text-right text-xs whitespace-nowrap text-[var(--app-std-text-strong)]">
                          ₹{fmtINR(row.stdYearEnd)}
                        </TableCell>
                        <TableCell className="bg-[var(--app-step-bg-soft)] py-1 text-xs whitespace-nowrap text-[var(--app-step-text-strong)]">
                          ₹{fmtINR(row.stepMonthly)}
                        </TableCell>
                        <TableCell className="bg-[var(--app-step-bg-soft)] py-1 text-right text-xs whitespace-nowrap text-[var(--app-step-text-strong)]">
                          ₹{fmtINR(row.stepYearEnd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Delay
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        SIP Req.
                      </TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-widest">
                        Extra
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delays.map((d) => (
                      <TableRow key={d.mo}>
                        <TableCell className="py-1.5 text-xs whitespace-nowrap">
                          {d.mo} Mo
                        </TableCell>
                        <TableCell className="py-1.5 text-xs whitespace-nowrap">
                          ₹{fmtINR(d.sip)}
                        </TableCell>
                        <TableCell className="py-1.5 text-right text-xs font-medium whitespace-nowrap text-[var(--app-danger)]">
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
    <div className={`rounded-lg ${accent} px-4 py-3 text-center`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)]">
        {title} · Monthly SIP
      </div>
      <div className="mt-1.5 text-2xl font-semibold text-[var(--app-primary-fg)] sm:text-3xl">
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
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
      <div className="shrink-0 text-center text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="mt-2 flex min-h-0 flex-1 items-center justify-center py-1">
        <div className="relative aspect-square h-full max-h-[300px] w-full max-w-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)]">
              Corpus
            </div>
            <div className="text-base font-semibold text-[var(--app-text)] sm:text-lg">
              {fmtINR(corpus)}
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
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-[var(--app-text-muted)]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
          {label}
        </span>
      </div>
      <span className="text-xs font-medium text-[var(--app-text)] sm:text-sm">
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
    <div className="mt-4 sm:mt-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
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
    <div className="mb-3 flex items-center gap-2 sm:gap-3">
      <div className="w-12 shrink-0 text-right text-[9px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)] sm:w-16 sm:text-[10px]">
        {label}
      </div>
      <div className="relative h-3 min-w-0 flex-1 rounded bg-[var(--app-bar-track)] sm:h-3.5">
        <div
          className="h-full rounded"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-20 shrink-0 text-right text-xs font-medium text-[var(--app-text)] sm:w-24 sm:text-sm">
        {fmtINR(value)}
      </div>
    </div>
  );
}
