/** Child Education Planner v4 — Unprotected `Education-Plan`. No rounding. */

import { fv, monthlyRate, pv } from "./core";

export type EducationCostRow = {
  age: number;
  classLabel: string;
  cost: number;
};

export type EducationInput = {
  childAge: number;
  annualReturn: number;
  taxRate: number;
  costs: EducationCostRow[];
};

export type EducationScheduleRow = {
  age: number;
  classLabel: string;
  cost: number;
  tax: number;
  withdrawal: number;
  sipCorpus: number;
  sipBalance: number;
  lumpsumBalance: number;
};

export type EducationLeg = {
  monthlySip: number;
  lumpsum: number;
  invested: number;
  tax: number;
  peakCorpus: number;
  remaining: number;
};

export type EducationCompareRow = {
  category: string;
  lumpsum: number;
  sip: number;
};

export type EducationCostChartRow = {
  age: number;
  classLabel: string;
  cost: number;
  tax: number;
};

export type EducationResult = {
  childAge: number;
  lastFeeAge: number;
  sipYears: number;
  totalCost: number;
  totalTax: number;
  totalWithdrawal: number;
  lumpsum: EducationLeg;
  sip: EducationLeg;
  compare: EducationCompareRow[];
  costChart: EducationCostChartRow[];
  schedule: EducationScheduleRow[];
};

/** Sample grid from Unprotected Child Education Planner v4 (cached E11:E29). */
export const DEFAULT_EDUCATION_COSTS: EducationCostRow[] = [
  { age: 3, classLabel: "Nursery", cost: 20_000 },
  { age: 4, classLabel: "LKG", cost: 21_600 },
  { age: 5, classLabel: "UKG", cost: 24_000 },
  { age: 6, classLabel: "Class 1", cost: 25_000 },
  { age: 7, classLabel: "Class 2", cost: 26_200 },
  { age: 8, classLabel: "Class 3", cost: 27_400 },
  { age: 9, classLabel: "Class 4", cost: 28_700 },
  { age: 10, classLabel: "Class 5", cost: 30_000 },
  { age: 11, classLabel: "Class 6", cost: 31_400 },
  { age: 12, classLabel: "Class 7", cost: 32_900 },
  { age: 13, classLabel: "Class 8", cost: 34_400 },
  { age: 14, classLabel: "Class 9", cost: 36_000 },
  { age: 15, classLabel: "Class 10", cost: 37_700 },
  { age: 16, classLabel: "Class 11", cost: 39_400 },
  { age: 17, classLabel: "Class 12", cost: 41_200 },
  { age: 18, classLabel: "College - 1", cost: 2_500_000 },
  { age: 19, classLabel: "College - 2", cost: 2_500_000 },
  { age: 20, classLabel: "College - 3", cost: 2_500_000 },
  { age: 21, classLabel: "College - 4", cost: 7_000_000 },
  { age: 22, classLabel: "College - 5", cost: 0 },
  { age: 23, classLabel: "College - 6", cost: 0 },
  { age: 24, classLabel: "College - 7", cost: 0 },
  { age: 25, classLabel: "College - 8", cost: 0 },
];

type PreparedRow = EducationCostRow & { tax: number; withdrawal: number };

function sortCosts(costs: EducationCostRow[]): EducationCostRow[] {
  const sorted = [...costs].sort((a, b) => a.age - b.age);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].age === sorted[i - 1].age) {
      throw new Error(`Duplicate education cost age: ${sorted[i].age}`);
    }
  }
  return sorted;
}

function lastFeeAgeOf(rows: EducationCostRow[]): number {
  let last = 0;
  for (const row of rows) {
    if (row.cost > 0) last = row.age;
  }
  return last;
}

