import { monthlyRate, pmt } from "./core";
import { inflate } from "./inflation";
import { capitalGain, capitalGainsTax, netAfterTax } from "./tax";
import { calculateSip, type YearRow } from "./sip";
import { calculateStepUpSip, stepUpProjection } from "./stepup";

export type GoalSipInput = {
  goalAmount: number;
  tenureYears: number;
  annualReturn: number;
  inflationRate: number;
  taxRate: number;
  stepUpRate: number;
  useInflationAdjustedGoal: boolean;
  delayMonths?: number;
};

export type GoalLeg = {
  monthlySip: number;
  endMonthlySip?: number;
  invested: number;
  maturity: number;
  gain: number;
  tax: number;
  netAfterTax: number;
};

export type DelayRow = {
  months: number;
  sipRequired: number;
  extraInvested: number;
};

/**
 * Annuity-due future-value factor for a monthly SIP of 1:
 * ((1+r)^n - 1) / r * (1+r)
 */
export function sipAnnuityDueFactor(monthlyR: number, months: number): number {
  if (months <= 0) return 0;
  if (monthlyR === 0) return months;
  return (((1 + monthlyR) ** months - 1) / monthlyR) * (1 + monthlyR);
}

/**
 * Required monthly SIP so that net-after-tax corpus equals target.
 * Unprotected Goal sheet U27 when tax > 0; else Excel PMT(..., type=1).
 */
export function requiredSip(args: {
  target: number;
  years: number;
  annualReturn: number;
  taxRate?: number;
}): number {
  const months = args.years * 12;
  const r = monthlyRate(args.annualReturn);
  const tax = args.taxRate ?? 0;
  if (tax <= 0) {
    return pmt(r, months, 0, -args.target, 1);
  }
  const factor = sipAnnuityDueFactor(r, months);
  return args.target / (factor - (factor - months) * tax);
}

export function requiredLumpsum(args: {
  target: number;
  years: number;
  annualReturn: number;
}): number {
  return args.target / (1 + args.annualReturn) ** args.years;
}

/** Required starting step-up SIP so net-after-tax corpus equals target. Linear in start amount. */
export function requiredStepUpSip(args: {
  target: number;
  years: number;
  annualReturn: number;
  stepUpRate: number;
  taxRate?: number;
}): number {
  const unit = stepUpProjection({
    startMonthly: 1,
    sipYears: args.years,
    annualReturn: args.annualReturn,
    stepUpRate: args.stepUpRate,
  });
  const tax = args.taxRate ?? 0;
  const denom = unit.maturity * (1 - tax) + tax * unit.totalInvested;
  return args.target / denom;
}

export function calculateGoalSipVsStepUp(input: GoalSipInput): {
  inflAdjGoal: number;
  targetGoal: number;
  standard: GoalLeg;
  stepUp: GoalLeg;
  schedule: Array<{
    year: number;
    stdMonthly: number;
    stdYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
  }>;
  delays: DelayRow[];
} {
  const inflAdjGoal = inflate(input.goalAmount, input.inflationRate, input.tenureYears);
  const targetGoal = input.useInflationAdjustedGoal ? inflAdjGoal : input.goalAmount;

  const monthlySip = requiredSip({
    target: targetGoal,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const startStep = requiredStepUpSip({
    target: targetGoal,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    stepUpRate: input.stepUpRate,
    taxRate: input.taxRate,
  });

  const standardRun = calculateSip(
    {
      monthlyInvestment: monthlySip,
      sipYears: input.tenureYears,
      annualReturn: input.annualReturn,
    },
    input.taxRate,
  );
  const stepRun = calculateStepUpSip({
    startMonthly: startStep,
    sipYears: input.tenureYears,
    annualReturn: input.annualReturn,
    stepUpRate: input.stepUpRate,
    taxRate: input.taxRate,
  });

  const standard: GoalLeg = {
    monthlySip,
    invested: standardRun.totalInvested,
    maturity: standardRun.maturity,
    gain: standardRun.gain,
    tax: standardRun.tax,
    netAfterTax: standardRun.netAfterTax,
  };
  const stepUp: GoalLeg = {
    monthlySip: startStep,
    endMonthlySip: stepRun.endMonthly,
    invested: stepRun.totalInvested,
    maturity: stepRun.maturity,
    gain: stepRun.gain,
    tax: stepRun.tax,
    netAfterTax: stepRun.netAfterTax,
  };

  const schedule = mergeSchedules(standardRun.schedule, stepRun.schedule);

  const delays = [3, 6, 9, 12].map((months) => {
    const remainingMonths = input.tenureYears * 12 - months;
    const remainingYears = remainingMonths / 12;
    const sipRequired = requiredSip({
      target: targetGoal,
      years: remainingYears,
      annualReturn: input.annualReturn,
      taxRate: input.taxRate,
    });
    const extraInvested = sipRequired * remainingMonths - standard.invested;
    return { months, sipRequired, extraInvested };
  });

  return { inflAdjGoal, targetGoal, standard, stepUp, schedule, delays };
}

function mergeSchedules(std: YearRow[], step: YearRow[]) {
  return std.map((row, i) => ({
    year: row.year,
    stdMonthly: row.monthly,
    stdYearEnd: row.yearEnd,
    stepMonthly: step[i]?.monthly ?? 0,
    stepYearEnd: step[i]?.yearEnd ?? 0,
  }));
}
