/**
 * Cell-level parity with Unprotected Nivra SIP Calculator v3.xlsm
 * (copy: calculator-tests/Nivra SIP Calculator v3.xlsm).
 *
 * Excel:
 *   SIP end = FV(monthlyRate, sipMonths, −monthly, 0, 1)
 *   Maturity = FV(annual, investYears−sipYears, 0, −sipEnd, 1)
 *   Invested = monthly × sipYears × 12
 *   Infl. adj. = Maturity / (1+inflation)^sipYears
 *   Delayed / cost of delay when delayMonths > 0
 *   D7 = "Invalid" when investYears < sipYears
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateSip } from "../src/sip";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

/** Equal SIP / horizon sample used by UI defaults and growth-sip golden. */
const SAMPLE_5Y = {
  monthlyInvestment: 1500,
  sipYears: 5,
  investYears: 5,
  annualReturn: 0.12,
  inflationRate: 0.0575,
  delayMonths: 6,
} as const;

/** Workbook default often keeps C7 = 40 while SIP years stay at 5. */
const SAMPLE_40Y_HORIZON = {
  ...SAMPLE_5Y,
  investYears: 40,
} as const;

test("SIP Calculator v3 sample (5y=5y): maturity / invested / delay (Excel path)", () => {
  const r = calculateSip(SAMPLE_5Y);
  close(r.totalInvested, 90_000, 0);
  close(r.maturity, 121655.41880029078);
  close(r.gain, 31655.418800290776);
  close(r.inflationAdjusted, 91987.66139035183);
  close(r.delayedMaturity ?? 0, 106162.42472526057);
  close(r.costOfDelay ?? 0, r.maturity - (r.delayedMaturity ?? 0));
  close(r.tax, 0, 0);
  close(r.netAfterTax, r.maturity);
});

test("SIP Calculator v3: 40y horizon grows 5y corpus (Excel C7=40 cached path)", () => {
  const r = calculateSip(SAMPLE_40Y_HORIZON);
  close(r.totalInvested, 90_000, 0);
  close(r.maturity, 6423359.832392357);
  close(r.delayedMaturity ?? 0, 6069504.534997196);
  close(r.costOfDelay ?? 0, 353855.29739516135);
  close(r.inflationAdjusted, r.maturity / (1.0575) ** 5);
});

test("SIP Calculator v3: yearly schedule length equals investYears", () => {
  const r = calculateSip(SAMPLE_5Y);
  assert.equal(r.schedule.length, 5);
  assert.equal(r.schedule[0].year, 1);
  assert.equal(r.schedule[4].year, 5);
  close(r.schedule[4].yearEnd, r.maturity);
  close(r.schedule[4].investedToDate, 90_000, 0);
  // After SIP ends, monthly contribution is 0 for extra horizon years
  const long = calculateSip(SAMPLE_40Y_HORIZON);
  assert.equal(long.schedule.length, 40);
  assert.equal(long.schedule[4].monthly, 1500);
  assert.equal(long.schedule[5].monthly, 0);
  close(long.schedule[39].yearEnd, long.maturity);
});

test("SIP Calculator v3: zero delay clears delay outputs", () => {
  const r = calculateSip({ ...SAMPLE_5Y, delayMonths: 0 });
  assert.equal(r.delayedMaturity, null);
  assert.equal(r.costOfDelay, null);
  close(r.maturity, 121655.41880029078);
});

test("SIP Calculator v3: tax on gains only", () => {
  const r = calculateSip(SAMPLE_5Y, 0.125);
  close(r.tax, r.gain * 0.125);
  close(r.netAfterTax, r.maturity - r.tax);
});

test("SIP Calculator v3: HNW regression (20y SIP / 25y horizon)", () => {
  const r = calculateSip(
    {
      monthlyInvestment: 250_000,
      sipYears: 20,
      investYears: 25,
      annualReturn: 0.12,
      inflationRate: 0.0575,
      delayMonths: 6,
    },
    0.125,
  );
  close(r.totalInvested, 60_000_000, 0);
  close(r.maturity, 405275740.16020626);
  close(r.tax, 43159467.52002578);
  close(r.netAfterTax, 362116272.64018047);
});
