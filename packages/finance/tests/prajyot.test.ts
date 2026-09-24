import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateMfVsFd } from "../src/mf-fd";
import {
  calculateAmortWithYearlyExtra,
  calculateExtraVsInvest,
  calculateInterestRecovery,
} from "../src/amort";
import { calculateVehicleLoan } from "../src/vehicle";
import { calculateInsuranceIrr, calculateInsuranceTp } from "../src/insurance";
import { calculateMultiGoalAssign } from "../src/multi-goal";
import { calculateMultiWithdrawals } from "../src/withdrawals";
import { requiredSip } from "../src/goal";
import { fv, irr, xirr } from "../src/core";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("MF vs FD Unprotected v1 sample (15 days, 5% vs 3%)", () => {
  const result = calculateMfVsFd({
    amount: 1_000_000_000,
    days: 15,
    mfRate: 0.05,
    fdRate: 0.03,
    mfTaxRate: 0.2,
    fdTaxRate: 0.25,
  });
  close(result.mf.preTax, 2054794.5205479451);
  close(result.mf.postTax, 1643835.616438356);
  close(result.fd.postTax, 924657.53424657532);
  close(result.mfAdvantage, 719178.08219178068);
});

test("yearly extra prepay Unprotected v1 sample (1.5Cr, 5y, 10%)", () => {
  const result = calculateAmortWithYearlyExtra({
    principal: 15_000_000,
    years: 5,
    annualRate: 0.1,
    yearlyExtra: 318705.67,
    recoverReturn: 0.12,
  });
  close(result.emi, 318705.67066902522);
  assert.equal(result.monthsPaid, 55);
  close(result.totalExtra, 1_274_822.68, 1e-8);
  close(result.recoverSip, 50828.071788261273, 1e-8);
  assert.ok(result.interestSaved > 300_000);
});

test("extra vs invest Unprotected v2 sample", () => {
  const result = calculateExtraVsInvest({
    principal: 20_000_000,
    years: 20,
    annualRate: 0.085,
    extraAmount: 5_000_000,
    extraMonth: 49,
    investReturn: 0.09,
    taxRate: 0.125,
    incomeTaxRate: 0.2,
  });
  close(result.emi, 173564.64667310659);
  close(result.corpusAfterTax, 17870792.229196146, 1e-8);
  close(result.option2Saving, 12870792.229196146, 1e-8);
  close(result.option1Saving, 7405652.7025516108, 1e-6);
});

test("interest recovery v7 proposed sample", () => {
  const result = calculateInterestRecovery({
    principal: 20_000_000,
    years: 20,
    annualRate: 0.085,
    proposedYears: 15,
    sipReturn: 0.12,
  });
  close(result.baselineEmi, 173564.64667310659);
  close(result.proposedEmi, 196947.91158511865);
  close(result.proposedInterest, 15450624.085321359, 1e-8);
  close(result.monthlySip, 32463.972980333936, 1e-8);
  close(result.sipAtHorizon, 27229278.857015714, 1e-8);
});

test("vehicle loan Full Set Veh-Loan sample", () => {
  const result = calculateVehicleLoan({
    onRoadCost: 3_500_000,
    loanAmount: 2_800_000,
    annualRate: 0.085,
    years: 5,
    incomeTaxRate: 0.2,
    depreciationRate: 0.15,
    fdRate: 0.07,
    debtRate: 0.08,
    conservativeRate: 0.09,
    equityRate: 0.12,
    fdTaxRate: 0.2,
    debtTaxRate: 0.25,
    conservativeTaxRate: 0.125,
    equityTaxRate: 0.125,
  });
  close(result.emi, 57446.2877157435);
  close(result.totalDepreciation, 1947031.40625);
  close(result.totalTaxSaved, 518761.73383892199, 1e-8);
  const equity = result.options.find((o) => o.name === "Equity");
  close(equity!.financialBenefit, 1739721.594734313, 1e-8);
  close(result.options[0].financialBenefit, 389406.28125, 1e-8);
});

test("insurance IRR Unprotected v1 sample", () => {
  const result = calculateInsuranceIrr({
    premium: 200_000,
    payTerm: 5,
    corpusAtPayEnd: 1_160_000,
    policyTerm: 20,
    expectedReturn: 0.11,
    taxRate: 0.125,
    startDate: new Date(Date.UTC(2024, 0, 1)),
  });
  close(result.maturity, 5550123.806471712);
  close(result.gain, 4550123.806471712);
  close(result.tax, 568765.47580896399);
  close(result.payTermRate, 0.049888224819079403, 1e-6);
  close(result.xirr, 0.099275439977645874, 1e-4);
});

