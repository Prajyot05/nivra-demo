import { monthlyRate, pmt } from "./core";
import { inflate } from "./inflation";
import { calculateSip, calculateLumpsum, type YearRow } from "./sip";
import { calculateStepUpSip, stepUpProjection } from "./stepup";
import { calculatePeriodic } from "./periodic";

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
  taxRate?: number;
}): number {
  const growth = (1 + args.annualReturn) ** args.years;
  const tax = args.taxRate ?? 0;
  if (args.target <= 0) return 0;
  if (tax <= 0) return args.target / growth;
  return args.target / ((1 - tax) * growth + tax);
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

/** Net-after-tax value of an existing corpus: (1 − t)×FV + t×invested. Linear, so slices add. */
export function existingNetCredit(maturity: number, invested: number, taxRate: number): number {
  if (taxRate <= 0) return maturity;
  return (1 - taxRate) * maturity + taxRate * invested;
}

export function residualTarget(target: number, existingCredit: number): number {
  return Math.max(0, target - existingCredit);
}

export type GoalBaseInput = {
  goalAmount: number;
  tenureYears: number;
  annualReturn: number;
  inflationRate: number;
  taxRate: number;
  useInflationAdjustedGoal: boolean;
};

function goalTargets(input: GoalBaseInput): { inflAdjGoal: number; targetGoal: number } {
  const inflAdjGoal = inflate(input.goalAmount, input.inflationRate, input.tenureYears);
  return {
    inflAdjGoal,
    targetGoal: input.useInflationAdjustedGoal ? inflAdjGoal : input.goalAmount,
  };
}

export type FundingLeg = GoalLeg & { lumpsum?: number };

export type GoalCurrentInput = GoalBaseInput & {
  stepUpRate: number;
  currentCorpus?: number;
  currentMonthlySip?: number;
};

/**
 * Goal with current investment (Unprotected LS / SIP / SU_SIP).
 * Existing lumpsum compounds annually; existing SIP is annuity-due.
 * Additional LS / SIP / step-up are solved so combined net after tax = target.
 */
export function calculateGoalWithCurrent(input: GoalCurrentInput): {
  inflAdjGoal: number;
  targetGoal: number;
  existing: {
    corpusFv: number;
    sipFv: number;
    corpusInvested: number;
    sipInvested: number;
    totalFv: number;
    totalInvested: number;
    netCredit: number;
  };
  shortfall: number;
  overfunded: boolean;
  lumpsum: FundingLeg;
  standard: GoalLeg;
  stepUp: GoalLeg;
  schedule: Array<{
    year: number;
    existingEnd: number;
    sipMonthly: number;
    sipYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
    combinedSipEnd: number;
  }>;
} {
  const { inflAdjGoal, targetGoal } = goalTargets(input);
  const corpus = input.currentCorpus ?? 0;
  const currentSip = input.currentMonthlySip ?? 0;

  const lumpRun = calculateLumpsum({
    amount: corpus,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
  });
  const sipRun = calculateSip(
    {
      monthlyInvestment: currentSip,
      sipYears: input.tenureYears,
      annualReturn: input.annualReturn,
    },
    0,
  );

  const existingFv = lumpRun.maturity + sipRun.maturity;
  const existingInvested = lumpRun.totalInvested + sipRun.totalInvested;
  const netCredit = existingNetCredit(existingFv, existingInvested, input.taxRate);
  const shortfall = residualTarget(targetGoal, netCredit);

  const addLumpsum = requiredLumpsum({
    target: shortfall,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const addSip = requiredSip({
    target: shortfall,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const addStep = requiredStepUpSip({
    target: shortfall,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    stepUpRate: input.stepUpRate,
    taxRate: input.taxRate,
  });

  const extraLumpRun = calculateLumpsum({
    amount: addLumpsum,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const extraSipRun = calculateSip(
    {
      monthlyInvestment: addSip,
      sipYears: input.tenureYears,
      annualReturn: input.annualReturn,
    },
    input.taxRate,
  );
  const extraStepRun = calculateStepUpSip({
    startMonthly: addStep,
    sipYears: input.tenureYears,
    annualReturn: input.annualReturn,
    stepUpRate: input.stepUpRate,
    taxRate: input.taxRate,
  });

  const existingSchedule = lumpRun.schedule.map((row, i) => ({
    ...row,
    monthly: row.monthly + (sipRun.schedule[i]?.monthly ?? 0),
    investedToDate: row.investedToDate + (sipRun.schedule[i]?.investedToDate ?? 0),
    yearEnd: row.yearEnd + (sipRun.schedule[i]?.yearEnd ?? 0),
  }));

  return {
    inflAdjGoal,
    targetGoal,
    existing: {
      corpusFv: lumpRun.maturity,
      sipFv: sipRun.maturity,
      corpusInvested: lumpRun.totalInvested,
      sipInvested: sipRun.totalInvested,
      totalFv: existingFv,
      totalInvested: existingInvested,
      netCredit,
    },
    shortfall,
    overfunded: shortfall <= 0 && netCredit > 0,
    lumpsum: {
      lumpsum: addLumpsum,
      monthlySip: 0,
      invested: extraLumpRun.totalInvested,
      maturity: extraLumpRun.maturity,
      gain: extraLumpRun.gain,
      tax: extraLumpRun.tax,
      netAfterTax: extraLumpRun.netAfterTax,
    },
    standard: {
      monthlySip: addSip,
      invested: extraSipRun.totalInvested,
      maturity: extraSipRun.maturity,
      gain: extraSipRun.gain,
      tax: extraSipRun.tax,
      netAfterTax: extraSipRun.netAfterTax,
    },
    stepUp: {
      monthlySip: addStep,
      endMonthlySip: extraStepRun.endMonthly,
      invested: extraStepRun.totalInvested,
      maturity: extraStepRun.maturity,
      gain: extraStepRun.gain,
      tax: extraStepRun.tax,
      netAfterTax: extraStepRun.netAfterTax,
    },
    schedule: extraSipRun.schedule.map((row, i) => ({
      year: row.year,
      existingEnd: existingSchedule[i]?.yearEnd ?? 0,
      sipMonthly: row.monthly,
      sipYearEnd: row.yearEnd,
      stepMonthly: extraStepRun.schedule[i]?.monthly ?? 0,
      stepYearEnd: extraStepRun.schedule[i]?.yearEnd ?? 0,
      combinedSipEnd: (existingSchedule[i]?.yearEnd ?? 0) + row.yearEnd,
    })),
  };
}

export type GoalLsSipInput = GoalBaseInput & {
  stepUpRate: number;
  currentCorpus?: number;
  extraLumpsum?: number;
};

/**
 * Goal with current corpus + optional extra lumpsum, then remaining SIP
 * (Unprotected Goal LS–SIP Options). Also returns the all-LS and all-SIP legs.
 */
export function calculateGoalLsSipOptions(input: GoalLsSipInput): {
  inflAdjGoal: number;
  targetGoal: number;
  existingCredit: number;
  shortfall: number;
  extraLumpsum: number;
  extraLumpsumFv: number;
  mixShortfall: number;
  allLumpsum: number;
  allSip: number;
  mixSip: number;
  mixStepUp: number;
  mixStepUpEnd: number;
  standard: GoalLeg;
  stepUp: GoalLeg;
  schedule: Array<{
    year: number;
    extraLumpEnd: number;
    sipMonthly: number;
    sipYearEnd: number;
    combinedEnd: number;
  }>;
} {
  const withExtra = calculateGoalWithCurrent({
    ...input,
    currentCorpus: (input.currentCorpus ?? 0) + (input.extraLumpsum ?? 0),
    currentMonthlySip: 0,
  });
  const withoutExtra = calculateGoalWithCurrent({
    ...input,
    currentCorpus: input.currentCorpus ?? 0,
    currentMonthlySip: 0,
  });
  const extra = input.extraLumpsum ?? 0;
  const extraRun = calculateLumpsum({
    amount: extra,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
  });

  return {
    inflAdjGoal: withExtra.inflAdjGoal,
    targetGoal: withExtra.targetGoal,
    existingCredit: withoutExtra.existing.netCredit,
    shortfall: withoutExtra.shortfall,
    extraLumpsum: extra,
    extraLumpsumFv: extraRun.maturity,
    mixShortfall: withExtra.shortfall,
    allLumpsum: withoutExtra.lumpsum.lumpsum ?? 0,
    allSip: withoutExtra.standard.monthlySip,
    mixSip: withExtra.standard.monthlySip,
    mixStepUp: withExtra.stepUp.monthlySip,
    mixStepUpEnd: withExtra.stepUp.endMonthlySip ?? 0,
    standard: withExtra.standard,
    stepUp: withExtra.stepUp,
    schedule: withExtra.schedule.map((row, i) => ({
      year: row.year,
      extraLumpEnd: extraRun.schedule[i]?.yearEnd ?? 0,
      sipMonthly: row.sipMonthly,
      sipYearEnd: row.sipYearEnd,
      combinedEnd:
        (extraRun.schedule[i]?.yearEnd ?? 0) +
        (withoutExtra.schedule[i]?.existingEnd ?? 0) +
        row.sipYearEnd,
    })),
  };
}

export type GoalExistingSipInput = GoalBaseInput & {
  stepUpRate: number;
  currentMonthlySip: number;
};

/** Already contributing a SIP; compute the additional SIP / step-up to hit the goal. */
export function calculateGoalExistingSip(input: GoalExistingSipInput) {
  return calculateGoalWithCurrent({
    ...input,
    currentCorpus: 0,
    currentMonthlySip: input.currentMonthlySip,
  });
}

export type GoalPeriodicInput = GoalBaseInput & {
  stepUpRate: number;
  amount: number;
  timesPerYear: number;
};

/**
 * Periodic lumpsums already planned (Unprotected Goal Periodic Lumpsum).
 * Remaining SIP / step-up cover the shortfall after those contributions.
 */
export function calculateGoalPeriodicLumpsum(input: GoalPeriodicInput): {
  inflAdjGoal: number;
  targetGoal: number;
  periodic: {
    maturity: number;
    totalInvested: number;
    payments: number;
    netCredit: number;
  };
  shortfall: number;
  overfunded: boolean;
  standard: GoalLeg;
  stepUp: GoalLeg;
  lumpsum: FundingLeg;
  schedule: Array<{
    year: number;
    sipMonthly: number;
    sipYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
  }>;
} {
  const { inflAdjGoal, targetGoal } = goalTargets(input);
  const periodic = calculatePeriodic({
    amount: input.amount,
    timesPerYear: input.timesPerYear,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
  });
  const netCredit = existingNetCredit(periodic.maturity, periodic.totalInvested, input.taxRate);
  const shortfall = residualTarget(targetGoal, netCredit);

  const addLumpsum = requiredLumpsum({
    target: shortfall,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const addSip = requiredSip({
    target: shortfall,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const addStep = requiredStepUpSip({
    target: shortfall,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    stepUpRate: input.stepUpRate,
    taxRate: input.taxRate,
  });

  const extraLumpRun = calculateLumpsum({
    amount: addLumpsum,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const extraSipRun = calculateSip(
    {
      monthlyInvestment: addSip,
      sipYears: input.tenureYears,
      annualReturn: input.annualReturn,
    },
    input.taxRate,
  );
  const extraStepRun = calculateStepUpSip({
    startMonthly: addStep,
    sipYears: input.tenureYears,
    annualReturn: input.annualReturn,
    stepUpRate: input.stepUpRate,
    taxRate: input.taxRate,
  });

  return {
    inflAdjGoal,
    targetGoal,
    periodic: {
      maturity: periodic.maturity,
      totalInvested: periodic.totalInvested,
      payments: periodic.payments,
      netCredit,
    },
    shortfall,
    overfunded: shortfall <= 0 && netCredit > 0,
    lumpsum: {
      lumpsum: addLumpsum,
      monthlySip: 0,
      invested: extraLumpRun.totalInvested,
      maturity: extraLumpRun.maturity,
      gain: extraLumpRun.gain,
      tax: extraLumpRun.tax,
      netAfterTax: extraLumpRun.netAfterTax,
    },
    standard: {
      monthlySip: addSip,
      invested: extraSipRun.totalInvested,
      maturity: extraSipRun.maturity,
      gain: extraSipRun.gain,
      tax: extraSipRun.tax,
      netAfterTax: extraSipRun.netAfterTax,
    },
    stepUp: {
      monthlySip: addStep,
      endMonthlySip: extraStepRun.endMonthly,
      invested: extraStepRun.totalInvested,
      maturity: extraStepRun.maturity,
      gain: extraStepRun.gain,
      tax: extraStepRun.tax,
      netAfterTax: extraStepRun.netAfterTax,
    },
    schedule: extraSipRun.schedule.map((row, i) => ({
      year: row.year,
      sipMonthly: row.monthly,
      sipYearEnd: row.yearEnd,
      stepMonthly: extraStepRun.schedule[i]?.monthly ?? 0,
      stepYearEnd: extraStepRun.schedule[i]?.yearEnd ?? 0,
    })),
  };
}

export type GoalCompoundingInput = GoalBaseInput & {
  extraYears?: number;
};

/**
 * Power of compounding / growth steps (Unprotected Growth Steps).
 * Required SIP and lumpsum paths year-by-year, plus extra compounding after the goal year.
 */
export function calculateGoalCompounding(input: GoalCompoundingInput): {
  inflAdjGoal: number;
  targetGoal: number;
  extraYears: number;
  standard: GoalLeg;
  lumpsum: FundingLeg;
  sipAfterExtra: number;
  lumpsumAfterExtra: number;
  schedule: Array<{
    year: number;
    sipMonthly: number;
    sipYearEnd: number;
    lumpsumEnd: number;
  }>;
  delays: DelayRow[];
} {
  const { inflAdjGoal, targetGoal } = goalTargets(input);
  const extraYears = input.extraYears ?? 5;
  const monthlySip = requiredSip({
    target: targetGoal,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const lumpsum = requiredLumpsum({
    target: targetGoal,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const sipRun = calculateSip(
    {
      monthlyInvestment: monthlySip,
      sipYears: input.tenureYears,
      investYears: input.tenureYears + extraYears,
      annualReturn: input.annualReturn,
    },
    input.taxRate,
  );
  const lumpRun = calculateLumpsum({
    amount: lumpsum,
    years: input.tenureYears + extraYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });
  const sipAtGoal = calculateSip(
    {
      monthlyInvestment: monthlySip,
      sipYears: input.tenureYears,
      annualReturn: input.annualReturn,
    },
    input.taxRate,
  );
  const lumpAtGoal = calculateLumpsum({
    amount: lumpsum,
    years: input.tenureYears,
    annualReturn: input.annualReturn,
    taxRate: input.taxRate,
  });

  const delays = [3, 6, 9, 12].map((months) => {
    const remainingMonths = input.tenureYears * 12 - months;
    const remainingYears = remainingMonths / 12;
    const sipRequired =
      remainingYears > 0
        ? requiredSip({
            target: targetGoal,
            years: remainingYears,
            annualReturn: input.annualReturn,
            taxRate: input.taxRate,
          })
        : 0;
    const extraInvested = sipRequired * Math.max(0, remainingMonths) - sipAtGoal.totalInvested;
    return { months, sipRequired, extraInvested };
  });

  const years = input.tenureYears + extraYears;
  const schedule: Array<{
    year: number;
    sipMonthly: number;
    sipYearEnd: number;
    lumpsumEnd: number;
  }> = [];
  for (let year = 1; year <= years; year += 1) {
    schedule.push({
      year,
      sipMonthly: sipRun.schedule[year - 1]?.monthly ?? 0,
      sipYearEnd: sipRun.schedule[year - 1]?.yearEnd ?? 0,
      lumpsumEnd: lumpRun.schedule[year - 1]?.yearEnd ?? 0,
    });
  }

  return {
    inflAdjGoal,
    targetGoal,
    extraYears,
    standard: {
      monthlySip,
      invested: sipAtGoal.totalInvested,
      maturity: sipAtGoal.maturity,
      gain: sipAtGoal.gain,
      tax: sipAtGoal.tax,
      netAfterTax: sipAtGoal.netAfterTax,
    },
    lumpsum: {
      lumpsum,
      monthlySip: 0,
      invested: lumpAtGoal.totalInvested,
      maturity: lumpAtGoal.maturity,
      gain: lumpAtGoal.gain,
      tax: lumpAtGoal.tax,
      netAfterTax: lumpAtGoal.netAfterTax,
    },
    sipAfterExtra: sipRun.maturity,
    lumpsumAfterExtra: lumpRun.maturity,
    schedule,
    delays,
  };
}
