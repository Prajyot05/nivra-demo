import { fv, monthlyRate, pmt } from "./core";
import { stepUpProjection } from "./stepup";

export type FireCorpusSlice = {
  /** Annual effective return for this sleeve. */
  rate: number;
  amount: number;
};

export type FireEvent = {
  age: number;
  /**
   * Excel event table: T = Q − R where Q=Income, R=Expense.
   * Prefer `income` / `expense`. Legacy `amount`+`type` still accepted.
   */
  income?: number;
  expense?: number;
  amount?: number;
  type?: "Expense" | "Income";
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
  /** Excel "Once every (years)". Default 1. */
  stepUpEveryYears?: number;
  delayMonths?: number;
  /** Major financial events (Excel Events=Yes table). Max 10. */
  events?: FireEvent[];
};

export type FireAgeRow = {
  age: number;
  corpus: number;
  contribution: number;
  withdrawal: number;
  eventAmount: number;
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
  /** Pre-retirement income events grown to retirement (Excel AL37 / C20). */
  eventsCorpusAtRetirement: number;
  balanceCorpus: number;
  additionalLumpsum: number;
  excess: boolean;
  monthlySip: number;
  stepUpStartSip: number;
  sipWithoutCurrent: number;
  totalSipInvested: number;
  delayLumpsum: number;
  delaySip: number;
  /** Lumpsum to fund pre-retirement expense events (Excel AJ37 / C25). */
  eventLumpsum: number;
  /**
   * SIP to fund pre-retirement expense events (Excel AK / C26 + AH32 GoalSeek).
   * One expense → AK39. Multiple → constant SIP to latest expense age.
   */
  eventSip: number;
  /** Age through which `eventSip` runs (max pre-ret expense age). */
  eventSipUntilAge: number;
  preRetEventCount: number;
  schedule: FireAgeRow[];
};

/** Excel T = Q − R (Income − Expense). Expense-only → negative. */
function signedEventAmount(ev: FireEvent): number {
  if (ev.income != null || ev.expense != null) {
    return Math.abs(ev.income ?? 0) - Math.abs(ev.expense ?? 0);
  }
  if (ev.amount != null && ev.amount !== 0) {
    return ev.type === "Expense" ? -Math.abs(ev.amount) : Math.abs(ev.amount);
  }
  return 0;
}

function eventHasValue(ev: FireEvent): boolean {
  return (
    Math.abs(ev.income ?? 0) > 0 ||
    Math.abs(ev.expense ?? 0) > 0 ||
    Math.abs(ev.amount ?? 0) > 0
  );
}

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

/** Net event impact at a calendar age (Expense negative, Income positive). */
function eventSignedAtAge(events: FireEvent[] | undefined, age: number): number {
  if (!events?.length) return 0;
  let total = 0;
  for (const ev of events) {
    if (ev.age === age) total += signedEventAmount(ev);
  }
  return total;
}

/**
 * Pre-retirement income events compounded to retirement (Excel AL39 / AL37).
 * AL39 = IF(AI39>0, FV(InvRet, RetAge-AH39, 0, -AI39, 0), 0)
 */
function preRetIncomeAtRetirement(
  events: FireEvent[] | undefined,
  age: number,
  retirementAge: number,
  annualReturn: number,
): number {
  if (!events?.length) return 0;
  let total = 0;
  for (const ev of events) {
    if (ev.age < age || ev.age > retirementAge) continue;
    const signed = signedEventAmount(ev);
    if (signed <= 0) continue;
    total += fv(annualReturn, retirementAge - ev.age, 0, -signed, 0);
  }
  return total;
}

/**
 * Lumpsum today to fund a pre-retirement expense (Excel AJ39).
 * amount / ( (1+r)^n - ((1+r)^n - 1)*tax )
 */
function preRetExpenseLumpsum(
  amount: number,
  yearsToEvent: number,
  annualReturn: number,
  taxRate: number,
): number {
  if (amount <= 0 || yearsToEvent < 0) return 0;
  if (yearsToEvent === 0) return amount;
  const growth = (1 + annualReturn) ** yearsToEvent;
  const denom = growth - (growth - 1) * taxRate;
  return denom === 0 ? 0 : amount / denom;
}

/**
 * Monthly SIP to fund a pre-retirement expense by event age (Excel AK39).
 */
function preRetExpenseSip(
  amount: number,
  yearsToEvent: number,
  annualReturn: number,
  taxRate: number,
): number {
  if (amount <= 0 || yearsToEvent <= 0) return 0;
  const r = monthlyRate(annualReturn);
  const n = yearsToEvent * 12;
  if (r === 0) return amount / n;
  const annuityDue = (((1 + r) ** n - 1) / r) * (1 + r);
  const denom = annuityDue - (annuityDue - n) * taxRate;
  return denom === 0 ? 0 : amount / denom;
}

