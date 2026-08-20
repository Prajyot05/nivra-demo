import { fv, monthlyRate, pmt } from "./core";
import { stepUpProjection } from "./stepup";

export type FireCorpusSlice = {
  /** Annual effective return for this sleeve. */
  rate: number;
  amount: number;
};

export type FireInput = {
  age: number;
  retirementAge: number;
  survivingAge: number;
  monthlyExpenses: number;
  lifestyleYearly: number;
  /** Lifestyle multiple vs current (1 = same as current). */
  monthlyExpenseFactor?: number;
  lifestyleFactor?: number;
  inflationRate: number;
  annualReturn: number;
  returnAfterRetirement: number;
  taxRate: number;
  corpusSlices?: FireCorpusSlice[];
  currentSipMonthly?: number;
  currentSipReturn?: number;
  /** Cap SIP years; 0 = full active years. */
  limitSipYears?: number;
  stepUpRate?: number;
  delayMonths?: number;
};

export type FireAgeRow = {
  age: number;
  corpus: number;
  contribution: number;
  withdrawal: number;
  phase: "pre" | "retire" | "post";
};

export type FireResult = {
  activeYears: number;
  retiredYears: number;
  monthlyExpAtRet: number;
  lifestyleAtRet: number;
  yearlyExpAtRet: number;
  corpusRequired: number;
  currentAtRetirement: number;
  balanceCorpus: number;
  additionalLumpsum: number;
  excess: boolean;
  monthlySip: number;
  stepUpStartSip: number;
  sipWithoutCurrent: number;
  totalSipInvested: number;
  delayLumpsum: number;
  delaySip: number;
  schedule: FireAgeRow[];
};

function yearlyExpenseAt(
  monthlyExpenses: number,
  lifestyleYearly: number,
  inflationRate: number,
  activeYears: number,
  yearFromRet: number,
  monthlyFactor: number,
  lifestyleFactor: number,
): number {
  const years = activeYears + yearFromRet;
  const monthly = monthlyExpenses * (1 + inflationRate) ** years * monthlyFactor;
  const lifestyle = lifestyleYearly * (1 + inflationRate) ** years * lifestyleFactor;
  return monthly * 12 + lifestyle;
}

/** Backward PV of post-retirement withdrawals (grossed for tax), Excel AC38. */
export function corpusRequiredAtRetirement(args: {
  monthlyExpenses: number;
  lifestyleYearly: number;
  inflationRate: number;
  activeYears: number;
  retiredYears: number;
  returnAfterRetirement: number;
  taxRate: number;
  monthlyExpenseFactor?: number;
  lifestyleFactor?: number;
}): number {
  const mFactor = args.monthlyExpenseFactor ?? 1;
  const lFactor = args.lifestyleFactor ?? 1;
  let corpus = 0;
  for (let y = args.retiredYears; y >= 1; y -= 1) {
    const ab = yearlyExpenseAt(
      args.monthlyExpenses,
      args.lifestyleYearly,
      args.inflationRate,
      args.activeYears,
      y,
      mFactor,
      lFactor,
    );
    corpus = (ab * (1 + args.taxRate) + corpus) / (1 + args.returnAfterRetirement);
  }
  return corpus;
}

function currentValueAtRetirement(input: FireInput, activeYears: number): number {
  let total = 0;
  for (const slice of input.corpusSlices ?? []) {
    if (slice.amount > 0 && slice.rate >= 0) {
      total += fv(slice.rate, activeYears, 0, -slice.amount, 0);
    }
  }
  const sip = input.currentSipMonthly ?? 0;
  const sipRet = input.currentSipReturn ?? 0;
  if (sip > 0 && sipRet >= 0 && activeYears > 0) {
    total += fv(monthlyRate(sipRet), activeYears * 12, -sip, 0, 1);
  }
  return total;
}

/**
 * FIRE Planner v10 (Unprotected sample defaults).
 * Events / GoalSeek buttons omitted — flat SIP, step-up SIP, delay, and age path included.
 */
