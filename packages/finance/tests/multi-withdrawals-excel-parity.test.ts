/**
 * Parity with Unprotected Nivra SIP for Multiple Withdrawals v2.xlsm
 * (copy: calculator-tests/Nivra SIP for Multiple Withdrawals v2.xlsm).
 *
 * Each withdrawal has its own SIP so net-after-tax corpus at that age equals the amount.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateMultiWithdrawals } from "../src/withdrawals";
import { requiredSip } from "../src/goal";

const close = (actual: number, expected: number, rel = 1e-7) => {
  const tol = Math.max(1e-4, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

const SAMPLE_WITHDRAWALS = [
  { name: "Car", amount: 2_000_000, atAge: 33 },
  { name: "Education 1", amount: 2_000_000, atAge: 41 },
  { name: "Education 2", amount: 5_000_000, atAge: 54 },
  { name: "Education 3", amount: 3_500_000, atAge: 54 },
  { name: "Education 4", amount: 2_000_000, atAge: 41 },
  { name: "Marriage", amount: 2_000_000, atAge: 58 },
  { name: "OldAge Home", amount: 16_000_000, atAge: 60 },
] as const;

const SAMPLE = {
  age: 28,
  annualReturn: 0.12,
  taxRate: 0.125,
  withdrawals: [...SAMPLE_WITHDRAWALS],
} as const;

test("Multi Withdrawals v2: Car SIP matches requiredSip (5y to age 33)", () => {
  const sip = requiredSip({
    target: 2_000_000,
    years: 5,
    annualReturn: 0.12,
    taxRate: 0.125,
  });
  close(sip, 25488.856849689902, 1e-8);
  const r = calculateMultiWithdrawals(SAMPLE);
  close(r.rows[0].monthlySip, sip, 1e-8);
  assert.equal(r.rows[0].name, "Car");
  assert.equal(r.rows[0].years, 5);
  close(r.rows[0].amount, 2_000_000, 0);
});

test("Multi Withdrawals v2 sample: totals and start SIP", () => {
  const r = calculateMultiWithdrawals(SAMPLE);
  close(r.totalWithdrawn, 32_500_000, 0);
  close(r.totalInvested, 6990620.3231626917, 1e-7);
  close(r.startMonthlySip, r.rows.reduce((s, row) => s + row.monthlySip, 0));
  assert.equal(r.rows.length, 7);
});

test("Multi Withdrawals v2: duplicate ages merge on ageChart", () => {
  const r = calculateMultiWithdrawals(SAMPLE);
  const at41 = r.ageChart.find((row) => row.age === 41);
  const at54 = r.ageChart.find((row) => row.age === 54);
  assert.ok(at41);
  assert.ok(at54);
  close(at41!.withdrawal, 4_000_000, 0); // Education 1 + 4
  close(at54!.withdrawal, 8_500_000, 0); // Education 2 + 3
  const at33 = r.ageChart.find((row) => row.age === 33);
  close(at33!.withdrawal, 2_000_000, 0);
});

test("Multi Withdrawals v2: schedule spans client age to last goal", () => {
  const r = calculateMultiWithdrawals(SAMPLE);
  assert.equal(r.schedule[0].age, 28);
  assert.equal(r.schedule[r.schedule.length - 1].age, 60);
  close(r.schedule[0].monthlySip, r.startMonthlySip);
});

test("Multi Withdrawals v2: skips goals at or before current age", () => {
  const r = calculateMultiWithdrawals({
    ...SAMPLE,
    withdrawals: [
      { name: "Past", amount: 1_000_000, atAge: 28 },
      { name: "Car", amount: 2_000_000, atAge: 33 },
    ],
  });
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].name, "Car");
});

test("Multi Withdrawals v2: HNW regression", () => {
  const r = calculateMultiWithdrawals({
    age: 30,
    annualReturn: 0.12,
    taxRate: 0.125,
    withdrawals: [
      { name: "Car", amount: 8_000_000, atAge: 35 },
      { name: "Education", amount: 40_000_000, atAge: 45 },
      { name: "Wedding", amount: 25_000_000, atAge: 50 },
      { name: "Second home", amount: 100_000_000, atAge: 55 },
      { name: "Retirement boost", amount: 50_000_000, atAge: 60 },
    ],
  });
  close(r.startMonthlySip, 306762.01693368924, 1e-7);
  close(r.totalWithdrawn, 223_000_000, 0);
  close(r.totalInvested, 55921741.08771836, 1e-7);
  close(r.totalTax, 23868322.701754518, 1e-7);
});
