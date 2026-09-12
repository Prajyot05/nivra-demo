/**
 * Cell-level parity with Unprotected Nivra One-Time Investment v2.xlsm
 * (copy: calculator-tests/Nivra One-Time Investment v2.xlsm).
 *
 * Excel:
 *   Maturity      = FV(rate, years, 0, -amount, 1)
 *   Infl. adj.    = Maturity / (1+inflation)^years
 *   Gain          = Maturity − amount
 *   Infl. gain    = Infl. adj. − amount
 *   Delayed       = FV(rate, years − delay/12, 0, -amount, 1)
 *   Cost of delay = Maturity − Delayed
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateLumpsum } from "../src/sip";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

const SAMPLE = {
  amount: 5_000_000,
  years: 16,
  annualReturn: 0.12,
  inflationRate: 0.0575,
  delayMonths: 6,
  taxRate: 0,
} as const;

test("One-Time Investment v2 sample: maturity / inflation / delay (Excel C8/C12/C18/C19)", () => {
  const r = calculateLumpsum(SAMPLE);
  close(r.maturity, 30651968.25183946);
  close(r.totalInvested, 5_000_000, 0);
  close(r.gain, 25651968.25183946);
  close(r.inflationAdjusted, 12530613.952781675);
  close(r.inflationAdjustedGain, 7530613.952781675);
  close(r.delayedMaturity ?? 0, 28963387.567505162);
  close(r.costOfDelay ?? 0, 1688580.6843342967);
  close(r.tax, 0, 0);
  close(r.netAfterTax, r.maturity);
});

test("One-Time Investment v2: yearly schedule length and terminal values", () => {
  const r = calculateLumpsum(SAMPLE);
  assert.equal(r.schedule.length, 16);
  const last = r.schedule[15];
  assert.equal(last.year, 16);
  close(last.investedToDate, 5_000_000, 0);
  close(last.yearEnd, r.maturity);
  close(last.inflationAdjusted ?? 0, r.inflationAdjusted);
  // Year 1: amount × (1+r)
  close(r.schedule[0].yearEnd, 5_000_000 * 1.12);
});

test("One-Time Investment: zero delay clears delay outputs", () => {
  const r = calculateLumpsum({ ...SAMPLE, delayMonths: 0 });
  assert.equal(r.delayedMaturity, null);
  assert.equal(r.costOfDelay, null);
  close(r.maturity, 30651968.25183946);
});

test("One-Time Investment: tax on gains only", () => {
  const r = calculateLumpsum({ ...SAMPLE, taxRate: 0.125 });
  close(r.tax, r.gain * 0.125);
  close(r.netAfterTax, r.maturity - r.tax);
});

test("One-Time Investment: editable Excel inputs sweep", () => {
  for (const years of [1, 10, 25]) {
    for (const rate of [0.05, 0.12, 0.15]) {
      for (const inflation of [0, 0.0575]) {
        const r = calculateLumpsum({
          amount: 1_000_000,
          years,
          annualReturn: rate,
          inflationRate: inflation,
          delayMonths: 0,
        });
        assert.equal(r.schedule.length, years);
        close(r.maturity, 1_000_000 * (1 + rate) ** years);
        close(r.inflationAdjusted, r.maturity / (1 + inflation) ** years);
        close(r.gain, r.maturity - 1_000_000);
      }
    }
  }
});
