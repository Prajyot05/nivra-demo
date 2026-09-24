import assert from "node:assert/strict";
import { test } from "node:test";
import { inflate } from "../src/inflation";
import {
  requiredSip,
  requiredStepUpSip,
  requiredLumpsum,
  calculateGoalSipVsStepUp,
  calculateGoalWithCurrent,
  calculateGoalLsSipOptions,
  calculateGoalExistingSip,
  calculateGoalPeriodicLumpsum,
  calculateGoalCompounding,
  existingNetCredit,
} from "../src/goal";
import { calculateSip, calculateLumpsum } from "../src/sip";
import { calculateStepUpSip } from "../src/stepup";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("inflation-adjusted goal: Unprotected Goal SIP v3", () => {
  close(inflate(10_000_000, 0.0525, 15), 21544259.307314847);
});

test("required SIP with tax matches Goal sheet U27", () => {
  const target = inflate(10_000_000, 0.0525, 15);
  close(
    requiredSip({
      target,
      years: 15,
      annualReturn: 0.12,
      taxRate: 0.125,
    }),
    49082.47270047578,
  );
});

test("required step-up start matches Goal sheet SU_Amt cache", () => {
  const target = inflate(10_000_000, 0.0525, 15);
  close(
    requiredStepUpSip({
      target,
      years: 15,
      annualReturn: 0.12,
      stepUpRate: 0.1,
      taxRate: 0.125,
    }),
    27918.04577208791,
    1e-6,
  );
});

test("goal SIP vs step-up: net after tax meets the chosen target", () => {
  const result = calculateGoalSipVsStepUp({
    goalAmount: 10_000_000,
    tenureYears: 15,
    annualReturn: 0.12,
    inflationRate: 0.0525,
    taxRate: 0.125,
    stepUpRate: 0.1,
    useInflationAdjustedGoal: true,
  });
  close(result.targetGoal, result.inflAdjGoal);
  close(result.standard.netAfterTax, result.targetGoal, 1e-8);
  close(result.stepUp.netAfterTax, result.targetGoal, 1e-8);
  assert.equal(result.schedule.length, 15);
  assert.equal(result.delays.length, 4);
});

test("required SIP without tax matches PMT type=1 and SIP engine FV", () => {
  const sip = requiredSip({
    target: 1_000_000,
    years: 15,
    annualReturn: 0.12,
    taxRate: 0,
  });
  const run = calculateSip({
    monthlyInvestment: sip,
    sipYears: 15,
    annualReturn: 0.12,
  });
  close(run.maturity, 1_000_000, 1e-8);
  const su = requiredStepUpSip({
    target: 1_000_000,
    years: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
    taxRate: 0,
  });
  const suRun = calculateStepUpSip({
    startMonthly: su,
    sipYears: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
  });
  close(suRun.maturity, 1_000_000, 1e-8);
});

const goalBase = {
  goalAmount: 10_000_000,
  tenureYears: 15,
  annualReturn: 0.12,
  inflationRate: 0.0525,
  taxRate: 0.125,
  stepUpRate: 0.1,
  useInflationAdjustedGoal: true,
} as const;

test("required lumpsum with tax: net after tax equals target", () => {
  const target = inflate(10_000_000, 0.0525, 15);
  const ls = requiredLumpsum({
    target,
    years: 15,
    annualReturn: 0.12,
    taxRate: 0.125,
  });
  const run = calculateLumpsum({
    amount: ls,
    years: 15,
    annualReturn: 0.12,
    taxRate: 0.125,
  });
  close(run.netAfterTax, target, 1e-8);
});

test("goal with no current investment matches Goal SIP required SIP", () => {
  const vs = calculateGoalSipVsStepUp(goalBase);
  const current = calculateGoalWithCurrent({
    ...goalBase,
    currentCorpus: 0,
    currentMonthlySip: 0,
  });
  close(current.standard.monthlySip, vs.standard.monthlySip, 1e-8);
  close(current.stepUp.monthlySip, vs.stepUp.monthlySip, 1e-8);
  close(current.shortfall, vs.targetGoal, 1e-8);
});

test("existing SIP: additional SIP is full required minus current SIP", () => {
  const vs = calculateGoalSipVsStepUp(goalBase);
  const currentSip = 10_000;
  const result = calculateGoalExistingSip({
    ...goalBase,
    currentMonthlySip: currentSip,
  });
  close(result.standard.monthlySip, vs.standard.monthlySip - currentSip, 1e-6);
  const combinedCredit = existingNetCredit(
    result.existing.totalFv + result.standard.maturity,
    result.existing.totalInvested + result.standard.invested,
    goalBase.taxRate,
  );
  close(combinedCredit, result.targetGoal, 1e-8);
});

