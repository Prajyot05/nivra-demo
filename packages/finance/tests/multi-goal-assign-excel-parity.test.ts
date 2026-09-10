/**
 * Engine / workbook parity for Multiple Goals – Corpus Assignment (multi-goal-assign).
 * Workbook copy: calculator-tests/Nivra Multiple Goals with Corpus Assignment v2.xlsm
 *
 * Goal Calculator sheet sample: Education / House1 / House2 / Car / Marriage, ST 7% / LT 15%,
 * zero inflation/tax, delay 12 months, zero corpus.
 * GCwithCorpus path: soonest-first corpus assignment at goal ST/LT yields.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateMultiGoalAssign } from "../src/multi-goal";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

const GOAL_CALCULATOR_SAMPLE = {
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
} as const;

const GC_WITH_CORPUS_SAMPLE = {
  shortTermYears: 5,
  shortTermReturn: 0.07,
  longTermReturn: 0.12,
  inflationRate: 0.03,
  taxRate: 0.125,
  delayMonths: 0,
  currentCorpus: 100_000_000,
  goals: [
    { name: "Education", amount: 4_000_000, years: 6 },
    { name: "Masters", amount: 440_000_000, years: 11 },
    { name: "House", amount: 2_000_000_000, years: 10 },
    { name: "Marriage", amount: 4_800_000, years: 5 },
    { name: "Retirement", amount: 50_000_000, years: 25 },
  ],
} as const;

test("multi-goal-assign Goal Calculator sample: SIP / LS totals", () => {
  const r = calculateMultiGoalAssign(GOAL_CALCULATOR_SAMPLE);
  close(r.goals[0]!.monthlySip, 19010.09236480497);
  close(r.goals[0]!.lumpsum, 1235923.5306093292);
  close(r.goals[3]!.monthlySip, 67040.59538205592);
  close(r.totalMonthlySip, 495205.7565509509);
  close(r.totalLumpsum, 33090282.767640818);
  assert.equal(r.totalAssigned, 0);
  assert.equal(r.unassignedCorpus, 0);
});

test("multi-goal-assign: Car is ST bucket; others LT at ST years=5", () => {
  const r = calculateMultiGoalAssign(GOAL_CALCULATOR_SAMPLE);
  assert.equal(r.goals[3]!.bucket, "ST");
  assert.equal(r.goals[0]!.bucket, "LT");
  assert.equal(r.goals[4]!.bucket, "LT");
});

test("multi-goal-assign: compare rows match active goals", () => {
  const r = calculateMultiGoalAssign(GOAL_CALCULATOR_SAMPLE);
  assert.equal(r.compare.length, 5);
  assert.equal(r.compare[0]!.category, "Education");
  close(r.compare[0]!.remaining, r.goals[0]!.lumpsum);
});

test("multi-goal-assign GCwithCorpus: soonest goals absorb corpus first", () => {
  const r = calculateMultiGoalAssign(GC_WITH_CORPUS_SAMPLE);
  close(r.totalAssigned, 100_000_000);
  assert.equal(r.unassignedCorpus, 0);
  // Marriage (5y) and Education (6y) are soonest — fully funded, no extra SIP.
  assert.ok(r.goals[3]!.assigned > 0);
  assert.ok(r.goals[0]!.assigned > 0);
  assert.equal(r.goals[3]!.monthlySip, 0);
  assert.equal(r.goals[0]!.monthlySip, 0);
  // House (10y) gets remaining corpus after sooner goals.
  close(r.goals[2]!.assigned, 93306127.94466062);
  assert.ok(r.goals[2]!.monthlySip > 0);
  close(r.totalMonthlySip, 14011954.690507429);
});

test("multi-goal-assign: zero corpus leaves all goals needing full SIP", () => {
  const withCorpus = calculateMultiGoalAssign(GC_WITH_CORPUS_SAMPLE);
  const without = calculateMultiGoalAssign({
    ...GC_WITH_CORPUS_SAMPLE,
    currentCorpus: 0,
  });
  assert.ok(without.totalMonthlySip > withCorpus.totalMonthlySip);
  assert.equal(without.totalAssigned, 0);
  assert.ok(without.goals.every((g) => g.assigned === 0));
});

test("multi-goal-assign: overfunding corpus leaves unassigned remainder", () => {
  const r = calculateMultiGoalAssign({
    shortTermYears: 5,
    shortTermReturn: 0.07,
    longTermReturn: 0.12,
    inflationRate: 0,
    taxRate: 0,
    currentCorpus: 50_000_000,
    goals: [
      { name: "Car", amount: 1_000_000, years: 3 },
      { name: "Trip", amount: 500_000, years: 2 },
    ],
  });
  assert.equal(r.totalMonthlySip, 0);
  assert.equal(r.totalLumpsum, 0);
  assert.ok(r.unassignedCorpus > 0);
  close(r.totalAssigned + r.unassignedCorpus, 50_000_000);
});

test("multi-goal-assign HNW regression", () => {
  const r = calculateMultiGoalAssign({
    shortTermYears: 5,
    shortTermReturn: 0.07,
    longTermReturn: 0.15,
    inflationRate: 0.05,
    taxRate: 0.125,
    delayMonths: 0,
    currentCorpus: 20_000_000,
    goals: [
      { name: "Education", amount: 25_000_000, years: 12 },
      { name: "Home", amount: 150_000_000, years: 10 },
      { name: "Second home", amount: 80_000_000, years: 15 },
      { name: "Wedding", amount: 40_000_000, years: 8 },
      { name: "Legacy", amount: 200_000_000, years: 25 },
    ],
  });
  close(r.totalMonthlySip, 1717006.493293201);
  close(r.totalLumpsum, 123471712.85126668);
  close(r.totalAssigned, 20_000_000);
  assert.equal(r.goals.length, 5);
});
