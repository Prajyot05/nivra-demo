/**
 * Cell / engine parity for Goal with Current Lumpsum (goal-ls-sip).
 * Workbook copy: calculator-tests/Nivra Goal w Current Investment, LS - SIP Options v3.xlsm
 *
 * Excel sheet "Goal Options" defaults: goal ₹1 Cr, 10y, 12% return, 12.5% tax,
 * current corpus ₹5 L, extra lumpsum ₹1 L. Excel can grow current corpus at C10/C11;
 * the web engine grows it at the goal return/tax (same as Unprotected engine path).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateGoalLsSipOptions, calculateGoalWithCurrent } from "../src/goal";
import { calculateLumpsum } from "../src/sip";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

/** Matches packages/finance golden unprotected-sample. */
const GOLDEN_SAMPLE = {
  goalAmount: 10_000_000,
  tenureYears: 15,
  annualReturn: 0.12,
  inflationRate: 0.0525,
  taxRate: 0.125,
  stepUpRate: 0.1,
  useInflationAdjustedGoal: true,
  currentCorpus: 500_000,
  extraLumpsum: 200_000,
} as const;

/** Workbook sheet defaults (C4–C13), engine rates for corpus. */
const WORKBOOK_DEFAULTS = {
  goalAmount: 10_000_000,
  tenureYears: 10,
  annualReturn: 0.12,
  inflationRate: 0,
  taxRate: 0.125,
  stepUpRate: 0.1,
  useInflationAdjustedGoal: false,
  currentCorpus: 500_000,
  extraLumpsum: 100_000,
} as const;

test("goal-ls-sip golden sample: all-LS / all-SIP / mix SIP", () => {
  const r = calculateGoalLsSipOptions(GOLDEN_SAMPLE);
  close(r.allLumpsum, 3883931.0297774756);
  close(r.allSip, 43484.474879902504);
  close(r.mixSip, 41245.27575167319);
  close(r.extraLumpsum, 200_000, 0);
  assert.ok(r.mixSip < r.allSip);
  assert.ok(r.allLumpsum > 0);
});

test("goal-ls-sip: mix SIP matches Goal-with-Current at corpus+extra", () => {
  const r = calculateGoalLsSipOptions(GOLDEN_SAMPLE);
  const withMix = calculateGoalWithCurrent({
    ...GOLDEN_SAMPLE,
    currentCorpus: GOLDEN_SAMPLE.currentCorpus + GOLDEN_SAMPLE.extraLumpsum,
    currentMonthlySip: 0,
  });
  close(r.mixSip, withMix.standard.monthlySip);
  close(r.mixShortfall, withMix.shortfall);
  close(r.targetGoal, withMix.targetGoal);
});

test("goal-ls-sip: existing credit ignores extra lumpsum", () => {
  const r = calculateGoalLsSipOptions(GOLDEN_SAMPLE);
  const withoutExtra = calculateGoalWithCurrent({
    ...GOLDEN_SAMPLE,
    currentCorpus: GOLDEN_SAMPLE.currentCorpus,
    currentMonthlySip: 0,
  });
  close(r.existingCredit, withoutExtra.existing.netCredit);
  close(r.shortfall, withoutExtra.shortfall);
  close(r.allSip, withoutExtra.standard.monthlySip);
  close(r.allLumpsum, withoutExtra.lumpsum.lumpsum ?? 0);
});

test("goal-ls-sip: extra lumpsum FV matches lumpsum engine", () => {
  const r = calculateGoalLsSipOptions(GOLDEN_SAMPLE);
  const lump = calculateLumpsum({
    amount: GOLDEN_SAMPLE.extraLumpsum,
    years: GOLDEN_SAMPLE.tenureYears,
    annualReturn: GOLDEN_SAMPLE.annualReturn,
  });
  close(r.extraLumpsumFv, lump.maturity);
});

test("goal-ls-sip: schedule length equals tenure; combined grows", () => {
  const r = calculateGoalLsSipOptions(GOLDEN_SAMPLE);
  assert.equal(r.schedule.length, GOLDEN_SAMPLE.tenureYears);
  assert.equal(r.schedule[0]?.year, 1);
  const first = r.schedule[0]!;
  const last = r.schedule[r.schedule.length - 1]!;
  assert.ok(last.combinedEnd > first.combinedEnd);
  close(last.sipYearEnd, r.standard.maturity);
});

test("goal-ls-sip: mix net-after-tax covers mix shortfall", () => {
  const r = calculateGoalLsSipOptions(GOLDEN_SAMPLE);
  close(r.standard.netAfterTax, r.mixShortfall);
  close(r.standard.tax, r.standard.gain * GOLDEN_SAMPLE.taxRate);
});

test("goal-ls-sip workbook defaults: mix SIP lower than all-SIP", () => {
  const r = calculateGoalLsSipOptions(WORKBOOK_DEFAULTS);
  assert.equal(r.targetGoal, 10_000_000);
  assert.ok(r.mixSip < r.allSip);
  assert.ok(r.allLumpsum > WORKBOOK_DEFAULTS.extraLumpsum);
  assert.equal(r.schedule.length, 10);
  close(r.extraLumpsumFv, calculateLumpsum({
    amount: 100_000,
    years: 10,
    annualReturn: 0.12,
  }).maturity);
});

test("goal-ls-sip: zero extra lumpsum → mixSip equals allSip", () => {
  const r = calculateGoalLsSipOptions({ ...GOLDEN_SAMPLE, extraLumpsum: 0 });
  close(r.mixSip, r.allSip);
  close(r.extraLumpsumFv, 0, 0);
});

test("goal-ls-sip HNW regression", () => {
  const r = calculateGoalLsSipOptions({
    goalAmount: 50_000_000,
    tenureYears: 20,
    annualReturn: 0.12,
    inflationRate: 0.0575,
    taxRate: 0.125,
    stepUpRate: 0.1,
    useInflationAdjustedGoal: true,
    currentCorpus: 10_000_000,
    extraLumpsum: 5_000_000,
  });
  assert.ok(r.mixSip < r.allSip);
  assert.ok(r.allLumpsum > 0);
  assert.equal(r.schedule.length, 20);
});
