import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, RotateCcw, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const [view, setView] = useState<"standard" | "stepup">("standard");

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

  const activeSIP = view === "standard" ? standardSIP : stepUpSIP;
  const activeInvested = view === "standard" ? stdInvested : stepInvested;
  const activeGain = view === "standard" ? stdGain : stepGain;
  const activeTax = view === "standard" ? stdTax : stepTax;
  const activeCorpus = view === "standard" ? stdCorpus : stepCorpus;

  const schedule = useMemo(
    () =>
      buildSchedule(
        view === "standard" ? standardSIP : stepUpSIP,
        tenure,
        returnPct,
        stepUp,
        view === "stepup",
      ),
    [view, standardSIP, stepUpSIP, tenure, returnPct, stepUp],
  );

  const delays = [3, 6, 9, 12].map((mo) => {
    const remaining = tenure - mo / 12;
    const sip = calcStandardSIP(targetGoal, remaining, returnPct);
    return { mo, sip, extra: (sip - standardSIP) * 12 * remaining };
  });

  const maxBar = Math.max(stdInvested, stepInvested, stdCorpus, stepCorpus);

  const donutData = [
    { name: "Invested", value: activeInvested, color: "hsl(215 30% 15%)" },
    { name: "Gain", value: activeGain, color: "hsl(158 64% 52%)" },
    { name: "Tax", value: activeTax, color: "hsl(0 72% 60%)" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-start justify-between gap-4 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Goal SIP Planner
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Compare Standard and Step-Up SIP requirements side-by-side.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-6">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
              Financial Assumptions
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Use Infl. Adj. Goal
              </span>
              <Switch checked={useInflAdj} onCheckedChange={setUseInflAdj} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
            <Field label="Client Name">
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </Field>
            <Field label="Age">
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(+e.target.value)}
              />
            </Field>
            <Field label="Target Goal Amount">
              <Input
                type="number"
                value={goal}
                onChange={(e) => setGoal(+e.target.value)}
              />
            </Field>
            <Field label="Tenure (Yrs)">
              <Input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(+e.target.value)}
              />
            </Field>
            <Field label="Return (%)">
              <Input
                type="number"
                value={returnPct}
                onChange={(e) => setReturnPct(+e.target.value)}
              />
            </Field>
            <Field label="Inflation (%)">
              <Input
                type="number"
                value={inflation}
                onChange={(e) => setInflation(+e.target.value)}
              />
            </Field>
            <Field label="Tax (%)">
              <Input
                type="number"
                value={tax}
                onChange={(e) => setTax(+e.target.value)}
              />
            </Field>
            <Field label="Step-Up (%)">
              <Input
                type="number"
                value={stepUp}
                onChange={(e) => setStepUp(+e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            Inflation Adjusted Goal:{" "}
            <span className="text-slate-900">₹{fmtINR(inflAdjGoal)}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "standard" | "stepup")}
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="standard">Standard</TabsTrigger>
                  <TabsTrigger value="stepup">Step-Up</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-5 rounded-lg bg-slate-900 px-5 py-6 text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Monthly SIP Required
                </div>
                <div className="mt-2 text-2xl font-medium text-white">
                  Rs. {fmtINR(activeSIP)}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className="relative h-52 w-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {donutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Corpus
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {fmtINR(activeCorpus)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <LegendRow
                  color="hsl(215 30% 15%)"
                  label="Invested"
                  value={activeInvested}
                />
                <LegendRow
                  color="hsl(158 64% 52%)"
                  label="Gain (Pre-Tax)"
                  value={activeGain}
                />
                <LegendRow
                  color="hsl(0 72% 60%)"
                  label="Capital Gain Tax"
                  value={activeTax}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                  Visual Comparison
                </span>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-900" />
                    SIP
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Step-Up
                  </span>
                </div>
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

              <div className="mt-8 flex justify-between pl-20 pr-24 text-[11px] text-slate-400">
                <span>0</span>
                <span>{fmtLakh(maxBar * 0.25)}</span>
                <span>{fmtLakh(maxBar * 0.5)}</span>
                <span>{fmtLakh(maxBar * 0.75)}</span>
                <span>{fmtLakh(maxBar)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                <Calendar className="h-4 w-4" />
                Yearly Schedule
              </div>

              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "standard" | "stepup")}
                className="mt-4"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="standard">Standard SIP</TabsTrigger>
                  <TabsTrigger value="stepup">Step-Up SIP</TabsTrigger>
                </TabsList>
              </Tabs>

              <ScrollArea className="mt-4 h-56">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Yr
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest">
                        Monthly
                      </TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-widest">
                        Year-End
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="py-1.5 text-xs">
                          {row.year}
                        </TableCell>
                        <TableCell className="py-1.5 text-xs">
                          ₹{fmtINR(row.monthly)}
                        </TableCell>
                        <TableCell className="py-1.5 text-right text-xs">
                          ₹{fmtINR(row.yearEnd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                <Clock className="h-4 w-4" />
                Cost of Delay
              </div>

              <Table className="mt-4">
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
                      <TableCell className="py-2 text-xs">{d.mo} Mo</TableCell>
                      <TableCell className="py-2 text-xs">
                        ₹{fmtINR(d.sip)}
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs font-medium text-red-500">
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
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </Label>
      {children}
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
      <div className="flex items-center gap-2 text-slate-600">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="font-medium text-slate-900">{fmtINR(value)}</span>
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
    <div className="mt-8">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-600">
        {label}
      </div>
      <BarRow label="SIP" value={sip} max={max} color="bg-slate-900" />
      <BarRow label="Step-Up" value={step} max={max} color="bg-slate-400" />
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
    <div className="mb-3 flex items-center gap-3">
      <div className="w-16 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="relative h-6 flex-1 rounded bg-slate-50">
        <div
          className={`h-full rounded ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-24 text-sm font-medium text-slate-900">
        {fmtINR(value)}
      </div>
    </div>
  );
}