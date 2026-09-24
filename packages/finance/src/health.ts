import { fv, monthlyRate, pv } from "./core";

export type HealthEvent = {
  age: number;
  amount: number;
  /** Expense reduces corpus (taxed); Income adds. */
  type: "Expense" | "Income";
};

export type HealthInput = {
  currentCorpus: number;
  monthlyExpenses: number;
  monthlyInvestment: number;
  lifestyleYearly: number;
  age: number;
  retirementAge: number;
  survivingAge: number;
  inflationRate: number;
  annualReturn: number;
  returnAfterRetirement: number;
  taxRate: number;
  monthlyExpenseFactor?: number;
  lifestyleFactor?: number;
  retirementBenefit?: number;
  /** Annual growth of monthly investment during active years. */
  savingsGrowthRate?: number;
  events?: HealthEvent[];
};

export type HealthAgeRow = {
  age: number;
  corpus: number;
  yearlyExpense: number;
  eventAmount: number;
  phase: "pre" | "retire" | "post";
};

export type HealthResult = {
  activeYears: number;
  retiredYears: number;
  corpusAtRetirement: number;
  monthlyExpAtRetPlus1: number;
  lifestyleAtRetPlus1: number;
  yearsLasting: number;
  monthsLasting: number;
  remainingAtSurvival: number;
  remainingPvToday: number;
  funded: boolean;
  message: string;
  schedule: HealthAgeRow[];
  gapAtRetirement: number;
};

/**
 * Financial Health Analysis v4 (Unprotected).
 * Yearly retirement loop matches Excel O/Q/R columns; optional events at integer ages.
 */
