"use client";

import { useState } from "react";
import { BarChart3, PieChart } from "lucide-react";
import { useGoalSip } from "@/hooks/use-goal-sip";
import {
  AgeInput,
  ageError,
  BentoGroup,
  BentoSection,
  ChartPane,
  ClientProfileBar,
  CompareChart,
  CompositionChart,
  ComplianceFootnote,
  emailError,
  Field,
  formatINRCurrency,
  ModeTabs,
  MoneyInput,
  nameError,
  PercentInput,
  phoneError,
  rateError,
  ResultsSection,
  ScheduleTable,
  SegmentedChartControl,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  TextInput,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { GoalSipDossier, GOAL_SIP_REPORT_ID } from "@/components/reports/goal-sip-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { generatePdfFromElement } from "@/lib/pdf-generator";

function CorpusMixFooter({
  taxAmt,
  netAfterTax,
}: {
  taxAmt: number;
  netAfterTax: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-2.5 py-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-warn-text)]">
          Capital Gains Tax
        </div>
        <div className="text-xs font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
          {formatINRCurrency(taxAmt)}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-2.5 py-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
          Net Corpus
        </div>
        <div className="text-xs font-semibold tabular-nums text-[var(--app-text)]">
          {formatINRCurrency(netAfterTax)}
        </div>
      </div>
    </div>
  );
}