test("current corpus + additional SIP: combined net after tax meets the goal", () => {
  const result = calculateGoalWithCurrent({
    ...goalBase,
    currentCorpus: 500_000,
    currentMonthlySip: 5_000,
  });
  assert.ok(result.shortfall < result.targetGoal);
  assert.ok(result.standard.monthlySip > 0);
  const combinedCredit = existingNetCredit(
    result.existing.totalFv + result.standard.maturity,
    result.existing.totalInvested + result.standard.invested,
    goalBase.taxRate,
  );
  close(combinedCredit, result.targetGoal, 1e-8);
});

test("overfunded current corpus needs no additional SIP", () => {
  const result = calculateGoalWithCurrent({
    ...goalBase,
    currentCorpus: 50_000_000,
    currentMonthlySip: 0,
  });
  assert.equal(result.standard.monthlySip, 0);
  assert.equal(result.lumpsum.lumpsum, 0);
  assert.ok(result.overfunded);
});

test("LS–SIP options: extra lumpsum lowers remaining SIP vs all-SIP", () => {
  const result = calculateGoalLsSipOptions({
    ...goalBase,
    currentCorpus: 500_000,
    extraLumpsum: 200_000,
  });
  assert.ok(result.mixSip < result.allSip);
  assert.ok(result.allLumpsum > 0);
  const withMix = calculateGoalWithCurrent({
    ...goalBase,
    currentCorpus: 700_000,
    currentMonthlySip: 0,
  });
  close(result.mixSip, withMix.standard.monthlySip, 1e-8);
});

test("periodic lumpsums reduce required SIP vs Goal SIP", () => {
  const vs = calculateGoalSipVsStepUp(goalBase);
  const result = calculateGoalPeriodicLumpsum({
    ...goalBase,
    amount: 100_000,
    timesPerYear: 2,
  });
  assert.ok(result.periodic.payments > 0);
  assert.ok(result.standard.monthlySip < vs.standard.monthlySip);
  const combinedCredit = existingNetCredit(
    result.periodic.maturity + result.standard.maturity,
    result.periodic.totalInvested + result.standard.invested,
    goalBase.taxRate,
  );
  close(combinedCredit, result.targetGoal, 1e-8);
});

test("compounding growth steps: SIP net hits goal; extra years grow the corpus", () => {
  const vs = calculateGoalSipVsStepUp(goalBase);
  const result = calculateGoalCompounding({ ...goalBase, extraYears: 5 });
  close(result.standard.monthlySip, vs.standard.monthlySip, 1e-8);
  close(result.standard.netAfterTax, result.targetGoal, 1e-8);
  close(result.lumpsum.netAfterTax, result.targetGoal, 1e-8);
  assert.ok(result.sipAfterExtra > result.standard.maturity);
  assert.ok(result.lumpsumAfterExtra > result.lumpsum.maturity);
  assert.equal(result.schedule.length, 20);
  assert.equal(result.delays.length, 4);
});

test("compounding matches Unprotected Growth Steps Excel (50L / 15y / 14%)", () => {
  const result = calculateGoalCompounding({
    goalAmount: 5_000_000,
    tenureYears: 15,
    annualReturn: 0.14,
    inflationRate: 0,
    taxRate: 0.125,
    useInflationAdjustedGoal: false,
    extraYears: 0,
    investmentType: "one-time",
    stepSize: 1_000_000,
  });
  close(result.lumpsum.lumpsum, 784843.635774286);
  close(result.standard.monthlySip, 9670.1278438884419);
  close(result.lumpsum.maturity, 5602165.194889388);
  close(result.standard.maturity, 5465625.2840142976);
  close(result.standard.invested, 1740623.0118999195);
  close(result.lumpsum.tax, 602165.19488938781);
  close(result.standard.tax, 465625.2840142973);
  close(result.standard.netAfterTax, 5_000_000, 1e-8);
  close(result.lumpsum.netAfterTax, 5_000_000, 1e-8);
  assert.equal(result.schedule.length, 15);
  assert.deepEqual(
    result.growthSteps.map((row) => row.months),
    [23, 86, 123, 150, 170],
  );
  assert.deepEqual(
    result.growthSteps.map((row) => row.step),
    [1, 2, 3, 4, 5],
  );
  const sipSteps = calculateGoalCompounding({
    goalAmount: 5_000_000,
    tenureYears: 15,
    annualReturn: 0.14,
    inflationRate: 0,
    taxRate: 0.125,
    useInflationAdjustedGoal: false,
    extraYears: 0,
    investmentType: "sip",
    stepSize: 1_000_000,
  });
  assert.deepEqual(
    sipSteps.growthSteps.map((row) => row.months),
    [69, 108, 136, 156, 174],
  );
});

test("compounding growth steps: 1Cr step size is insufficient for a 50L goal", () => {
  const result = calculateGoalCompounding({
    goalAmount: 5_000_000,
    tenureYears: 15,
    annualReturn: 0.14,
    inflationRate: 0,
    taxRate: 0.125,
    useInflationAdjustedGoal: false,
    extraYears: 0,
    investmentType: "one-time",
    stepSize: 10_000_000,
  });
  assert.equal(result.growthSteps.length, 0);
});