export function calculateFirePlanner(input: FireInput): FireResult {
  const activeYears = input.retirementAge - input.age;
  const retiredYears = input.survivingAge - input.retirementAge;
  if (activeYears < 0 || retiredYears < 0) {
    throw new Error("Invalid ages: need age ≤ retirementAge ≤ survivingAge");
  }
  if (activeYears > 50 || retiredYears > 50) {
    throw new Error("Active or retired years exceed Excel max of 50");
  }

  const mFactor = input.monthlyExpenseFactor ?? 1;
  const lFactor = input.lifestyleFactor ?? 1;

  const monthlyExpAtRet =
    input.monthlyExpenses * (1 + input.inflationRate) ** (activeYears + 1) * mFactor;
  const lifestyleAtRet =
    input.lifestyleYearly * (1 + input.inflationRate) ** (activeYears + 1) * lFactor;
  const yearlyExpAtRet = monthlyExpAtRet * 12 + lifestyleAtRet;

  const corpusRequired =
    activeYears === 0 && retiredYears === 0
      ? 0
      : corpusRequiredAtRetirement({
          monthlyExpenses: input.monthlyExpenses,
          lifestyleYearly: input.lifestyleYearly,
          inflationRate: input.inflationRate,
          activeYears,
          retiredYears,
          returnAfterRetirement: input.returnAfterRetirement,
          taxRate: input.taxRate,
          monthlyExpenseFactor: mFactor,
          lifestyleFactor: lFactor,
        });

  const currentAtRetirement = currentValueAtRetirement(input, activeYears);
  const balanceCorpus = Math.max(0, corpusRequired - currentAtRetirement);
  const excess = corpusRequired > 0 && currentAtRetirement >= corpusRequired;

  const additionalLumpsum =
    excess || activeYears === 0 ? 0 : balanceCorpus / (1 + input.annualReturn) ** activeYears;

  const limit = input.limitSipYears ?? 0;
  const sipYears =
    limit > 0 && limit < activeYears ? limit : activeYears;
  const sipMonths = Math.max(0, sipYears * 12);
  const rM = monthlyRate(input.annualReturn);

  // Excel L15: shorter SIP must accumulate a PV that grows to the gap by retirement.
  const targetForSip =
    limit > 0 && limit < activeYears
      ? balanceCorpus / (1 + input.annualReturn) ** (activeYears - limit)
      : balanceCorpus;

  const monthlySip =
    excess || sipMonths === 0
      ? 0
      : pmt(rM, sipMonths, 0, -targetForSip, 1);

  const stepUpRate = input.stepUpRate ?? 0.1;
  let stepUpStartSip = 0;
  if (!excess && sipYears > 0 && balanceCorpus > 0) {
    const unit = stepUpProjection({
      startMonthly: 1,
      sipYears,
      annualReturn: input.annualReturn,
      stepUpRate,
    });
    stepUpStartSip = balanceCorpus / unit.maturity;
  }

  const sipWithoutCurrent =
    excess || sipMonths === 0 || corpusRequired <= 0
      ? 0
      : pmt(rM, sipMonths, 0, -corpusRequired, 1);

  const totalSipInvested = monthlySip * sipMonths;

  const delayMonths = input.delayMonths ?? 0;
  let delayLumpsum = 0;
  let delaySip = 0;
  if (!excess && delayMonths > 0 && activeYears > 0 && balanceCorpus > 0) {
    const remainingYears = activeYears - delayMonths / 12;
    if (remainingYears > 0) {
      delayLumpsum = balanceCorpus / (1 + input.annualReturn) ** remainingYears;
      const delaySipYears =
        limit > 0 && limit < activeYears
          ? Math.max(0, limit - delayMonths / 12)
          : remainingYears;
      if (delaySipYears > 0) {
        delaySip = pmt(rM, delaySipYears * 12, 0, -balanceCorpus, 1);
      }
    }
  }

  const schedule = buildFireSchedule(input, {
    activeYears,
    retiredYears,
    corpusRequired,
    balanceCorpus,
    monthlySip,
    sipYears,
    excess,
    mFactor,
    lFactor,
  });

  return {
    activeYears,
    retiredYears,
    monthlyExpAtRet,
    lifestyleAtRet,
    yearlyExpAtRet,
    corpusRequired,
    currentAtRetirement,
    balanceCorpus,
    additionalLumpsum,
    excess,
    monthlySip,
    stepUpStartSip,
    sipWithoutCurrent,
    totalSipInvested,
    delayLumpsum,
    delaySip,
    schedule,
  };
}

function buildFireSchedule(
  input: FireInput,
  ctx: {
    activeYears: number;
    retiredYears: number;
    corpusRequired: number;
    balanceCorpus: number;
    monthlySip: number;
    sipYears: number;
    excess: boolean;
    mFactor: number;
    lFactor: number;
  },
): FireAgeRow[] {
  const rows: FireAgeRow[] = [];
  const rM = monthlyRate(input.annualReturn);
  const slices = (input.corpusSlices ?? []).filter((s) => s.amount > 0);
  let sleeveValues = slices.map((s) => s.amount);
  let sipCorpus = 0;
  const curSip = input.currentSipMonthly ?? 0;
  const curSipR = monthlyRate(input.currentSipReturn ?? 0);
  let addSipCorpus = 0;
  const addSip = ctx.excess ? 0 : ctx.monthlySip;

  for (let y = 0; y <= ctx.activeYears; y += 1) {
    const age = input.age + y;
    if (y > 0) {
      sleeveValues = sleeveValues.map((v, i) => v * (1 + slices[i]!.rate));
      if (curSip > 0) {
        for (let m = 0; m < 12; m += 1) {
          sipCorpus = (sipCorpus + curSip) * (1 + curSipR);
        }
      }
      if (addSip > 0 && y <= ctx.sipYears) {
        for (let m = 0; m < 12; m += 1) {
          addSipCorpus = (addSipCorpus + addSip) * (1 + rM);
        }
      } else if (addSipCorpus > 0) {
        addSipCorpus *= (1 + input.annualReturn);
      }
    }
    const contribution =
      y === 0
        ? 0
        : (curSip + (y <= ctx.sipYears ? addSip : 0)) * 12;
    const corpus =
      sleeveValues.reduce((a, b) => a + b, 0) + sipCorpus + addSipCorpus;
    rows.push({
      age,
      corpus,
      contribution,
      withdrawal: 0,
      phase: y === ctx.activeYears ? "retire" : "pre",
    });
  }

  let post = ctx.excess
    ? rows[rows.length - 1]?.corpus ?? ctx.corpusRequired
    : ctx.corpusRequired;
  if (rows.length > 0) {
    rows[rows.length - 1]!.corpus = post;
  }

  for (let y = 1; y <= ctx.retiredYears; y += 1) {
    const age = input.retirementAge + y;
    const expense = yearlyExpenseAt(
      input.monthlyExpenses,
      input.lifestyleYearly,
      input.inflationRate,
      ctx.activeYears,
      y,
      ctx.mFactor,
      ctx.lFactor,
    );
    const withdrawal = expense * (1 + input.taxRate);
    post = post * (1 + input.returnAfterRetirement) - withdrawal;
    if (post < 0) post = 0;
    rows.push({
      age,
      corpus: post,
      contribution: 0,
      withdrawal,
      phase: "post",
    });
  }

  return rows;
}