export function GoalSipPlanner() {
  const [clientName, setClientName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [goal, setGoal] = useState(10_000_000);
  const [tenure, setTenure] = useState(15);
  const [returnPct, setReturnPct] = useState(12);
  const [inflation, setInflation] = useState(5.25);
  const [tax, setTax] = useState(12.5);
  const [stepUp, setStepUp] = useState(10);
  const [useInflAdj, setUseInflAdj] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);

  const clientNameError = nameError(clientName);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const goalError = goal <= 0 ? "Enter your goal amount." : undefined;
  const tenureError =
    tenure < 1 || tenure > 75 ? "Tenure should be between 1 and 75 years." : undefined;
  const returnError =
    rateError(returnPct, "Expected return") ??
    (returnPct <= 0 ? "Enter a valid expected return." : undefined);
  const inflationError = rateError(inflation, "Inflation");
  const taxError = rateError(tax, "Tax");
  const stepUpError = rateError(stepUp, "Step-up");

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    goalError,
    tenureError,
    returnError,
    inflationError,
    taxError,
    stepUpError,
  ].filter((msg): msg is string => Boolean(msg));

  const canCalculate = fieldErrors.length === 0;

  const { result, error, loading } = useGoalSip(
    {
      clientName,
      age,
      goalAmount: goal,
      tenureYears: tenure,
      returnPct,
      inflationPct: inflation,
      taxPct: tax,
      stepUpPct: stepUp,
      useInflationAdjustedGoal: useInflAdj,
    },
    canCalculate,
  );

  const inflAdjGoal = result?.inflAdjGoal ?? 0;
  const targetGoal = result?.targetGoal ?? goal;
  const standardSIP = result?.standard.monthlySip ?? 0;
  const stepUpSIP = result?.stepUp.monthlySip ?? 0;
  const stepUpEndSIP = result?.stepUp.endMonthlySip ?? 0;
  const stdInvested = result?.standard.invested ?? 0;
  const stepInvested = result?.stepUp.invested ?? 0;
  const stdCorpus = result?.standard.maturity ?? 0;
  const stepCorpus = result?.stepUp.maturity ?? 0;
  const stdGain = result?.standard.gain ?? 0;
  const stepGain = result?.stepUp.gain ?? 0;
  const stdTax = result?.standard.tax ?? 0;
  const stepTax = result?.stepUp.tax ?? 0;
  const stdNet = result?.standard.netAfterTax ?? 0;
  const stepNet = result?.stepUp.netAfterTax ?? 0;
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

  const mixSlices = (invested: number, gain: number) => [
    { name: "Invested", value: invested, color: "var(--app-chart-invested)" },
    { name: "Gain", value: gain, color: "var(--app-chart-gain)" },
  ];

  const resetDefaults = () => {
    setClientName("Mr. John Doe");
    setAge(30);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setGoal(10_000_000);
    setTenure(15);
    setReturnPct(12);
    setInflation(5.25);
    setTax(12.5);
    setStepUp(10);
    setUseInflAdj(true);
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      const safe = (clientName || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(GOAL_SIP_REPORT_ID, `goal-sip-planner-${safe || "report"}`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <CalculatorPage
        title="Precision Wealth Engine"
        description="Goal – SIP & Step-Up SIP Simulation with Tax Arbitrage"
        header={
          <ClientProfileBar
            name={clientName}
            age={age}
            email={email}
            phone={phone}
            goal={useInflAdj ? "Inflation-Adjusted Target" : "Stated Target"}
            strategy="Systematic Investment Plan (SIP)"
          />
        }
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={isDownloading}
          />
        }
        form={
          <BentoSection
            sectionId="01"
            title="Financial Assumptions & Modeling Suite"
            description="Interactive multi-parameter engine configured with life-cycle compounding"
            collapsible
            open={openAssumptions}
            onToggle={() => setOpenAssumptions((v) => !v)}
            actions={
              <button
                type="button"
                onClick={resetDefaults}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-emerald-700"
              >
                Reset to Baseline
              </button>
            }
          >
            <BentoGroup
              num="01"
              title="Investor Profile"
              subtitle="KYC Baseline"
              colSpan={4}
              footer={
                <>
                  <span>Age path:</span>
                  <span className="font-bold text-slate-700">
                    {age} → {age + tenure}
                  </span>
                </>
              }
            >
              <div className="mb-4">
                <Field label="Client Name" error={clientNameError}>
                  <TextInput
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={clientNameError ? "border-[var(--app-danger)]" : undefined}
                  />
                </Field>
              </div>
              <div className="mb-4">
                <AgeInput value={age} onChange={setAge} error={clientAgeError} />
              </div>
              <div className="mb-4">
                <Field label="Email" error={clientEmailError}>
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@email.com"
                    className={clientEmailError ? "border-[var(--app-danger)]" : undefined}
                  />
                </Field>
              </div>
              <div className="mb-4">
                <Field label="Phone" error={clientPhoneError}>
                  <TextInput
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={clientPhoneError ? "border-[var(--app-danger)]" : undefined}
                  />
                </Field>
              </div>
              <div className="mb-4">
                <MoneyInput
                  label="Goal amount"
                  value={goal}
                  onChange={setGoal}
                  align="right"
                  error={goalError}
                />
              </div>
              <div className="flex flex-col gap-1.5 border-t border-slate-200/60 pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Goal basis
                </span>
                <ModeTabs
                  fullWidth
                  tabs={[
                    { id: "raw", label: "Stated" },
                    { id: "infl", label: "Inflation-adj" },
                  ]}
                  value={useInflAdj ? "infl" : "raw"}
                  onChange={(id) => setUseInflAdj(id === "infl")}
                />
              </div>
            </BentoGroup>

            <BentoGroup
              num="02"
              title="Accumulation Engine"
              subtitle="SIP Mode"
              colSpan={5}
              footer={
                <>
                  <span>Total Active Target:</span>
                  <span className="font-bold text-brand-700">
                    {canCalculate && result ? formatINRCurrency(targetGoal) : "-"}
                  </span>
                </>
              }
            >
              <div className="flex flex-col gap-4">
                <YearInput
                  label="Investment Tenure (yrs)"
                  value={tenure}
                  min={1}
                  max={75}
                  onChange={setTenure}
                  error={tenureError}
                />
                <PercentInput
                  label="Step-Up (%)"
                  value={stepUp}
                  onChange={setStepUp}
                  hint="Annual SIP increment"
                  error={stepUpError}
                />
              </div>
            </BentoGroup>

            <BentoGroup
              num="03"
              title="Rate Assumptions"
              subtitle="CAGR & Tax"
              colSpan={3}
              footer={
                <>
                  <span>Real Net Yield:</span>
                  <span className="font-bold text-brand-700">
                    {(((1 + returnPct / 100) / (1 + inflation / 100) - 1) * 100).toFixed(2)}% Net
                  </span>
                </>
              }
            >
              <div className="flex flex-col gap-4">
                <PercentInput
                  label="Expected Return (%)"
                  value={returnPct}
                  onChange={setReturnPct}
                  error={returnError}
                />
                <PercentInput
                  label="Inflation (%)"
                  value={inflation}
                  onChange={setInflation}
                  error={inflationError}
                />
                <PercentInput
                  label="Tax Bracket (LTCG %)"
                  value={tax}
                  onChange={setTax}
                  error={taxError}
                />
              </div>
            </BentoGroup>
          </BentoSection>
        }
        results={
          <>
            {error ? (
              <StatusNote tone="error">
                {error}. Start the app with <code>npm run dev</code>.
              </StatusNote>
            ) : null}
            {!canCalculate ? (
              <StatusNote tone="error">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">
                    Fix the inputs above to refresh the calculation
                    {result ? ". Showing the last valid result." : "."}
                  </span>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] font-normal">
                    {fieldErrors.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </StatusNote>
            ) : null}
            {loading && !result && canCalculate ? (
              <StatusNote tone="pending">Calculating…</StatusNote>
            ) : null}
            {result ? (
              <Stack>
                <ResultsSection
                  sectionId="02"
                  title="SIP Milestones"
                  description="Required monthly SIP paths and target corpus after capital gains tax"
                  open={openMilestones}
                  onToggle={() => setOpenMilestones((v) => !v)}
                  meta={
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Horizon: {tenure} Years
                    </span>
                  }
                >
                  <StatGrid>
                    <StatCard
                      title="Standard SIP"
                      value={standardSIP}
                      hint="Required monthly SIP"
                      tone="neutral"
                    />
                    <StatCard
                      title="Step-Up SIP"
                      value={stepUpSIP}
                      hint="Starting monthly SIP"
                      tone="positive"
                      footer={
                        <>
                          Ending SIP after {tenure} years ·{" "}
                          <span className="font-semibold tabular-nums text-emerald-700">
                            {formatINRCurrency(stepUpEndSIP)}
                          </span>
                          /mo
                        </>
                      }
                    />
                    <StatCard
                      title="Target Corpus"
                      value={targetGoal}
                      hint="Net after capital gains tax"
                      tone="positive"
                    />
                  </StatGrid>
                </ResultsSection>

                <ResultsSection
                  sectionId="03"
                  title="SIP Analytics"
                  description="Corpus mix, SIP vs step-up compare, cost of delay, and yearly schedule"
                  open={openAnalytics}
                  onToggle={() => setOpenAnalytics((v) => !v)}
                >
                  <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                      <SegmentedChartControl
                        variant="pill"
                        tabs={[
                          {
                            id: "pie",
                            label: "Corpus Mix",
                            icon: <PieChart className="h-3.5 w-3.5" />,
                            content: (
                              <ChartPane>
                                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
                                  <CompositionChart
                                    title="Standard SIP"
                                    compact
                                    showPercentages
                                    centerLabel="Pre-Tax Corpus"
                                    centerValue={stdCorpus}
                                    slices={mixSlices(stdInvested, stdGain)}
                                    footer={
                                      <CorpusMixFooter taxAmt={stdTax} netAfterTax={stdNet} />
                                    }
                                  />
                                  <CompositionChart
                                    title="Step-Up SIP"
                                    compact
                                    showPercentages
                                    centerLabel="Pre-Tax Corpus"
                                    centerValue={stepCorpus}
                                    slices={mixSlices(stepInvested, stepGain)}
                                    footer={
                                      <CorpusMixFooter taxAmt={stepTax} netAfterTax={stepNet} />
                                    }
                                  />
                                </div>
                              </ChartPane>
                            ),
                          },
                          {
                            id: "bar",
                            label: "Compare",
                            icon: <BarChart3 className="h-3.5 w-3.5" />,
                            content: (
                              <ChartPane>
                                <CompareChart
                                  title="Standard vs Step-Up"
                                  showBarLabels
                                  className="min-h-[280px] flex-1 sm:min-h-[320px]"
                                  data={[
                                    { category: "Invested", sip: stdInvested, step: stepInvested },
                                    { category: "Gain", sip: stdGain, step: stepGain },
                                    {
                                      category: "Pre-Tax Corpus",
                                      sip: stdCorpus,
                                      step: stepCorpus,
                                    },
                                    { category: "Net Corpus", sip: stdNet, step: stepNet },
                                  ]}
                                  series={[
                                    { key: "sip", label: "SIP", color: "var(--app-chart-a)" },
                                    {
                                      key: "step",
                                      label: "Step-Up",
                                      color: "var(--app-chart-b)",
                                    },
                                  ]}
                                />
                              </ChartPane>
                            ),
                          },
                        ]}
                      />
                    </div>

                    <ScheduleTable
                      caption="Cost of Delay"
                      meta="Later start, higher SIP"
                      fillHeight
                      emphasizeRow={(_, index) => index === delays.length - 1}
                      columns={[
                        {
                          key: "mo",
                          header: "Delay",
                          sticky: true,
                          render: (value) => `${Number(value)} Mo`,
                        },
                        {
                          key: "sip",
                          header: "Required SIP",
                          format: "inr",
                          align: "right",
                          tone: "std",
                        },
                        {
                          key: "extra",
                          header: "Additional Cost",
                          format: "inr",
                          align: "right",
                          tone: "warn",
                        },
                      ]}
                      rows={delays}
                    />
                  </div>

                  <div className="mb-3 mt-8 flex flex-col items-center justify-center text-center">
                    <span className="mb-1 rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                      Audit Breakdown
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Year-by-Year Schedule</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      SIP vs Step-up SIP Progression Timeline
                    </p>
                  </div>

                  <ScheduleTable
                    caption="Yearly Schedule"
                    meta={`${combinedSchedule.length} years`}
                    zebra
                    highlightLastRow
                    columns={[
                      { key: "year", header: "Yr", sticky: true },
                      {
                        key: "stdMonthly",
                        header: "Std SIP",
                        format: "inr",
                        align: "right",
                        tone: "std",
                      },
                      {
                        key: "stdYearEnd",
                        header: "Std. End Corpus",
                        format: "inr",
                        align: "right",
                        tone: "std",
                      },
                      {
                        key: "stepMonthly",
                        header: "Step-Up SIP",
                        format: "inr",
                        align: "right",
                        tone: "step",
                      },
                      {
                        key: "stepYearEnd",
                        header: "Step-Up End Corpus",
                        format: "inr",
                        align: "right",
                        tone: "step",
                      },
                    ]}
                    rows={combinedSchedule}
                  />
                </ResultsSection>
              </Stack>
            ) : null}
          </>
        }
        footer={
          <ComplianceFootnote>
            Calculations shown are for illustration purposes only. SIP and step-up projections are
            modeled under the stated return, inflation, and tax assumptions. Actual market returns
            and tax rules can differ. Market investments are subject to risk.
          </ComplianceFootnote>
        }
      />
      {result ? (
        <GoalSipDossier
          data={{
            clientName,
            age,
            email,
            phone,
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
            stepUpEndSIP,
            stdInvested,
            stepInvested,
            stdGain,
            stepGain,
            stdTax,
            stepTax,
            stdCorpus,
            stepCorpus,
            stdNet,
            stepNet,
            stdSchedule,
            stepSchedule,
            delays,
          }}
        />
      ) : null}
    </>
  );
}
