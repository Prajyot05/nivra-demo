import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateAmort,
  calculateGoalCompounding,
  calculateGoalExistingSip,
  calculateGoalPeriodicLumpsum,
  calculateGoalSipVsStepUp,
  calculateGoalWithCurrent,
  calculateLumpsum,
  calculateSip,
  calculateStepUpSip,
  capitalGainsTax,
  existingNetCredit,
} from "../src/index";
import { close } from "./goldens/assert";

const goalBase = {
  goalAmount: 50_000_000,
  tenureYears: 20,
  annualReturn: 0.12,
  inflationRate: 0.0525,
  taxRate: 0.125,
  stepUpRate: 0.1,
  useInflationAdjustedGoal: true,
} as const;

test("invariant: goal SIP/step-up net after tax ≈ target (HNW)", () => {
  const result = calculateGoalSipVsStepUp(goalBase);
  close(result.standard.netAfterTax, result.targetGoal, 1e-8);
  close(result.stepUp.netAfterTax, result.targetGoal, 1e-8);
  assert.equal(result.schedule.length, goalBase.tenureYears);
  for (const row of result.schedule) {
    assert.ok(Number.isFinite(row.year));
  }
});

test("invariant: goal with current corpus combined credit ≈ target", () => {
  const result = calculateGoalWithCurrent({
    ...goalBase,
    currentCorpus: 5_000_000,
    currentMonthlySip: 100_000,
  });
  const combined = existingNetCredit(
    result.existing.totalFv + result.standard.maturity,
    result.existing.totalInvested + result.standard.invested,
    goalBase.taxRate,
  );
  close(combined, result.targetGoal, 1e-8);
});

test("invariant: existing SIP additional + existing credit ≈ target", () => {
  const result = calculateGoalExistingSip({
    ...goalBase,
    currentMonthlySip: 150_000,
  });
  const combined = existingNetCredit(
    result.existing.totalFv + result.standard.maturity,
    result.existing.totalInvested + result.standard.invested,
    goalBase.taxRate,
  );
  close(combined, result.targetGoal, 1e-8);
});

test("invariant: periodic goal remaining SIP + periodic credit ≈ target", () => {
  const result = calculateGoalPeriodicLumpsum({
    ...goalBase,
    amount: 250_000,
    timesPerYear: 2,
  });
  assert.ok(result.standard.monthlySip > 0, "periodic alone should not overfund");
  const combined = existingNetCredit(
    result.periodic.maturity + result.standard.maturity,
    result.periodic.totalInvested + result.standard.invested,
    goalBase.taxRate,
  );
  close(combined, result.targetGoal, 1e-8);
});

test("invariant: compounding SIP/lumpsum net ≈ target; schedule length", () => {
  const result = calculateGoalCompounding({ ...goalBase, extraYears: 10 });
  close(result.standard.netAfterTax, result.targetGoal, 1e-8);
  close(result.lumpsum.netAfterTax, result.targetGoal, 1e-8);
  assert.equal(result.schedule.length, goalBase.tenureYears + 10);
});

test("invariant: capital-gains tax identity on HNW SIP", () => {
  const result = calculateSip(
    {
      monthlyInvestment: 250_000,
      sipYears: 20,
      annualReturn: 0.12,
    },
    0.125,
  );
  close(result.tax, capitalGainsTax(result.maturity, result.totalInvested, 0.125));
  close(result.netAfterTax, result.maturity - result.tax);
});

test("invariant: capital-gains tax identity on HNW lumpsum", () => {
  const result = calculateLumpsum({
    amount: 50_000_000,
    years: 20,
    annualReturn: 0.12,
    taxRate: 0.125,
  });
  close(result.tax, capitalGainsTax(result.maturity, result.totalInvested, 0.125));
});

test("invariant: step-up tax identity", () => {
  const result = calculateStepUpSip({
    startMonthly: 150_000,
    sipYears: 20,
    annualReturn: 0.12,
    stepUpRate: 0.1,
    taxRate: 0.125,
  });
  close(result.tax, capitalGainsTax(result.maturity, result.totalInvested, 0.125));
});

test("invariant: HNW loan schedule ends at ~0 balance", () => {
  const result = calculateAmort({
    principal: 50_000_000,
    years: 20,
    annualRate: 0.092,
  });
  assert.equal(result.schedule.length, 240);
  close(result.schedule[239].balance, 0, 1e-6);
  for (const row of result.schedule) {
    assert.ok(Number.isFinite(row.emi));
    assert.ok(Number.isFinite(row.balance));
    assert.ok(!Number.isNaN(row.interest));
  }
  close(result.totalPrincipal, 50_000_000, 1e-8);
});
