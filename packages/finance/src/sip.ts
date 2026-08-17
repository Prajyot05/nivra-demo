import { fv, monthlyRate } from "./core";
import { deflate } from "./inflation";
import { capitalGain, capitalGainsTax, netAfterTax } from "./tax";

export type SipInput = {
  monthlyInvestment: number;
  sipYears: number;
  annualReturn: number;
  /** Total horizon in years (Excel "Total Investment Duration"). Defaults to sipYears. */
  investYears?: number;
  inflationRate?: number;
  delayMonths?: number;
};

export type YearRow = {
  year: number;
  monthly: number;
  investedToDate: number;
  yearEnd: number;
  inflationAdjusted?: number;
};

export type SipResult = {
  monthlyRate: number;
  maturity: number;
  totalInvested: number;
  gain: number;
  inflationAdjusted: number;
  delayedMaturity: number | null;
  costOfDelay: number | null;
  tax: number;
  netAfterTax: number;
  schedule: YearRow[];
};

function sipAnnuityDue(monthly: number, months: number, annualReturn: number): number {
  if (months <= 0) return 0;
  return fv(monthlyRate(annualReturn), months, -monthly, 0, 1);
}

/** Value of a completed SIP corpus after extra whole/fractional years at the annual rate. */
function growLump(amount: number, extraYears: number, annualReturn: number): number {
  if (extraYears === 0) return amount;
  return fv(annualReturn, extraYears, 0, -amount, 1);
}

/**
 * Flat SIP (Nivra SIP Calculator v3).
 * Payments at beginning of month (Excel FV type=1).
 * Monthly rate = (1 + annual)^(1/12) - 1.
 */
export function calculateSip(input: SipInput, taxRate = 0): SipResult {
  const sipMonths = input.sipYears * 12;
  const investYears = input.investYears ?? input.sipYears;
  const investMonths = investYears * 12;
  const delay = input.delayMonths ?? 0;
  const r = monthlyRate(input.annualReturn);

  const sipEndValue = sipAnnuityDue(input.monthlyInvestment, sipMonths, input.annualReturn);
  const extraYears = investYears - input.sipYears;
  const maturity = growLump(sipEndValue, extraYears, input.annualReturn);
  const totalInvested = input.monthlyInvestment * sipMonths;

  let delayedMaturity: number | null = null;
  let costOfDelay: number | null = null;
  if (delay > 0) {
    delayedMaturity = delayedSipValue({
      monthly: input.monthlyInvestment,
      sipMonths,
      investMonths,
      delayMonths: delay,
      annualReturn: input.annualReturn,
      sipEndValue,
    });
    costOfDelay = maturity - delayedMaturity;
  }

  const inflationRate = input.inflationRate ?? 0;
  const inflationAdjusted =
    inflationRate === 0 ? maturity : deflate(maturity, inflationRate, input.sipYears);

  const schedule = buildFlatSipSchedule({
    monthly: input.monthlyInvestment,
    sipYears: input.sipYears,
    investYears,
    annualReturn: input.annualReturn,
    inflationRate,
  });

  return {
    monthlyRate: r,
    maturity,
    totalInvested,
    gain: capitalGain(maturity, totalInvested),
    inflationAdjusted,
    delayedMaturity,
    costOfDelay,
    tax: capitalGainsTax(maturity, totalInvested, taxRate),
    netAfterTax: netAfterTax(maturity, totalInvested, taxRate),
    schedule,
  };
}

function delayedSipValue(args: {
  monthly: number;
  sipMonths: number;
  investMonths: number;
  delayMonths: number;
  annualReturn: number;
  sipEndValue: number;
}): number {
  const { monthly, sipMonths, investMonths, delayMonths, annualReturn, sipEndValue } = args;
  const r = monthlyRate(annualReturn);
  const m = investMonths;
  if (m <= delayMonths) return 0;
  if (m <= sipMonths + delayMonths) {
    return fv(r, m - delayMonths, -monthly, 0, 1);
  }
  return fv(r, m - sipMonths - delayMonths, 0, -sipEndValue, 1);
}

function buildFlatSipSchedule(args: {
  monthly: number;
  sipYears: number;
  investYears: number;
  annualReturn: number;
  inflationRate: number;
}): YearRow[] {
  const r = monthlyRate(args.annualReturn);
  const rows: YearRow[] = [];
  let corpus = 0;
  let invested = 0;
  const totalYears = args.investYears;
  for (let year = 0; year < totalYears; year += 1) {
    const contributing = year < args.sipYears;
    const monthly = contributing ? args.monthly : 0;
    for (let month = 0; month < 12; month += 1) {
      if (contributing) {
        corpus += monthly;
        invested += monthly;
      }
      corpus *= 1 + r;
    }
    const yearEnd = corpus;
    rows.push({
      year: year + 1,
      monthly,
      investedToDate: invested,
      yearEnd,
      inflationAdjusted:
        args.inflationRate === 0
          ? yearEnd
          : yearEnd / (1 + args.inflationRate) ** ((year + 1) * 12 / 12),
    });
  }
  return rows;
}

/** One-time / lumpsum (Nivra One-Time Investment v2). Annual compounding. */
export function calculateLumpsum(input: {
  amount: number;
  years: number;
  annualReturn: number;
  inflationRate?: number;
  delayMonths?: number;
  taxRate?: number;
}): {
  maturity: number;
  totalInvested: number;
  gain: number;
  inflationAdjusted: number;
  inflationAdjustedGain: number;
  delayedMaturity: number | null;
  costOfDelay: number | null;
  tax: number;
  netAfterTax: number;
  schedule: YearRow[];
} {
  const maturity = fv(input.annualReturn, input.years, 0, -input.amount, 1);
  const inflationRate = input.inflationRate ?? 0;
  const inflationAdjusted = deflate(maturity, inflationRate, input.years);
  const delay = input.delayMonths ?? 0;
  let delayedMaturity: number | null = null;
  let costOfDelay: number | null = null;
  if (delay > 0) {
    delayedMaturity = fv(input.annualReturn, input.years - delay / 12, 0, -input.amount, 1);
    costOfDelay = maturity - delayedMaturity;
  }
  const taxRate = input.taxRate ?? 0;
  const schedule: YearRow[] = [];
  for (let year = 1; year <= input.years; year += 1) {
    const yearEnd = input.amount * (1 + input.annualReturn) ** year;
    schedule.push({
      year,
      monthly: 0,
      investedToDate: input.amount,
      yearEnd,
      inflationAdjusted: deflate(yearEnd, inflationRate, year),
    });
  }
  return {
    maturity,
    totalInvested: input.amount,
    gain: capitalGain(maturity, input.amount),
    inflationAdjusted,
    inflationAdjustedGain: inflationAdjusted - input.amount,
    delayedMaturity,
    costOfDelay,
    tax: capitalGainsTax(maturity, input.amount, taxRate),
    netAfterTax: netAfterTax(maturity, input.amount, taxRate),
    schedule,
  };
}