/** Cap. gains = cost × taxRate for future years; withdrawal = cost + tax (Excel F/G). */
function prepareRows(
  costs: EducationCostRow[],
  childAge: number,
  taxRate: number,
): PreparedRow[] {
  return sortCosts(costs).map((row) => {
    if (row.age <= childAge || row.cost <= 0) {
      return { ...row, tax: 0, withdrawal: 0 };
    }
    const tax = row.cost * taxRate;
    return { ...row, tax, withdrawal: row.cost + tax };
  });
}

/**
 * Backward PV chain (Excel Q, type=0). Q_i is the amount still needed after year i
 * to cover later withdrawals. Today's required lumpsum discounts the first future
 * (G + Q) back to the child's current age — not the circular Q10 self-reference.
 */
export function educationLumpsumRequired(
  rows: PreparedRow[],
  childAge: number,
  annualReturn: number,
): { required: number; remaining: number[] } {
  const n = rows.length;
  const remaining = Array.from({ length: n }, () => 0);
  for (let i = n - 1; i >= 0; i--) {
    if (rows[i].age <= childAge) {
      remaining[i] = 0;
      continue;
    }
    const nextAge = i + 1 < n ? rows[i + 1].age : rows[i].age + 1;
    const nextNeed = i + 1 < n ? rows[i + 1].withdrawal + remaining[i + 1] : 0;
    const nper = nextAge - rows[i].age;
    remaining[i] = nper <= 0 ? 0 : pv(annualReturn, nper, 0, -nextNeed, 0);
  }
  const firstFuture = rows.findIndex((row) => row.age > childAge);
  if (firstFuture < 0) return { required: 0, remaining };
  const nper = rows[firstFuture].age - childAge;
  const need = rows[firstFuture].withdrawal + remaining[firstFuture];
  const required = nper <= 0 ? need : pv(annualReturn, nper, 0, -need, 0);
  return { required, remaining };
}

/**
 * SIP corpus O / balance H. First contributing year:
 *   FV(SIPRate, (age − childAge)×12, −sip, 0, 1)
 * Later years (Excel O12):
 *   FV(SIPRate, gapMonths, −sip, 0, 1) + FV(InvRet, gapYears, 0, −prevH, 1)
 * Rows after last fee year are 0.
 */
export function projectEducationSipForInput(
  input: EducationInput,
  monthlySip: number,
): { corpus: number[]; balance: number[] } {
  const rows = prepareRows(input.costs, input.childAge, input.taxRate);
  const lastFeeAge = lastFeeAgeOf(rows);
  return projectEducationSip(
    rows,
    input.childAge,
    lastFeeAge,
    input.annualReturn,
    monthlySip,
  );
}

export function projectEducationSip(
  rows: PreparedRow[],
  childAge: number,
  lastFeeAge: number,
  annualReturn: number,
  monthlySip: number,
): { corpus: number[]; balance: number[] } {
  const rMonth = monthlyRate(annualReturn);
  const corpus = Array.from({ length: rows.length }, () => 0);
  const balance = Array.from({ length: rows.length }, () => 0);
  let prevAge = childAge;
  let prevH = 0;
  let started = false;
  for (let i = 0; i < rows.length; i++) {
    const age = rows[i].age;
    if (age <= childAge || age > lastFeeAge) continue;
    if (!started) {
      corpus[i] = fv(rMonth, (age - childAge) * 12, -monthlySip, 0, 1);
      started = true;
    } else {
      const gapYears = age - prevAge;
      corpus[i] =
        fv(rMonth, gapYears * 12, -monthlySip, 0, 1) +
        fv(annualReturn, gapYears, 0, -prevH, 1);
    }
    balance[i] = corpus[i] - rows[i].withdrawal;
    prevH = balance[i];
    prevAge = age;
  }
  return { corpus, balance };
}

function lastBalance(balance: number[], rows: PreparedRow[], lastFeeAge: number): number {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].age === lastFeeAge) return balance[i];
  }
  return 0;
}

/**
 * VBA `calcEduSIP` GoalSeeks H at LastFeeYear to 0 by changing EduSIP.
 * SIP vs withdrawals is affine, so two projections solve it exactly.
 */