export function calculateFinancialHealth(input: HealthInput): HealthResult {
  const activeYears = input.retirementAge - input.age;
  const retiredYears = input.survivingAge - input.retirementAge;
  if (activeYears < 0 || retiredYears < 0) {
    throw new Error("Invalid ages: need age ≤ retirementAge ≤ survivingAge");
  }

  const mFactor = input.monthlyExpenseFactor ?? 1;
  const lFactor = input.lifestyleFactor ?? 1;
  const savGf = input.savingsGrowthRate ?? 0;
  const rM = monthlyRate(input.annualReturn);

  // Excel N7: FV corpus (type irrelevant when pmt=0) + FV of SIP annuity due.
  let corpusAtRetirement =
    fv(input.annualReturn, activeYears, 0, -input.currentCorpus, 0) +
    (input.monthlyInvestment > 0 && activeYears > 0
      ? fvGrowingSip(
          rM,
          activeYears * 12,
          input.monthlyInvestment,
          savGf,
        )
      : 0);
  corpusAtRetirement += input.retirementBenefit ?? 0;

  const n21 =
    input.monthlyExpenses * (1 + input.inflationRate) ** activeYears * mFactor;
  const n22 =
    input.lifestyleYearly * (1 + input.inflationRate) ** activeYears * lFactor;
  const monthlyExpAtRetPlus1 = n21 * (1 + input.inflationRate);
  const lifestyleAtRetPlus1 = n22 * (1 + input.inflationRate);

  const eventMap = new Map<number, number>();
  for (const ev of input.events ?? []) {
    const signed = ev.type === "Expense" ? -Math.abs(ev.amount) : Math.abs(ev.amount);
    eventMap.set(ev.age, (eventMap.get(ev.age) ?? 0) + signed);
  }

  const schedule: HealthAgeRow[] = [];

  // Pre-retirement: grow corpus + SIP month-by-month (Excel AS path simplified yearly).
  let pre = input.currentCorpus;
  let monthlySav = input.monthlyInvestment;
  schedule.push({
    age: input.age,
    corpus: pre,
    yearlyExpense: 0,
    eventAmount: 0,
    phase: "pre",
  });
  for (let y = 1; y <= activeYears; y += 1) {
    // Annual FV on opening corpus, then 12 months of SIP (annuity due) — matches N7 composition.
    pre = fv(input.annualReturn, 1, 0, -pre, 0);
    pre += fv(rM, 12, -monthlySav, 0, 1);
    monthlySav *= 1 + savGf;
    schedule.push({
      age: input.age + y,
      corpus: y === activeYears ? corpusAtRetirement : pre,
      yearlyExpense: 0,
      eventAmount: 0,
      phase: y === activeYears ? "retire" : "pre",
    });
  }
  if (activeYears === 0) {
    schedule[0]!.corpus = corpusAtRetirement;
    schedule[0]!.phase = "retire";
  } else {
    schedule[schedule.length - 1]!.corpus = corpusAtRetirement;
  }

  let bal = corpusAtRetirement;
  let yearsLasting = 0;
  for (let y = 1; y <= retiredYears; y += 1) {
    const ageEnd = input.retirementAge + y;
    const income = bal * input.returnAfterRetirement;
    const yearlyExpense =
      n21 * (1 + input.inflationRate) ** y * 12 + n22 * (1 + input.inflationRate) ** y;
    const withdrawal = yearlyExpense * (1 + input.taxRate);
    let eventAmount = eventMap.get(ageEnd) ?? 0;
    if (eventAmount < 0) eventAmount *= 1 + input.taxRate;
    bal = bal + income - withdrawal + eventAmount;
    const broke = bal < 0;
    if (!broke) yearsLasting = y;
    schedule.push({
      age: ageEnd,
      corpus: broke ? 0 : bal,
      yearlyExpense,
      eventAmount,
      phase: "post",
    });
    if (broke) {
      bal = 0;
      break;
    }
  }

  const remainingAtSurvival =
    yearsLasting >= retiredYears ? bal : 0;
  const remainingPvToday =
    remainingAtSurvival > 0
      ? pv(
          input.inflationRate,
          input.survivingAge - input.age,
          0,
          -remainingAtSurvival,
          1,
        )
      : 0;

  const funded = yearsLasting >= retiredYears;
  // Excel-style health states: surplus · exact · shortfall.
  const nearExact =
    funded && remainingAtSurvival <= Math.max(1_000, corpusAtRetirement * 0.001);
  const message = !funded
    ? "You do not have sufficient funds."
    : nearExact
      ? "Your retirement plan is fully funded."
      : "You have more funds than you need.";

  // Gap vs FIRE-style required corpus (for donut): required at ret for same expenses.
  let required = 0;
  for (let y = retiredYears; y >= 1; y -= 1) {
    const ab =
      n21 * (1 + input.inflationRate) ** y * 12 +
      n22 * (1 + input.inflationRate) ** y;
    required = (ab * (1 + input.taxRate) + required) / (1 + input.returnAfterRetirement);
  }
  const gapAtRetirement = Math.max(0, required - corpusAtRetirement);

  return {
    activeYears,
    retiredYears,
    corpusAtRetirement,
    monthlyExpAtRetPlus1,
    lifestyleAtRetPlus1,
    yearsLasting,
    monthsLasting: yearsLasting * 12,
    remainingAtSurvival,
    remainingPvToday,
    funded,
    message,
    schedule,
    gapAtRetirement,
  };
}

/** SIP with optional annual step-up of the monthly amount (Excel SavGF). */
function fvGrowingSip(
  monthlyRateValue: number,
  months: number,
  startMonthly: number,
  annualGrowth: number,
): number {
  if (annualGrowth === 0) {
    return fv(monthlyRateValue, months, -startMonthly, 0, 1);
  }
  let maturity = 0;
  for (let month = 1; month <= months; month += 1) {
    const yearIdx =
      month % 12 === 0 ? month / 12 - 1 : Math.floor(month / 12);
    const monthly = startMonthly * (1 + annualGrowth) ** yearIdx;
    const remaining = months - month + 1;
    maturity += fv(monthlyRateValue, remaining, 0, -monthly, 1);
  }
  return maturity;
}
