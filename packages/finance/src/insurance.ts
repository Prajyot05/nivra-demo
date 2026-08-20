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

  const switchFlows: number[] = [];
  for (let year = 1; year <= Math.max(input.policyTerm, tp, termLeft); year += 1) {
    let cf = 0;
    if (year <= remainingPremiums) cf -= sipPmt;
    if (year === 1) cf -= input.surrenderValue;
    if (year <= tp) cf -= input.termPremium;
    if (year === termLeft) cf += investMaturity;
    switchFlows.push(cf);
  }

  return {
    remainingPremiums,
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
      irr: irr(switchFlows, 0.1),
    },
    compare: [
      { category: "Maturity / corpus", keep: keepNet, switch: investMaturity },
      { category: "Tax", keep: keepTax, switch: 0 },
      { category: "Term cost", keep: 0, switch: termCost },
    ],
  };
}