test("insurance TP Unprotected v3 keep net and switch corpus", () => {
  const result = calculateInsuranceTp({
    premium: 300_000,
    payTerm: 5,
    yearsPaid: 3,
    policyTerm: 20,
    yearsToMaturity: 11,
    maturityValue: 5_000_000,
    taxRate: 0.2,
    surrenderValue: 3_000_000,
    termPremium: 10_000,
    termYears: 11,
    expectedReturn: 0.1188,
  });
  close(result.keep.net, 4_000_000);
  close(result.keep.irr, 0.073076365241983909, 1e-6);
  close(result.switch.investMaturity, 10927767.16119045, 1e-8);
  close(result.switch.irr, 0.12212852348663139, 1e-8);
  close(result.switch.surrenderIrr, 0.12006607005097925, 1e-8);
  close(result.additionalWealth, 10927767.16119045 - 4_000_000, 1e-8);
});

test("multi-goal Goal Calculator sample education 10y 7% tax 0", () => {
  const result = calculateMultiGoalAssign({
    shortTermYears: 5,
    shortTermReturn: 0.07,
    longTermReturn: 0.15,
    inflationRate: 0,
    taxRate: 0,
    delayMonths: 12,
    currentCorpus: 0,
    goals: [
      { name: "Education", amount: 5_000_000, years: 10 },
      { name: "House1", amount: 8_000_000, years: 8 },
      { name: "House2", amount: 130_000_000, years: 12 },
      { name: "Car", amount: 4_800_000, years: 5 },
      { name: "Marriage", amount: 50_000_000, years: 25 },
    ],
  });
  close(result.goals[0].monthlySip, 19010.092364804936, 1e-8);
  close(result.goals[0].lumpsum, 1235923.5306093292, 1e-8);
  close(result.goals[3].monthlySip, 67040.595382055923, 1e-8);
  close(result.totalMonthlySip, 495205.75655095006, 1e-7);
});

test("multi-withdrawals Unprotected v2 first goal SIP", () => {
  const sip = requiredSip({
    target: 2_000_000,
    years: 5,
    annualReturn: 0.12,
    taxRate: 0.125,
  });
  close(sip, 25488.856849689902, 1e-8);
  const result = calculateMultiWithdrawals({
    age: 28,
    annualReturn: 0.12,
    taxRate: 0.125,
    withdrawals: [
      { name: "Car", amount: 2_000_000, atAge: 33 },
      { name: "Education 1", amount: 2_000_000, atAge: 41 },
      { name: "Education 2", amount: 5_000_000, atAge: 54 },
      { name: "Education 3", amount: 3_500_000, atAge: 54 },
      { name: "Education 4", amount: 2_000_000, atAge: 41 },
      { name: "Marriage", amount: 2_000_000, atAge: 58 },
      { name: "OldAge Home", amount: 16_000_000, atAge: 60 },
    ],
  });
  close(result.rows[0].monthlySip, 25488.856849689902, 1e-8);
  close(result.totalWithdrawn, 32_500_000, 0);
  close(result.totalInvested, 6990620.3231626917, 1e-7);
});

test("irr matches insurance keep policy cashflows", () => {
  const flows = [-300_000, -300_000, -300_000, -300_000, -300_000, ...Array(14).fill(0)];
  flows[19] = 5_000_000;
  close(irr(flows, 0.07), 0.073076365241983909, 1e-6);
});

test("xirr with yearly dates", () => {
  const start = new Date(Date.UTC(2024, 0, 1));
  const flows = [
    { amount: -200_000, date: start },
    { amount: -200_000, date: new Date(Date.UTC(2025, 0, 1)) },
    { amount: -200_000, date: new Date(Date.UTC(2026, 0, 1)) },
    { amount: -200_000, date: new Date(Date.UTC(2027, 0, 1)) },
    { amount: -200_000, date: new Date(Date.UTC(2028, 0, 1)) },
    { amount: 5_550_123.806471712, date: new Date(Date.UTC(2044, 0, 1)) },
  ];
  const r = xirr(flows, 0.05);
  assert.ok(r > 0.09 && r < 0.11);
  close(fv(0.11, 15, 0, -1_160_000, 1), 5550123.806471712);
});
