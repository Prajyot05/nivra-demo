import { fv, irr, rate, xirr } from "./core";
import { capitalGainsTax } from "./tax";

export type InsuranceIrrInput = {
  premium: number;
  payTerm: number;
  corpusAtPayEnd: number;
  policyTerm: number;
  expectedReturn: number;
  taxRate: number;
  startDate?: Date;
};

function addYearsUtc(date: Date, years: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));
}

/** Unprotected Insurance IRR Calculator v1. */
export function calculateInsuranceIrr(input: InsuranceIrrInput) {
  const payTerm = input.payTerm;
  const growthYears = Math.max(0, input.policyTerm - payTerm);
  const maturity = fv(input.expectedReturn, growthYears, 0, -input.corpusAtPayEnd, 1);
  const totalPremium = input.premium * payTerm;
  const gain = Math.max(0, maturity - totalPremium);
  const tax = capitalGainsTax(maturity, totalPremium, input.taxRate);
  const net = maturity - tax;
  const payTermRate =
    input.corpusAtPayEnd <= 0
      ? 0
      : rate(payTerm, -input.premium, 0, input.corpusAtPayEnd, 1);

  const start = input.startDate ?? new Date(Date.UTC(2024, 0, 1));
  const cashflows = [];
  for (let year = 0; year < payTerm; year += 1) {
    cashflows.push({ amount: -input.premium, date: addYearsUtc(start, year) });
  }
  cashflows.push({ amount: maturity, date: addYearsUtc(start, input.policyTerm) });
  const netRate = xirr(cashflows, 0.05);

  const irrValues = Array.from({ length: input.policyTerm }, (_, i) => {
    const year = i + 1;
    if (year <= payTerm) return -input.premium;
    if (year === input.policyTerm) return maturity;
    return 0;
  });

  return {
    totalPremium,
    payTermRate,
    maturity,
    gain,
    tax,
    net,
    xirr: netRate,
    irr: irr(irrValues, 0.05),
  };
}

export type InsuranceTpInput = {
  premium: number;
  payTerm: number;
  yearsPaid: number;
  policyTerm: number;
  yearsToMaturity: number;
  maturityValue: number;
  taxRate: number;
  surrenderValue: number;
  termPremium: number;
  termYears: number;
  expectedReturn: number;
  /** Display-only term sum assured (Excel Sum Assured). */
  termCover?: number;
};

/** Unprotected Insurance Convert to TP and Investment Planner v3. */
export function calculateInsuranceTp(input: InsuranceTpInput) {
  const remainingPremiums = Math.max(0, input.payTerm - input.yearsPaid);
  const keepCashflows: number[] = [];
  for (let year = 1; year <= input.policyTerm; year += 1) {
    if (year <= input.payTerm) keepCashflows.push(-input.premium);
    else if (year === input.policyTerm) keepCashflows.push(input.maturityValue);
    else keepCashflows.push(0);
  }
  const keepIrr = irr(keepCashflows, 0.07);
  const keepTax = input.maturityValue * input.taxRate;
  const keepNet = input.maturityValue * (1 - input.taxRate);

  const termLeft = input.yearsToMaturity;
  const tp = input.termYears;
  const balPmt = remainingPremiums;
  const gRate = input.expectedReturn;
  const premiumForSip = balPmt === 0 ? 0 : input.premium;
  const sipYears = Math.min(tp, balPmt);
  const sipPmt = premiumForSip - input.termPremium;
  const sipAtTp = sipYears > 0 ? fv(gRate, sipYears, -sipPmt, 0, 0) : 0;
  const growYears = tp === 0 ? termLeft : Math.max(0, termLeft - tp);
  const sipGrown = fv(gRate, growYears, 0, -sipAtTp, 0);
  const surrenderGrown = fv(gRate, termLeft, 0, -input.surrenderValue, 0);
  const investMaturity = sipGrown + surrenderGrown;
  const termCost = input.termPremium * tp;
  const totalPaidToDate = input.premium * input.yearsPaid;
  const additionalWealth = investMaturity - keepNet;
  const termCover = input.termCover ?? 0;
  const investmentPeriodYears =
    balPmt === 0 ? termLeft : input.policyTerm - input.payTerm + balPmt;

  // Excel Investment IRR (col AG): full policy-year timeline with original premiums,
  // then term premiums after the remaining premium window, maturity at policy end.
  const termStartYear = input.policyTerm - termLeft + balPmt + 1;
  const termEndYear = tp - balPmt + termStartYear - 1;
  const investIrrFlows: number[] = [];
  for (let year = 1; year <= input.policyTerm; year += 1) {
    let cf = 0;
    if (year <= input.payTerm) cf -= input.premium;
    if (tp > balPmt && year >= termStartYear && year <= termEndYear) {
      cf -= input.termPremium;
    }
    if (year === input.policyTerm) cf += investMaturity;
    investIrrFlows.push(cf);
  }
  const investmentIrr = irr(investIrrFlows, 0.1);

  // Excel Surrender IRR (col AC): premiums through pay term, surrender at elapsed year.
  const surrenderYear = Math.max(1, input.policyTerm - termLeft);
  const surrenderIrrFlows: number[] = [];
  for (let year = 1; year <= input.policyTerm; year += 1) {
    let cf = 0;
    if (year <= input.payTerm) cf -= input.premium;
    if (year === surrenderYear) cf += input.surrenderValue;
    surrenderIrrFlows.push(cf);
  }
  const surrenderIrr = irr(surrenderIrrFlows, 0.1);

  // Corpus path from today (year 0) through yearsToMaturity — matches engine FV split.
  const corpusPath: Array<{ year: number; corpus: number }> = [];
  for (let year = 0; year <= termLeft; year += 1) {
    const surrValue =
      year <= 0 ? input.surrenderValue : fv(gRate, year, 0, -input.surrenderValue, 0);
    let sipValue = 0;
    if (year > 0 && sipYears > 0) {
      const contribYears = Math.min(year, sipYears);
      sipValue = fv(gRate, contribYears, -sipPmt, 0, 0);
      if (year > sipYears) {
        const grown = Math.min(year - sipYears, growYears);
        sipValue = fv(gRate, grown, 0, -sipValue, 0);
      }
    }
    const corpus =
      year === termLeft ? investMaturity : year <= 0 ? input.surrenderValue : surrValue + sipValue;
    corpusPath.push({ year, corpus });
  }

  return {
    remainingPremiums,
    investmentPeriodYears,
    additionalWealth,
    termCover,
    keep: {
      totalPremium: input.premium * input.payTerm,
      maturity: input.maturityValue,
      tax: keepTax,
      net: keepNet,
      irr: keepIrr,
    },
    switch: {
      surrenderValue: input.surrenderValue,
      totalPaidToDate,
      termCost,
      investMaturity,
      /** Excel "Internal Rate of Return (IRR)" / Investment IRR. */
      irr: investmentIrr,
      surrenderIrr,
      sipRedirectAnnual: Math.max(0, sipPmt),
      corpusPath,
    },
    compare: [
      { category: "Final value", keep: keepNet, switch: investMaturity },
      { category: "Tax impact", keep: keepTax, switch: 0 },
      { category: "Term cost", keep: 0, switch: termCost },
    ],
  };
}
