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

test("periodic rejects timesPerYear that do not divide 12", () => {
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

test("periodic: Unprotected Periodic Investment v1 sample (1L x2 / year, 1y, 12%, 12% tax)", () => {
  const result = calculatePeriodic({
    amount: 100_000,
    timesPerYear: 2,
    years: 1,
    annualReturn: 0.12,
    taxRate: 0.12,
  });
  close(result.totalInvested, 200_000, 0);
  close(result.payments, 2, 0);
  close(result.maturity, 217830.05244258378);
  close(result.tax, 2139.6062931100532);
  close(result.netAfterTax, result.maturity - result.tax);
});
