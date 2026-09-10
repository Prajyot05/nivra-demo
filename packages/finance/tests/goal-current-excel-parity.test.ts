/**
 * Engine / workbook parity for Goal with Current Investments (goal-current).
 * Workbook copy: calculator-tests/Nivra Goal with Current Investment - LS, SIP, SU_SIP.xlsm
 *
 * Excel "Goal Options": goal ₹1 Cr, 15y, 12% return, 12.5% tax, 10% step-up.
 * Web engine grows current corpus + current SIP at the goal return/tax.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateGoalWithCurrent,
  calculateGoalSipVsStepUp,
  existingNetCredit,
  requiredLumpsum,
} from "../src/goal";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

const GOLDEN_SAMPLE = {
  goalAmount: 10_000_000,
  tenureYears: 15,
  annualReturn: 0.12,
  inflationRate: 0.0525,
  taxRate: 0.125,
  stepUpRate: 0.1,
  useInflationAdjustedGoal: true,
  currentCorpus: 500_000,
  currentMonthlySip: 5_000,
} as const;

test("goal-current golden sample: shortfall / LS / SIP / step-up", () => {
  const r = calculateGoalWithCurrent(GOLDEN_SAMPLE);
  close(r.shortfall, 16892374.415978163);
  close(r.standard.monthlySip, 38484.4748799025);
  close(r.stepUp.monthlySip, 21889.918598229673);
  close(r.lumpsum.lumpsum ?? 0, 3437342.7887438303);
  assert.ok(r.stepUp.monthlySip < r.standard.monthlySip);
  assert.ok((r.lumpsum.lumpsum ?? 0) > 0);
});

test("goal-current: existing credit reduces shortfall vs plain Goal SIP", () => {
  const plain = calculateGoalSipVsStepUp(GOLDEN_SAMPLE);
  const r = calculateGoalWithCurrent(GOLDEN_SAMPLE);
  assert.ok(r.shortfall < plain.targetGoal);
  assert.ok(r.standard.monthlySip < plain.standard.monthlySip);
  close(r.targetGoal, plain.targetGoal);
});

test("goal-current: combined net after tax meets target", () => {
  const r = calculateGoalWithCurrent(GOLDEN_SAMPLE);
  const combined = existingNetCredit(
    r.existing.totalFv + r.standard.maturity,
    r.existing.totalInvested + r.standard.invested,
    GOLDEN_SAMPLE.taxRate,
  );
  close(combined, r.targetGoal);
  close(r.standard.netAfterTax, r.shortfall);
});

test("goal-current: schedule length equals tenure", () => {
  const r = calculateGoalWithCurrent(GOLDEN_SAMPLE);
  assert.equal(r.schedule.length, GOLDEN_SAMPLE.tenureYears);
  assert.equal(r.schedule[0]?.year, 1);
  const last = r.schedule[r.schedule.length - 1]!;
  close(last.sipYearEnd, r.standard.maturity);
  close(last.stepYearEnd, r.stepUp.maturity);
});

test("goal-current: zero current SIP/corpus matches Goal SIP path", () => {
  const plain = calculateGoalSipVsStepUp(GOLDEN_SAMPLE);
  const r = calculateGoalWithCurrent({
    ...GOLDEN_SAMPLE,
    currentCorpus: 0,
    currentMonthlySip: 0,
  });
  close(r.shortfall, plain.targetGoal);
  close(r.standard.monthlySip, plain.standard.monthlySip);
  close(r.stepUp.monthlySip, plain.stepUp.monthlySip);
  const plainLs = requiredLumpsum({
    target: plain.targetGoal,
    years: GOLDEN_SAMPLE.tenureYears,
    annualReturn: GOLDEN_SAMPLE.annualReturn,
    taxRate: GOLDEN_SAMPLE.taxRate,
  });
  close(r.lumpsum.lumpsum ?? 0, plainLs);
});

test("goal-current: overfunded corpus needs no additional funding", () => {
  const r = calculateGoalWithCurrent({
    ...GOLDEN_SAMPLE,
    currentCorpus: 50_000_000,
    currentMonthlySip: 0,
  });
  assert.equal(r.standard.monthlySip, 0);
  assert.equal(r.lumpsum.lumpsum, 0);
  assert.ok(r.overfunded);
  assert.ok(r.shortfall <= 0);
});

test("goal-current HNW regression", () => {
  const r = calculateGoalWithCurrent({
    goalAmount: 50_000_000,
    tenureYears: 20,
    annualReturn: 0.12,
    inflationRate: 0.0525,
    taxRate: 0.125,
    stepUpRate: 0.1,
    useInflationAdjustedGoal: true,
    currentCorpus: 5_000_000,
    currentMonthlySip: 100_000,
  });
  close(r.shortfall, 12812164.994676143);
  close(r.standard.monthlySip, 15346.204085560135);
  close(r.standard.netAfterTax, r.shortfall);
  assert.equal(r.schedule.length, 20);
});
