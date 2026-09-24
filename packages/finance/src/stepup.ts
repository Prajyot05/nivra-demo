import { fv, monthlyRate } from "./core";
import { deflate } from "./inflation";
import { capitalGain, capitalGainsTax, netAfterTax } from "./tax";
import type { YearRow } from "./sip";

export type StepUpSipInput = {
  startMonthly: number;
  sipYears: number;
  annualReturn: number;
  stepUpRate: number;
  /** Step the SIP once every N years (Excel "Once every (years)"). Default 1. */
  stepUpEveryYears?: number;
  inflationRate?: number;
  taxRate?: number;
};

/** Excel FIRE L-column step index: floor((month-1) / (everyYears*12)). */
export function stepIndexForMonth(monthNumber: number, everyYears = 1): number {
  const every = Math.max(1, Math.floor(everyYears));
  const everyMonths = every * 12;
  return Math.floor((monthNumber - 1) / everyMonths);
}

export function stepUpMonthly(
  startMonthly: number,
  stepUpRate: number,
  monthNumber: number,
  everyYears = 1,
): number {
  return startMonthly * (1 + stepUpRate) ** stepIndexForMonth(monthNumber, everyYears);
}

/**
 * Step-up SIP (Nivra SIP Step-Up Calculator v1 / Goal SU_SIP).
 * Each month's contribution compounds for remaining months including the current month (FV type=1).
 */
export function stepUpProjection(input: StepUpSipInput): {
  maturity: number;
  totalInvested: number;
  endMonthly: number;
} {
  const r = monthlyRate(input.annualReturn);
  const n = input.sipYears * 12;
  let maturity = 0;
  let totalInvested = 0;
  let endMonthly = 0;
  const everyYears = input.stepUpEveryYears ?? 1;
  for (let month = 1; month <= n; month += 1) {
    const monthly = stepUpMonthly(input.startMonthly, input.stepUpRate, month, everyYears);
    endMonthly = monthly;
    totalInvested += monthly;
    const monthsRemainingIncl = n - month + 1;
    maturity += fv(r, monthsRemainingIncl, 0, -monthly, 1);
  }
  return { maturity, totalInvested, endMonthly };
}

export function calculateStepUpSip(input: StepUpSipInput): {
  startMonthly: number;
  endMonthly: number;
  maturity: number;
  totalInvested: number;
  gain: number;
  inflationAdjusted: number;
  tax: number;
  netAfterTax: number;
  schedule: YearRow[];
} {
  const { maturity, totalInvested, endMonthly } = stepUpProjection(input);
  const inflationRate = input.inflationRate ?? 0;
  const taxRate = input.taxRate ?? 0;
  return {
    startMonthly: input.startMonthly,
    endMonthly,
    maturity,
    totalInvested,
    gain: capitalGain(maturity, totalInvested),
    inflationAdjusted: deflate(maturity, inflationRate, input.sipYears),
    tax: capitalGainsTax(maturity, totalInvested, taxRate),
    netAfterTax: netAfterTax(maturity, totalInvested, taxRate),
    schedule: buildStepUpSchedule(input),
  };
}

function buildStepUpSchedule(input: StepUpSipInput): YearRow[] {
  const r = monthlyRate(input.annualReturn);
  const rows: YearRow[] = [];
  let corpus = 0;
  let invested = 0;
  const n = input.sipYears * 12;
  const everyYears = input.stepUpEveryYears ?? 1;
  for (let year = 0; year < input.sipYears; year += 1) {
    const monthNumber = year * 12 + 1;
    const monthly = stepUpMonthly(input.startMonthly, input.stepUpRate, monthNumber, everyYears);
    for (let m = 0; m < 12; m += 1) {
      corpus += monthly;
      invested += monthly;
      corpus *= 1 + r;
    }
    rows.push({
      year: year + 1,
      monthly,
      investedToDate: invested,
      yearEnd: corpus,
      inflationAdjusted: deflate(corpus, input.inflationRate ?? 0, year + 1),
    });
  }
  void n;
  return rows;
}
