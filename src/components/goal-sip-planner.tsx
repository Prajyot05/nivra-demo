"use client";

import { useRef, useState } from "react";
import { useGoalSip } from "@/hooks/use-goal-sip";
import {
  ageError,
  emailError,
  formatINRCurrency,
  formatPercent,
  nameError,
  parseDigits,
  phoneError,
  rateError,
  StatusNote,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { GoalSipDossier, GOAL_SIP_REPORT_ID } from "@/components/reports/goal-sip-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import { WealthHero } from "@/components/wealth/wealth-hero";
import { WealthSection } from "@/components/wealth/wealth-section";
import { WealthMetricCard } from "@/components/wealth/wealth-metric-card";
import { WealthSegmented } from "@/components/wealth/wealth-segmented";
import { WealthFieldShell, wealthInputClass } from "@/components/wealth/wealth-field";
import { DelayCostCards } from "@/components/wealth/delay-cost-cards";
import { WealthDisclaimer } from "@/components/wealth/wealth-disclaimer";
import { WealthScheduleTable } from "@/components/wealth/wealth-schedule-table";
import {
  IconCalendar,
  IconChart,
  IconDelay,
  IconPerson,
  IconRefresh,
  IconSip,
  IconStepUp,
  IconTarget,
  WealthIconMark,
} from "@/components/wealth/wealth-icons";
import {
  WealthAnalyticsPanel,
  type AnalyticsTab,
} from "@/components/wealth/charts/wealth-analytics-panel";
import {
  WEALTH_GOAL_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
  WealthMoneyField,
  WealthProfileGrid,
  WealthYearField,
} from "@/components/wealth";

const GOAL_AMOUNT_MAX = 1000_00_00_000; // ₹1,000 Cr
const GOAL_AMOUNT_MIN = 10_000;
const GOAL_SLIDER_MAX = GOAL_AMOUNT_MAX;
const TENURE_MAX = 75;
const TENURE_SLIDER_MAX = 40;

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
  const [openDelay, setOpenDelay] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("mix");
  const [confirmReset, setConfirmReset] = useState(false);

  const assumptionsRef = useRef<HTMLDivElement>(null);

  const clientNameError = nameError(clientName);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const goalError =
    goal <= 0
      ? "Enter your goal amount."
      : goal > GOAL_AMOUNT_MAX
        ? `Goal amount cannot exceed ${formatINRCurrency(GOAL_AMOUNT_MAX)}.`
        : undefined;
  const tenureError =
    tenure < 1 || tenure > TENURE_MAX
      ? `Tenure should be between 1 and ${TENURE_MAX} years.`
      : undefined;
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

  const realReturnPct = ((1 + returnPct / 100) / (1 + inflation / 100) - 1) * 100;

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
    setConfirmReset(false);
  };

  const goalBasisHint = useInflAdj
    ? `Plans to the future value of today’s goal after ${tenure} years of inflation.`
    : "Keeps the goal in today’s rupees. Does not grow the target with inflation.";

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

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <CalculatorPage
        title="Nivra Wealth"
        description="Goal SIP and Step-Up simulation for advisor-led planning"
        contentClassName="mx-auto flex w-full max-w-[94rem] flex-col gap-5 sm:gap-6"
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={isDownloading}
          />
        }
        header={
          <WealthHero
            clientName={clientName}
            age={age}
            email={email}
            phone={phone}
            goalLabel={useInflAdj ? "Inflation-adjusted value" : "Today’s value"}
            tenure={tenure}
            strategy="Systematic Investment Plan"
            targetCorpus={canCalculate && result ? targetGoal : goal}
            monthlySip={canCalculate && result ? stepUpSIP || standardSIP : 0}
            realReturnPct={realReturnPct}
            onEdit={scrollToAssumptions}
          />
        }
        form={
          <div ref={assumptionsRef}>
            <WealthSection
              id="assumptions"
              badge="01 · Profile"
              title="Investor Profile and Assumptions"
              subtitle="Client identity, goal sequence, and market rate settings"
              className="rounded-xl border-slate-200 shadow-none"
              contentClassName="!px-0 !py-0 !bg-white"
              open={openAssumptions}
              onToggle={() => setOpenAssumptions((v) => !v)}
              mark={
                <WealthIconMark>
                  <IconPerson />
                </WealthIconMark>
              }
              actions={
                confirmReset ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] text-slate-500">Reset to defaults?</span>
                    <button
                      type="button"
                      onClick={resetDefaults}
                      className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-[13px] font-medium text-white transition hover:bg-slate-800"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-500/20"
                  >
                    <IconRefresh className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )
              }
            >
              <div className="px-6 py-4">
                <WealthProfileGrid>
                  <WealthFieldShell label="Client name" error={clientNameError}>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={wealthInputClass}
                      autoComplete="name"
                      aria-required
                    />
                  </WealthFieldShell>
                  <WealthFieldShell
                    label="Age"
                    suffix="Years"
                    error={clientAgeError}
                  >
                    <input
                      inputMode="numeric"
                      value={String(age)}
                      onChange={(e) =>
                        setAge(Math.round(parseDigits(e.target.value)))
                      }
                      className={`${wealthInputClass} !pr-1.5`}
                      aria-required
                    />
                  </WealthFieldShell>
                  <WealthFieldShell label="Email" error={clientEmailError}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@email.com"
                      className={wealthInputClass}
                      autoComplete="email"
                      aria-required
                    />
                  </WealthFieldShell>
                  <WealthFieldShell label="Phone" error={clientPhoneError}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={wealthInputClass}
                      autoComplete="tel"
                      aria-required
                    />
                  </WealthFieldShell>

                  <WealthMoneyField
                    label="Goal amount"
                    value={goal}
                    onChange={(v) =>
                      setGoal(Math.min(GOAL_AMOUNT_MAX, Math.max(0, v)))
                    }
                    error={goalError}
                    max={GOAL_AMOUNT_MAX}
                    slider={{
                      min: GOAL_AMOUNT_MIN,
                      max: GOAL_SLIDER_MAX,
                      step: 25_000,
                      scale: "log",
                      presets: WEALTH_GOAL_PRESETS_DEFAULT,
                    }}
                  />

                  <div className="min-w-0">
                    <div className="mb-1.5 text-[13px] font-medium leading-4 text-slate-600">
                      Goal basis
                    </div>
                    <WealthSegmented
                      fullWidth
                      layoutId="goal-basis-pill"
                      value={useInflAdj ? "infl" : "raw"}
                      onChange={(id) => setUseInflAdj(id === "infl")}
                      options={[
                        { id: "raw", label: "Today’s value" },
                        { id: "infl", label: "Inflation-adjusted" },
                      ]}
                    />
                    <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
                      {goalBasisHint}
                    </p>
                  </div>

                  <WealthYearField
                    label="Investment tenure"
                    value={tenure}
                    onChange={setTenure}
                    min={1}
                    max={TENURE_MAX}
                    error={tenureError}
                    slider={{
                      min: 1,
                      max: TENURE_SLIDER_MAX,
                      step: 1,
                      presets: WEALTH_YEAR_PRESETS_DEFAULT,
                    }}
                  />
                  <WealthFieldShell
                    label="Annual step-up"
                    suffix="%"
                    error={stepUpError}
                  >
                    <input
                      inputMode="decimal"
                      value={String(stepUp)}
                      onChange={(e) => setStepUp(parseDigits(e.target.value))}
                      className={`${wealthInputClass} !pr-1.5`}
                      aria-required
                    />
                  </WealthFieldShell>

                  <WealthFieldShell
                    label="Expected CAGR"
                    suffix="%"
                    error={returnError}
                  >
                    <input
                      inputMode="decimal"
                      value={String(returnPct)}
                      onChange={(e) =>
                        setReturnPct(parseDigits(e.target.value))
                      }
                      className={`${wealthInputClass} !pr-1.5`}
                      aria-required
                    />
                  </WealthFieldShell>
                  <WealthFieldShell
                    label="Inflation"
                    suffix="%"
                    error={inflationError}
                  >
                    <input
                      inputMode="decimal"
                      value={String(inflation)}
                      onChange={(e) =>
                        setInflation(parseDigits(e.target.value))
                      }
                      className={`${wealthInputClass} !pr-1.5`}
                      aria-required
                    />
                  </WealthFieldShell>
                  <WealthFieldShell
                    label="Tax / LTCG"
                    suffix="%"
                    error={taxError}
                  >
                    <input
                      inputMode="decimal"
                      value={String(tax)}
                      onChange={(e) => setTax(parseDigits(e.target.value))}
                      className={`${wealthInputClass} !pr-1.5`}
                      aria-required
                    />
                  </WealthFieldShell>
                </WealthProfileGrid>
              </div>
            </WealthSection>
          </div>
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
              <div className="space-y-5">
                <WealthSection
                  badge="02 · Milestones"
                  title="SIP Milestone Cards"
                  subtitle="Required monthly paths and net target after capital gains tax"
                  open={openMilestones}
                  onToggle={() => setOpenMilestones((v) => !v)}
                  mark={
                    <WealthIconMark tone="emerald">
                      <IconTarget />
                    </WealthIconMark>
                  }
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <WealthMetricCard
                      title="Standard SIP"
                      value={standardSIP}
                      description="Required monthly SIP to reach the target"
                      badge="Flat"
                      tone="neutral"
                      trend="Level contribution each year"
                      mark={
                        <WealthIconMark className="h-7 w-7">
                          <IconSip className="h-3.5 w-3.5" />
                        </WealthIconMark>
                      }
                    />
                    <WealthMetricCard
                      title="Step-Up SIP"
                      value={stepUpSIP}
                      description="Starting monthly SIP with annual step-up"
                      badge={`+${formatPercent(stepUp, 0)} / yr`}
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
                      trend="Lower entry SIP, rising capacity"
                      mark={
                        <WealthIconMark tone="emerald" className="h-7 w-7">
                          <IconStepUp className="h-3.5 w-3.5" />
                        </WealthIconMark>
                      }
                    />
                    <WealthMetricCard
                      title="Target Corpus"
                      value={targetGoal}
                      description="Net after capital gains tax"
                      badge={`${tenure} yr`}
                      tone="accent"
                      trend={
                        useInflAdj
                          ? `From stated ${formatINRCurrency(goal)}`
                          : "Stated goal basis"
                      }
                      mark={
                        <WealthIconMark className="h-7 w-7">
                          <IconTarget className="h-3.5 w-3.5" />
                        </WealthIconMark>
                      }
                    />
                  </div>
                </WealthSection>

                <WealthSection
                  badge="03 · Analytics"
                  title="Wealth Analytics"
                  subtitle="Corpus mix, growth compare, timeline, tax, and inflation views"
                  open={openAnalytics}
                  onToggle={() => setOpenAnalytics((v) => !v)}
                  mark={
                    <WealthIconMark>
                      <IconChart />
                    </WealthIconMark>
                  }
                >
                  <WealthAnalyticsPanel
                    tab={analyticsTab}
                    onTabChange={setAnalyticsTab}
                    stdInvested={stdInvested}
                    stdGain={stdGain}
                    stdCorpus={stdCorpus}
                    stdTax={stdTax}
                    stdNet={stdNet}
                    stepInvested={stepInvested}
                    stepGain={stepGain}
                    stepCorpus={stepCorpus}
                    stepTax={stepTax}
                    stepNet={stepNet}
                    schedule={combinedSchedule}
                    goal={goal}
                    inflAdjGoal={inflAdjGoal}
                    tenure={tenure}
                    inflationPct={inflation}
                  />
                </WealthSection>

                <WealthSection
                  badge="04 · Delay"
                  title="Cost of Delay"
                  subtitle="How waiting 3 to 12 months raises the SIP required"
                  open={openDelay}
                  onToggle={() => setOpenDelay((v) => !v)}
                  mark={
                    <WealthIconMark tone="amber">
                      <IconDelay />
                    </WealthIconMark>
                  }
                >
                  <DelayCostCards delays={delays} baselineSip={standardSIP} />
                </WealthSection>

                <WealthSection
                  badge="05 · Schedule"
                  title="Yearly Investment Schedule"
                  subtitle="Standard vs Step-Up SIP progression by year"
                  open={openSchedule}
                  onToggle={() => setOpenSchedule((v) => !v)}
                  mark={
                    <WealthIconMark>
                      <IconCalendar />
                    </WealthIconMark>
                  }
                >
                  <WealthScheduleTable
                    rows={combinedSchedule}
                    summary={[
                      {
                        label: "Years",
                        value: String(combinedSchedule.length),
                      },
                      {
                        label: "Final Std Corpus",
                        value: formatINRCurrency(stdCorpus),
                        tone: "std",
                      },
                      {
                        label: "Final Step-Up Corpus",
                        value: formatINRCurrency(stepCorpus),
                        tone: "step",
                      },
                      {
                        label: "Step-Up End SIP",
                        value: formatINRCurrency(stepUpEndSIP),
                        tone: "step",
                      },
                    ]}
                  />
                </WealthSection>
              </div>
            ) : null}
          </>
        }
        footer={
          <WealthDisclaimer
            notes={[
              "Unplanned delay permanently compresses the compounding runway under the same return path.",
              "Headline maturity is not purchasing power. Frame conversations on the inflation-adjusted corpus.",
              "Tax is applied on gains only. Net after tax is the amount available to the investor at exit.",
              "Projections are illustrative. Actual market returns and tax rules can differ.",
            ]}
          >
            Figures are for illustration only. SIP and step-up projections use the stated return,
            inflation, and tax assumptions. Markets carry risk; past performance does not guarantee
            future results.
          </WealthDisclaimer>
        }
      />

      {/* Sticky mobile actions */}
      {result ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-[94rem] gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 rounded-[14px] bg-emerald-700 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {isDownloading ? "Exporting…" : "Export PDF"}
            </button>
            <button
              type="button"
              onClick={scrollToAssumptions}
              className="rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Edit
            </button>
          </div>
        </div>
      ) : null}

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
