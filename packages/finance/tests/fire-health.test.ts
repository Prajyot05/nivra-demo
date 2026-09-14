import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateFirePlanner } from "../src/fire";
import { calculateFinancialHealth } from "../src/health";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("FIRE Planner v10 Unprotected sample (no events)", () => {
  const result = calculateFirePlanner({
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    corpusSlices: [
      { rate: 0.09, amount: 5_000_000 },
      { rate: 0.12, amount: 3_500_000 },
    ],
    currentSipMonthly: 10_000,
    currentSipReturn: 0.1,
    stepUpRate: 0.1,
    stepUpEveryYears: 1,
    delayMonths: 3,
  });
  close(result.monthlyExpAtRet, 366924.9771081851);
  close(result.corpusRequired, 210442136.92288274);
  close(result.currentAtRetirement, 41386104.63701193);
  close(result.eventsCorpusAtRetirement, 0);
  close(result.balanceCorpus, 169056032.2858708);
  close(result.additionalLumpsum, 30885905.04278836);
  close(result.monthlySip, 355210.9244250518);
  close(result.stepUpStartSip, 204304.28485959605);
  close(result.delayLumpsum, 31773483.94305639);
  close(result.delaySip, 367781.3010882925);
  close(result.eventLumpsum, 0);
  close(result.eventSip, 0);
  assert.equal(result.activeYears, 15);
  assert.equal(result.retiredYears, 35);
  assert.ok(result.schedule.length > 40);
  assert.equal(result.schedule.every((r) => r.eventAmount === 0), true);
});

test("FIRE step-up every 2 years raises starting SIP vs annual step-up", () => {
  const base = {
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    corpusSlices: [
      { rate: 0.09, amount: 5_000_000 },
      { rate: 0.12, amount: 3_500_000 },
    ],
    currentSipMonthly: 10_000,
    currentSipReturn: 0.1,
    stepUpRate: 0.1,
    delayMonths: 0,
  };
  const annual = calculateFirePlanner({ ...base, stepUpEveryYears: 1 });
  const biennial = calculateFirePlanner({ ...base, stepUpEveryYears: 2 });
  assert.ok(biennial.stepUpStartSip > annual.stepUpStartSip);
});

test("FIRE pre-retirement income event reduces balance gap", () => {
  const base = {
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    corpusSlices: [
      { rate: 0.09, amount: 5_000_000 },
      { rate: 0.12, amount: 3_500_000 },
    ],
    currentSipMonthly: 10_000,
    currentSipReturn: 0.1,
    stepUpRate: 0.1,
  };
  const none = calculateFirePlanner(base);
  const withIncome = calculateFirePlanner({
    ...base,
    events: [{ age: 50, amount: 5_000_000, type: "Income" }],
  });
  assert.ok(withIncome.eventsCorpusAtRetirement > 0);
  assert.ok(withIncome.balanceCorpus < none.balanceCorpus);
  assert.ok(withIncome.monthlySip < none.monthlySip);
});

test("FIRE post-retirement expense event raises corpus required", () => {
  const base = {
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
  };
  const none = calculateFirePlanner(base);
  const withExpense = calculateFirePlanner({
    ...base,
    events: [{ age: 62, amount: 20_000_000, type: "Expense" }],
  });
  assert.ok(withExpense.corpusRequired > none.corpusRequired);
  const row = withExpense.schedule.find((r) => r.age === 62);
  assert.ok(row);
  assert.equal(row!.eventAmount, -20_000_000);
});

test("FIRE single pre-retirement expense sets event lumpsum and SIP", () => {
  const result = calculateFirePlanner({
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [{ age: 50, amount: 10_000_000, type: "Expense" }],
  });
  assert.equal(result.preRetEventCount, 1);
  close(result.eventLumpsum, 3517884.8781546783);
  close(result.eventSip, 47386.31237136868);
  assert.equal(result.eventSipUntilAge, 50);
});

test("FIRE multiple pre-ret expenses GoalSeek one combined SIP", () => {
  const result = calculateFirePlanner({
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [
      { age: 45, amount: 5_000_000, type: "Expense" },
      { age: 50, amount: 5_000_000, type: "Expense" },
    ],
  });
  assert.equal(result.preRetEventCount, 2);
  assert.ok(result.eventLumpsum > 0);
  assert.ok(result.eventSip > 0);
  assert.equal(result.eventSipUntilAge, 50);
  // Combined SIP is below the naive sum of standalone AKs.
  const a = calculateFirePlanner({
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [{ age: 45, amount: 5_000_000, type: "Expense" }],
  });
  const b = calculateFirePlanner({
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [{ age: 50, amount: 5_000_000, type: "Expense" }],
  });
  assert.ok(result.eventSip < a.eventSip + b.eventSip);
  close(result.eventSip, 64347.1375132202);
});

test("FIRE event row nets income minus expense like Excel T=Q-R", () => {
  const result = calculateFirePlanner({
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [{ age: 50, income: 2_000_000, expense: 10_000_000 }],
  });
  // Net T = -8,000,000 expense funding
  assert.equal(result.preRetEventCount, 1);
  assert.ok(result.eventLumpsum > 0);
  assert.ok(result.eventSip > 0);
  // Pure 8L expense should match
  const pure = calculateFirePlanner({
    age: 40,
    retirementAge: 55,
    survivingAge: 90,
    monthlyExpenses: 150_000,
    lifestyleYearly: 1_500_000,
    inflationRate: 0.0575,
    annualReturn: 0.12,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [{ age: 50, amount: 8_000_000, type: "Expense" }],
  });
  close(result.eventLumpsum, pure.eventLumpsum);
  close(result.eventSip, pure.eventSip);
});

test("Financial Health v4 Unprotected sample (event at 62)", () => {
  const result = calculateFinancialHealth({
    currentCorpus: 250_000_000,
    monthlyExpenses: 350_000,
    monthlyInvestment: 100_000,
    lifestyleYearly: 2_500_000,
    age: 59,
    retirementAge: 60,
    survivingAge: 90,
    inflationRate: 0.0575,
    annualReturn: 0.0975,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
    events: [{ age: 62, amount: 20_000_000, type: "Expense" }],
  });
  close(result.corpusAtRetirement, 275637474.340114);
  assert.equal(result.yearsLasting, 30);
  close(result.remainingAtSurvival, 814285941.8433343);
  close(result.remainingPvToday, 143908113.34575573);
  assert.equal(result.funded, true);
  assert.equal(result.message, "You have more funds than you need.");
});

test("Financial Health shortfall message", () => {
  const result = calculateFinancialHealth({
    currentCorpus: 1_000_000,
    monthlyExpenses: 350_000,
    monthlyInvestment: 0,
    lifestyleYearly: 2_500_000,
    age: 59,
    retirementAge: 60,
    survivingAge: 90,
    inflationRate: 0.0575,
    annualReturn: 0.0975,
    returnAfterRetirement: 0.08,
    taxRate: 0.125,
  });
  assert.equal(result.funded, false);
  assert.equal(result.message, "You do not have sufficient funds.");
});
