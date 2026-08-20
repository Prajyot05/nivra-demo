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
    delayMonths: 3,
  });
  close(result.monthlyExpAtRet, 366924.9771081851);
  close(result.corpusRequired, 210442136.92288274);
  close(result.currentAtRetirement, 41386104.63701193);
  close(result.balanceCorpus, 169056032.2858708);
  close(result.additionalLumpsum, 30885905.04278836);
  close(result.monthlySip, 355210.9244250518);
  close(result.stepUpStartSip, 204304.28485959605);
  close(result.delayLumpsum, 31773483.94305639);
  close(result.delaySip, 367781.3010882925);
  assert.equal(result.activeYears, 15);
  assert.equal(result.retiredYears, 35);
  assert.ok(result.schedule.length > 40);
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
});