/** FV of a beginning-of-period monthly SIP over `nMonths` (Excel type=1 path). */
function sipMaturity(
  monthlySip: number,
  nMonths: number,
  annualReturn: number,
): number {
  if (monthlySip === 0 || nMonths <= 0) return 0;
  const r = monthlyRate(annualReturn);
  let corpus = 0;
  for (let m = 1; m <= nMonths; m += 1) {
    corpus = (corpus + monthlySip) * (1 + r);
  }
  return corpus;
}

function projectEventSipBalance(
  monthlySip: number,
  nMonths: number,
  annualReturn: number,
  withdrawAtMonth: Map<number, number>,
): number {
  const r = monthlyRate(annualReturn);
  let corpus = 0;
  for (let m = 1; m <= nMonths; m += 1) {
    corpus = (corpus + monthlySip) * (1 + r);
    const w = withdrawAtMonth.get(m);
    if (w) corpus -= w;
  }
  return corpus;
}

/**
 * Excel AH32: constant SIP to max pre-ret expense age, GoalSeek end balance to 0.
 * Single expense reproduces AK39. Multiple expenses share one SIP (more efficient than Σ AK).
 */
function goalSeekPreRetEventSip(
  expenses: Array<{ age: number; amount: number }>,
  age: number,
  annualReturn: number,
  taxRate: number,
): { sip: number; untilAge: number } {
  if (expenses.length === 0) return { sip: 0, untilAge: age };

  const sorted = [...expenses].sort((a, b) => a.age - b.age || a.amount - b.amount);
  const untilAge = sorted[sorted.length - 1]!.age;
  const nMonths = Math.max(0, (untilAge - age) * 12);
  if (nMonths <= 0) return { sip: 0, untilAge };

  if (sorted.length === 1) {
    const only = sorted[0]!;
    return {
      sip: preRetExpenseSip(only.amount, only.age - age, annualReturn, taxRate),
      untilAge,
    };
  }

  // Withdraw each event's standalone AK maturity at that age (single-event consistent).
  const withdrawAtMonth = new Map<number, number>();
  for (const ev of sorted) {
    const years = ev.age - age;
    const months = years * 12;
    if (months <= 0) continue;
    const standaloneSip = preRetExpenseSip(ev.amount, years, annualReturn, taxRate);
    const need = sipMaturity(standaloneSip, months, annualReturn);
    withdrawAtMonth.set(months, (withdrawAtMonth.get(months) ?? 0) + need);
  }

  // Affine GoalSeek (same pattern as education requiredEducationSip).
  const at0 = projectEventSipBalance(0, nMonths, annualReturn, withdrawAtMonth);
  const at1 = projectEventSipBalance(1, nMonths, annualReturn, withdrawAtMonth);
  const slope = at1 - at0;
  if (slope === 0) return { sip: 0, untilAge };
  const sip = -at0 / slope;
  return { sip: sip > 0 ? sip : 0, untilAge };
}

