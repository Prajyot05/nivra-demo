"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WealthSegmented } from "../wealth-segmented";
import {
  IconChart,
  IconDonut,
  IconInflation,
  IconTax,
  IconTimeline,
} from "../wealth-icons";
import { WealthAnalyticsChrome } from "./wealth-analytics-chrome";
import { CorpusMixPanel } from "./corpus-mix-panel";
import { GrowthCompareChart } from "./growth-compare-chart";
import { WealthCompareBars } from "./wealth-compare-bars";
import { WealthTimelineChart } from "./wealth-timeline-chart";
import { InflationImpactChart } from "./inflation-impact-chart";
import { TaxBreakdownBar } from "./tax-breakdown-bar";
import { wealthChart } from "../wealth-tokens";

export type AnalyticsTab = "mix" | "compare" | "timeline" | "taxes" | "inflation";

export function WealthAnalyticsPanel({
  tab,
  onTabChange,
  stdInvested,
  stdGain,
  stdCorpus,
  stdTax,
  stdNet,
  stepInvested,
  stepGain,
  stepCorpus,
  stepTax,
  stepNet,
  schedule,
  goal,
  inflAdjGoal,
  tenure,
  inflationPct,
}: {
  tab: AnalyticsTab;
  onTabChange: (t: AnalyticsTab) => void;
  stdInvested: number;
  stdGain: number;
  stdCorpus: number;
  stdTax: number;
  stdNet: number;
  stepInvested: number;
  stepGain: number;
  stepCorpus: number;
  stepTax: number;
  stepNet: number;
  schedule: Array<{
    year: number;
    stdMonthly: number;
    stdYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
  }>;
  goal: number;
  inflAdjGoal: number;
  tenure: number;
  inflationPct: number;
}) {
  const growthData = schedule.map((r) => ({
    year: r.year,
    standard: r.stdYearEnd,
    stepUp: r.stepYearEnd,
  }));

  let cumStepInvested = 0;
  const timelineData = schedule.map((r) => {
    cumStepInvested += r.stepMonthly * 12;
    return {
      year: r.year,
      corpus: r.stepYearEnd,
      invested: cumStepInvested,
      returns: Math.max(0, r.stepYearEnd - cumStepInvested),
    };
  });

  return (
    <WealthAnalyticsChrome
      tabs={
        <WealthSegmented
          value={tab}
          onChange={onTabChange}
          layoutId="analytics-tab-pill"
          variant="underline"
          options={[
            {
              id: "mix",
              label: "Corpus Mix",
              icon: <IconDonut className="h-3.5 w-3.5" />,
            },
            {
              id: "compare",
              label: "Compare",
              icon: <IconChart className="h-3.5 w-3.5" />,
            },
            {
              id: "timeline",
              label: "Timeline",
              icon: <IconTimeline className="h-3.5 w-3.5" />,
            },
            {
              id: "taxes",
              label: "Taxes",
              icon: <IconTax className="h-3.5 w-3.5" />,
            },
            {
              id: "inflation",
              label: "Inflation",
              icon: <IconInflation className="h-3.5 w-3.5" />,
            },
          ]}
        />
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="space-y-4"
        >
          {tab === "mix" ? (
            <CorpusMixPanel
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
            />
          ) : null}

          {tab === "compare" ? (
            <div className="space-y-4">
              <GrowthCompareChart data={growthData} />
              <WealthCompareBars
                showBarLabels
                data={[
                  { category: "Invested", sip: stdInvested, step: stepInvested },
                  { category: "Gain", sip: stdGain, step: stepGain },
                  { category: "Pre-Tax Corpus", sip: stdCorpus, step: stepCorpus },
                  { category: "Net Corpus", sip: stdNet, step: stepNet },
                ]}
                series={[
                  { key: "sip", label: "SIP", color: wealthChart.standard },
                  { key: "step", label: "Step-Up", color: wealthChart.stepUp },
                ]}
              />
            </div>
          ) : null}

          {tab === "timeline" ? <WealthTimelineChart data={timelineData} /> : null}

          {tab === "taxes" ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <TaxBreakdownBar
                title="Standard SIP"
                invested={stdInvested}
                gain={stdGain}
                tax={stdTax}
                net={stdNet}
              />
              <TaxBreakdownBar
                title="Step-Up SIP"
                invested={stepInvested}
                gain={stepGain}
                tax={stepTax}
                net={stepNet}
              />
            </div>
          ) : null}

          {tab === "inflation" ? (
            <InflationImpactChart
              statedGoal={goal}
              inflAdjGoal={inflAdjGoal}
              tenure={tenure}
              inflationPct={inflationPct}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </WealthAnalyticsChrome>
  );
}
