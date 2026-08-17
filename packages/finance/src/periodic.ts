import { fv, monthlyRate } from "./core";
import { capitalGain, capitalGainsTax, netAfterTax } from "./tax";

export type PeriodicInput = {
  amount: number;
  timesPerYear: number;
  years: number;
  annualReturn: number;
  taxRate?: number;
};

export type PeriodicRow = {
  month: number;
  contribution: number;
  contributionFv: number;
};

/**
 * Periodic investment (Nivra Periodic Investment v1).
 * n contributions per year at month 0, interval, 2*interval, ... while month < years*12.
 * Each contribution grows with monthlyRate and FV type=1 for remaining months.
 */
export function calculatePeriodic(input: PeriodicInput): {
  maturity: number;
  totalInvested: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  payments: number;
  schedule: PeriodicRow[];
} {
  const freq = input.timesPerYear;
  if (freq <= 0 || 12 % freq !== 0) {
    throw new Error("timesPerYear must be a positive divisor of 12");
  }
  const interval = 12 / freq;
  const totalMonths = input.years * 12;
  const r = monthlyRate(input.annualReturn);
  const schedule: PeriodicRow[] = [];
  let maturity = 0;
  let totalInvested = 0;
  let payments = 0;

  for (let month = 0; month < totalMonths; month += 1) {
    const contribution = month % interval === 0 ? input.amount : 0;
    if (contribution > 0) {
      payments += 1;
      totalInvested += contribution;
      const contributionFv = fv(r, totalMonths - month, 0, -contribution, 1);
      maturity += contributionFv;
      schedule.push({ month, contribution, contributionFv });
    }
  }

  const taxRate = input.taxRate ?? 0;
  return {
    maturity,
    totalInvested,
    gain: capitalGain(maturity, totalInvested),
    tax: capitalGainsTax(maturity, totalInvested, taxRate),
    netAfterTax: netAfterTax(maturity, totalInvested, taxRate),
    payments,
    schedule,
  };
}