export function requiredEducationSip(
  rows: PreparedRow[],
  childAge: number,
  lastFeeAge: number,
  annualReturn: number,
): number {
  if (lastFeeAge <= childAge) return 0;
  const at0 = projectEducationSip(rows, childAge, lastFeeAge, annualReturn, 0);
  const at1 = projectEducationSip(rows, childAge, lastFeeAge, annualReturn, 1);
  const h0 = lastBalance(at0.balance, rows, lastFeeAge);
  const h1 = lastBalance(at1.balance, rows, lastFeeAge);
  const slope = h1 - h0;
  if (slope === 0) return 0;
  const monthly = -h0 / slope;
  return monthly > 0 ? monthly : 0;
}

function peak(values: number[]): number {
  let max = 0;
  for (const v of values) {
    if (v > max) max = v;
  }
  return max;
}

export function calculateEducation(input: EducationInput): EducationResult {
  const { childAge, annualReturn, taxRate } = input;
  const rows = prepareRows(input.costs, childAge, taxRate);
  const lastFeeAge = lastFeeAgeOf(rows);
  const sipYears = Math.max(0, lastFeeAge - childAge);
  const { required: lumpsumRequired, remaining: lumpsumRemaining } =
    educationLumpsumRequired(rows, childAge, annualReturn);
  const monthlySip = requiredEducationSip(rows, childAge, lastFeeAge, annualReturn);
  const sipPath = projectEducationSip(rows, childAge, lastFeeAge, annualReturn, monthlySip);

  const totalCost = rows.reduce(
    (sum, row) => sum + (row.age > childAge ? row.cost : 0),
    0,
  );
  const totalTax = rows.reduce((sum, row) => sum + row.tax, 0);
  const totalWithdrawal = rows.reduce((sum, row) => sum + row.withdrawal, 0);
  const sipInvested = monthlySip * 12 * sipYears;
  const sipPeak = peak(sipPath.corpus);
  const lumpsumPeak = peak(lumpsumRemaining);
  const sipRemaining = lastBalance(sipPath.balance, rows, lastFeeAge);
  const lumpsumEnd = lastBalance(lumpsumRemaining, rows, lastFeeAge);

  const lumpsum: EducationLeg = {
    monthlySip: 0,
    lumpsum: lumpsumRequired,
    invested: lumpsumRequired,
    tax: totalTax,
    peakCorpus: lumpsumPeak,
    remaining: lumpsumEnd,
  };
  const sip: EducationLeg = {
    monthlySip,
    lumpsum: 0,
    invested: sipInvested,
    tax: totalTax,
    peakCorpus: sipPeak,
    remaining: sipRemaining,
  };

  const schedule: EducationScheduleRow[] = rows.map((row, i) => ({
    age: row.age,
    classLabel: row.classLabel,
    cost: row.cost,
    tax: row.tax,
    withdrawal: row.withdrawal,
    sipCorpus: sipPath.corpus[i],
    sipBalance: sipPath.balance[i],
    lumpsumBalance: lumpsumRemaining[i],
  }));

  const costChart: EducationCostChartRow[] = rows
    .filter((row) => row.cost > 0)
    .map((row) => ({
      age: row.age,
      classLabel: row.classLabel,
      cost: row.cost,
      tax: row.age > childAge ? row.cost * taxRate : 0,
    }));

  return {
    childAge,
    lastFeeAge,
    sipYears,
    totalCost,
    totalTax,
    totalWithdrawal,
    lumpsum,
    sip,
    compare: [
      { category: "Invested", lumpsum: lumpsum.invested, sip: sip.invested },
      { category: "Cap. gains tax", lumpsum: lumpsum.tax, sip: sip.tax },
      { category: "Peak corpus", lumpsum: lumpsum.peakCorpus, sip: sip.peakCorpus },
    ],
    costChart,
    schedule,
  };
}