function preRetEventFunding(
  events: FireEvent[] | undefined,
  age: number,
  retirementAge: number,
  annualReturn: number,
  taxRate: number,
): { lumpsum: number; sip: number; sipUntilAge: number; count: number } {
  if (!events?.length) return { lumpsum: 0, sip: 0, sipUntilAge: age, count: 0 };

  const pre = events.filter(
    (ev) => ev.age >= age && ev.age <= retirementAge && eventHasValue(ev),
  );
  const expenses: Array<{ age: number; amount: number }> = [];
  let lumpsum = 0;
  for (const ev of pre) {
    const signed = signedEventAmount(ev);
    if (signed >= 0) continue; // income → eventsCorpusAtRetirement
    const amt = -signed;
    expenses.push({ age: ev.age, amount: amt });
    lumpsum += preRetExpenseLumpsum(amt, ev.age - age, annualReturn, taxRate);
  }

  const { sip, untilAge } = goalSeekPreRetEventSip(
    expenses,
    age,
    annualReturn,
    taxRate,
  );

  return {
    lumpsum,
    sip,
    sipUntilAge: untilAge,
    count: pre.length,
  };
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
  retirementAge?: number;
  events?: FireEvent[];
}): number {
  const mFactor = args.monthlyExpenseFactor ?? 1;
  const lFactor = args.lifestyleFactor ?? 1;
  const retAge = args.retirementAge ?? 0;
  let corpus = 0;
  for (let y = args.retiredYears; y >= 1; y -= 1) {
    const abBase = yearlyExpenseAt(
      args.monthlyExpenses,
      args.lifestyleYearly,
      args.inflationRate,
      args.activeYears,
      y,
      mFactor,
      lFactor,
    );
    // Excel AB = Z*12+AA - AE; AE is signed event at retired-year index y (age = retAge + y).
    const eventImpact =
      retAge > 0 ? eventSignedAtAge(args.events, retAge + y) : 0;
    const ab = abBase - eventImpact;
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
 * Flat SIP, step-up SIP (with frequency), delay, age path, and major financial events.
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
  const events = input.events ?? [];

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
          retirementAge: input.retirementAge,
          events,
        });

  const currentAtRetirement = currentValueAtRetirement(input, activeYears);
  const eventsCorpusAtRetirement = preRetIncomeAtRetirement(
    events,
    input.age,
    input.retirementAge,
    input.annualReturn,
  );
  // Excel L11 uses K9 = AC38 - C20 (pre-ret income corpus).
  const balanceCorpus = Math.max(
    0,
    corpusRequired - currentAtRetirement - eventsCorpusAtRetirement,
  );
  const excess =
    corpusRequired > 0 &&
    currentAtRetirement + eventsCorpusAtRetirement >= corpusRequired;

  const additionalLumpsum =
    excess || activeYears === 0 ? 0 : balanceCorpus / (1 + input.annualReturn) ** activeYears;

  const limit = input.limitSipYears ?? 0;
  const sipYears = limit > 0 && limit < activeYears ? limit : activeYears;
  const sipMonths = Math.max(0, sipYears * 12);
  const rM = monthlyRate(input.annualReturn);

  // Excel L15: shorter SIP must accumulate a PV that grows to the gap by retirement.
  const targetForSip =
    limit > 0 && limit < activeYears
      ? balanceCorpus / (1 + input.annualReturn) ** (activeYears - limit)
      : balanceCorpus;

  const monthlySip =
    excess || sipMonths === 0 ? 0 : pmt(rM, sipMonths, 0, -targetForSip, 1);

  const stepUpRate = input.stepUpRate ?? 0.1;
  const stepUpEveryYears = input.stepUpEveryYears ?? 1;
  let stepUpStartSip = 0;
  if (!excess && sipYears > 0 && balanceCorpus > 0) {
    const unit = stepUpProjection({
      startMonthly: 1,
      sipYears,
      annualReturn: input.annualReturn,
      stepUpRate,
      stepUpEveryYears,
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

  const eventFunding = preRetEventFunding(
    events,
    input.age,
    input.retirementAge,
    input.annualReturn,
    input.taxRate,
  );

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
    eventsCorpusAtRetirement,
  });

  return {
    activeYears,
    retiredYears,
    monthlyExpAtRet,
    lifestyleAtRet,
    yearlyExpAtRet,
    corpusRequired,
    currentAtRetirement,
    eventsCorpusAtRetirement,
    balanceCorpus,
    additionalLumpsum,
    excess,
    monthlySip,
    stepUpStartSip,
    sipWithoutCurrent,
    totalSipInvested,
    delayLumpsum,
    delaySip,
    eventLumpsum: eventFunding.lumpsum,
    eventSip: eventFunding.sip,
    eventSipUntilAge: eventFunding.sipUntilAge,
    preRetEventCount: eventFunding.count,
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
    eventsCorpusAtRetirement: number;
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
  const events = input.events ?? [];

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
        addSipCorpus *= 1 + input.annualReturn;
      }
    }
    const contribution =
      y === 0 ? 0 : (curSip + (y <= ctx.sipYears ? addSip : 0)) * 12;
    const corpus =
      sleeveValues.reduce((a, b) => a + b, 0) + sipCorpus + addSipCorpus;
    const eventAmount = eventSignedAtAge(events, age);
    rows.push({
      age,
      corpus,
      contribution,
      withdrawal: 0,
      eventAmount,
      phase: y === ctx.activeYears ? "retire" : "pre",
    });
  }

  let post = ctx.excess
    ? (rows[rows.length - 1]?.corpus ?? ctx.corpusRequired) + ctx.eventsCorpusAtRetirement
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
    const eventAmount = eventSignedAtAge(events, age);
    const ab = expense - eventAmount;
    const withdrawal = ab * (1 + input.taxRate);
    post = post * (1 + input.returnAfterRetirement) - withdrawal;
    if (post < 0) post = 0;
    rows.push({
      age,
      corpus: post,
      contribution: 0,
      withdrawal,
      eventAmount,
      phase: "post",
    });
  }

  return rows;
}
