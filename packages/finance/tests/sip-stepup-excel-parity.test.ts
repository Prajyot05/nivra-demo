/**
 * Cell-level parity with Unprotected Nivra SIP Step-Up Calculator v1.xlsm
 * (copy: calculator-tests/Nivra SIP Step-Up Calculator v1.xlsm).
 *
 * Excel (equal SIP years = invest years, the growth-stepup API path):
 *   Month m contribution = start × (1+stepUp)^yearIndex(m)
 *   Each FV = FV(monthlyRate, monthsRemainingIncl, 0, −monthly, 1)
 *   Maturity = sum of contribution FVs
 *   Invested = sum of contributions
 *   Infl. adj. = Maturity / (1+inflation)^sipYears
 *
 * Excel also supports investYears > sipYears (C8) via post-SIP FV growth;
 * that longer-horizon path is not yet on the growth-stepup API.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateStepUpSip, stepUpMonthly, stepUpProjection } from "../src/stepup";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

const SAMPLE = {
  startMonthly: 5000,
  sipYears: 10,
  annualReturn: 0.12,
  stepUpRate: 0.1,
  inflationRate: 0.0575,
  taxRate: 0,
} as const;

test("SIP Step-Up v1 sample: maturity / invested / end monthly (Excel equal-years path)", () => {
  const r = calculateStepUpSip(SAMPLE);
  close(r.totalInvested, 956245.4760600011);
  close(r.maturity, 1634449.2409538408);
  close(r.startMonthly, 5000, 0);
  close(r.endMonthly, 5000 * 1.1 ** 9);
  close(r.gain, r.maturity - r.totalInvested);
  close(r.inflationAdjusted, r.maturity / 1.0575 ** 10);
  close(r.tax, 0, 0);
  close(r.netAfterTax, r.maturity);
});

test("SIP Step-Up v1: workbook C8=15 horizon grows equal-years corpus at annual yield", () => {
  const equal = calculateStepUpSip(SAMPLE);
  // Excel W4 = FV(yield, investYears−sipYears, 0, −sipEnd, 1)
  const grown = equal.maturity * 1.12 ** 5;
  close(grown, 2880458.026407555);
  close(equal.totalInvested, 956245.4760600011);
});

test("SIP Step-Up v1: yearly schedule length and step-up monthly path", () => {
  const r = calculateStepUpSip(SAMPLE);
  assert.equal(r.schedule.length, 10);
  assert.equal(r.schedule[0].year, 1);
  close(r.schedule[0].monthly, 5000, 0);
  close(r.schedule[1].monthly, 5500, 0);
  close(r.schedule[9].monthly, 5000 * 1.1 ** 9);
  close(r.schedule[9].yearEnd, r.maturity);
  close(r.schedule[9].investedToDate, r.totalInvested);
});

test("SIP Step-Up v1: month contribution ladder matches Excel year-index rule", () => {
  close(stepUpMonthly(5000, 0.1, 1), 5000, 0);
  close(stepUpMonthly(5000, 0.1, 12), 5000, 0);
  close(stepUpMonthly(5000, 0.1, 13), 5500, 0);
  close(stepUpMonthly(5000, 0.1, 120), 5000 * 1.1 ** 9);
});

test("SIP Step-Up v1: tax on gains only", () => {
  const r = calculateStepUpSip({ ...SAMPLE, taxRate: 0.125 });
  close(r.tax, r.gain * 0.125);
  close(r.netAfterTax, r.maturity - r.tax);
});

test("SIP Step-Up v1: HNW regression (20y)", () => {
  const r = calculateStepUpSip({
    startMonthly: 150_000,
    sipYears: 20,
    annualReturn: 0.12,
    stepUpRate: 0.1,
    inflationRate: 0.0575,
    taxRate: 0.125,
  });
  close(r.totalInvested, 103094999.08786067);
  close(r.maturity, 279470749.25358844);
  close(r.endMonthly, 917386.3567262196);
  close(r.netAfterTax, 257423780.48287246);
});

test("SIP Step-Up v1: projection scales linearly with start monthly", () => {
  const a = stepUpProjection({
    startMonthly: 1,
    sipYears: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
  });
  const scale = 27_918.04577208791;
  const b = stepUpProjection({
    startMonthly: scale,
    sipYears: 15,
    annualReturn: 0.12,
    stepUpRate: 0.1,
  });
  close(b.maturity, a.maturity * scale);
  close(b.totalInvested, a.totalInvested * scale);
});
