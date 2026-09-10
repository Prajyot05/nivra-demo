/**
 * Cell-level parity with Unprotected Nivra Periodic Investment v1.xlsm
 * (copy: calculator-tests/Nivra Periodic Investment v1.xlsm).
 *
 * Excel:
 *   Contribution at month m when MOD(m, 12/freq) = 0 and m < years*12
 *   Each FV = FV(monthlyRate, totalMonths−m, 0, −amount, 1)
 *   Maturity = SUM of contribution FVs
 *   Tax = (Maturity − Invested) × taxRate
 *   Net = Maturity − Tax
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePeriodic } from "../src/periodic";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

/** Unprotected sample defaults (C8–C12). */
const SAMPLE = {
  amount: 100_000,
  timesPerYear: 2,
  years: 1,
  annualReturn: 0.12,
  taxRate: 0.12,
} as const;

test("Periodic Investment v1 sample: maturity / gain / tax / net (Excel C14/C15/C17/C19/C20)", () => {
  const r = calculatePeriodic(SAMPLE);
  close(r.totalInvested, 200_000, 0);
  close(r.payments, 2, 0);
  close(r.maturity, 217830.05244258378);
  close(r.gain, 17830.05244258378);
  close(r.tax, 2139.6062931100532);
  close(r.netAfterTax, 215690.44614947373);
  close(r.netAfterTax, r.maturity - r.tax);
});

test("Periodic Investment v1: half-yearly schedule months 0 and 6 with Excel FVs", () => {
  const r = calculatePeriodic(SAMPLE);
  assert.equal(r.schedule.length, 2);
  assert.equal(r.schedule[0].month, 0);
  assert.equal(r.schedule[1].month, 6);
  close(r.schedule[0].contribution, 100_000, 0);
  close(r.schedule[1].contribution, 100_000, 0);
  // Excel O13 / O19
  close(r.schedule[0].contributionFv, 112000.00000000015);
  close(r.schedule[1].contributionFv, 105830.0524425837);
});

test("Periodic Investment: contribution months by frequency (1 year)", () => {
  const cases: Array<{ freq: number; months: number[] }> = [
    { freq: 12, months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { freq: 4, months: [0, 3, 6, 9] },
    { freq: 2, months: [0, 6] },
    { freq: 1, months: [0] },
    { freq: 6, months: [0, 2, 4, 6, 8, 10] },
    { freq: 3, months: [0, 4, 8] },
  ];
  for (const { freq, months } of cases) {
    const r = calculatePeriodic({
      amount: 50_000,
      timesPerYear: freq,
      years: 1,
      annualReturn: 0.12,
      taxRate: 0.12,
    });
    assert.equal(r.payments, months.length);
    assert.deepEqual(
      r.schedule.map((row) => row.month),
      months,
    );
    close(r.totalInvested, 50_000 * months.length, 0);
  }
});

test("Periodic Investment: multi-year monthly schedule length", () => {
  const years = 5;
  const r = calculatePeriodic({
    amount: 10_000,
    timesPerYear: 12,
    years,
    annualReturn: 0.12,
    taxRate: 0.1,
  });
  assert.equal(r.payments, years * 12);
  assert.equal(r.schedule.length, years * 12);
  assert.equal(r.schedule[0].month, 0);
  assert.equal(r.schedule[r.schedule.length - 1].month, years * 12 - 1);
  close(r.totalInvested, 10_000 * years * 12, 0);
});

test("Periodic Investment: quarterly 15y HNW regression", () => {
  const r = calculatePeriodic({
    amount: 2_500_000,
    timesPerYear: 4,
    years: 15,
    annualReturn: 0.12,
    taxRate: 0.125,
  });
  assert.equal(r.payments, 60);
  close(r.maturity, 400360941.9315721);
  close(r.tax, 31295117.74144651);
  close(r.netAfterTax, 369065824.1901256);
});

test("Periodic Investment: rejects timesPerYear that do not divide 12", () => {
  assert.throws(
    () =>
      calculatePeriodic({
        amount: 100_000,
        timesPerYear: 5,
        years: 1,
        annualReturn: 0.12,
      }),
    /timesPerYear must be a positive divisor of 12/,
  );
});
