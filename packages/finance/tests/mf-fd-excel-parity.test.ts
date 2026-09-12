/**
 * Cell-level parity with Unprotected Nivra MF vs FD v1.xlsm
 * (copy: calculator-tests/Nivra MF vs FD v1.xlsm).
 *
 * Excel model:
 *   annualized = amount × rate
 *   perDay     = annualized / 365
 *   preTax     = perDay × days
 *   postTax    = preTax − preTax × taxRate
 *   mfAdv      = max(0, mfPost − fdPost)
 *   fdAdv      = max(0, fdPost − mfPost)
 *
 * Selectable tax (ActiveX):
 *   MF: 10%, 12.5%, 20%, 30%
 *   FD: 20%, 25%, 30%
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateMfVsFd } from "../src/mf-fd";

const close = (actual: number, expected: number, rel = 1e-12) => {
  const tol = Math.max(1e-9, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

/** Excel ComboBox ranges J2:J5 / K2:K4 */
export const MF_TAX_OPTIONS_PCT = [10, 12.5, 20, 30] as const;
export const FD_TAX_OPTIONS_PCT = [20, 25, 30] as const;

function excelLeg(amount: number, days: number, rate: number, taxRate: number) {
  const annualizedReturn = amount * rate;
  const returnPerDay = annualizedReturn / 365;
  const preTax = returnPerDay * days;
  const tax = preTax * taxRate;
  const postTax = preTax - tax;
  return {
    annualizedReturn,
    returnPerDay,
    preTax,
    tax,
    postTax,
    invested: amount,
    gain: preTax,
    net: amount + postTax,
  };
}

function assertLeg(
  actual: ReturnType<typeof calculateMfVsFd>["mf"],
  expected: ReturnType<typeof excelLeg>,
) {
  close(actual.annualizedReturn, expected.annualizedReturn);
  close(actual.returnPerDay, expected.returnPerDay);
  close(actual.preTax, expected.preTax);
  close(actual.tax, expected.tax);
  close(actual.postTax, expected.postTax);
  close(actual.invested, expected.invested);
  close(actual.gain, expected.gain);
  close(actual.net, expected.net);
}

test("Excel sample: ₹100 Cr / 15 days / 5% vs 3% / tax 20% vs 25%", () => {
  const input = {
    amount: 1_000_000_000,
    days: 15,
    mfRate: 0.05,
    fdRate: 0.03,
    mfTaxRate: 0.2,
    fdTaxRate: 0.25,
  };
  const result = calculateMfVsFd(input);
  const mf = excelLeg(input.amount, input.days, input.mfRate, input.mfTaxRate);
  const fd = excelLeg(input.amount, input.days, input.fdRate, input.fdTaxRate);

  assertLeg(result.mf, mf);
  assertLeg(result.fd, fd);

  // Cached values from the workbook (data_only)
  close(result.mf.annualizedReturn, 50_000_000);
  close(result.fd.annualizedReturn, 30_000_000);
  close(result.mf.returnPerDay, 136986.301369863);
  close(result.fd.returnPerDay, 82191.78082191781);
  close(result.mf.preTax, 2054794.520547945);
  close(result.fd.preTax, 1232876.7123287672);
  close(result.mf.postTax, 1643835.616438356);
  close(result.fd.postTax, 924657.5342465753);
  close(result.mfAdvantage, 719178.0821917807);
  close(result.fdAdvantage, 0);
  close(result.difference, result.mf.postTax - result.fd.postTax);
});

test("shared period and amount: FD mirrors MF inputs (F3=C3, F5=C5)", () => {
  const result = calculateMfVsFd({
    amount: 2_500_000,
    days: 42,
    mfRate: 0.07,
    fdRate: 0.055,
    mfTaxRate: 0.125,
    fdTaxRate: 0.2,
  });
  assert.equal(result.mf.invested, result.fd.invested);
  close(result.mf.invested, 2_500_000);
});

test("MF tax combo options (10 / 12.5 / 20 / 30) all affect C14", () => {
  for (const pct of MF_TAX_OPTIONS_PCT) {
    const r = calculateMfVsFd({
      amount: 10_000_000,
      days: 30,
      mfRate: 0.05,
      fdRate: 0.03,
      mfTaxRate: pct / 100,
      fdTaxRate: 0.25,
    });
    const expected = excelLeg(10_000_000, 30, 0.05, pct / 100);
    close(r.mf.postTax, expected.postTax);
    close(r.mf.tax, expected.tax);
  }
});

test("FD tax combo options (20 / 25 / 30) all affect F14", () => {
  for (const pct of FD_TAX_OPTIONS_PCT) {
    const r = calculateMfVsFd({
      amount: 10_000_000,
      days: 30,
      mfRate: 0.05,
      fdRate: 0.03,
      mfTaxRate: 0.2,
      fdTaxRate: pct / 100,
    });
    const expected = excelLeg(10_000_000, 30, 0.03, pct / 100);
    close(r.fd.postTax, expected.postTax);
    close(r.fd.tax, expected.tax);
  }
});

test("difference in return: only the winning side is non-zero (C15 / F15)", () => {
  const mfWins = calculateMfVsFd({
    amount: 1_000_000,
    days: 10,
    mfRate: 0.08,
    fdRate: 0.04,
    mfTaxRate: 0.1,
    fdTaxRate: 0.3,
  });
  assert.ok(mfWins.mfAdvantage > 0);
  close(mfWins.fdAdvantage, 0);

  const fdWins = calculateMfVsFd({
    amount: 1_000_000,
    days: 10,
    mfRate: 0.04,
    fdRate: 0.08,
    mfTaxRate: 0.3,
    fdTaxRate: 0.2,
  });
  assert.ok(fdWins.fdAdvantage > 0);
  close(fdWins.mfAdvantage, 0);

  const tied = calculateMfVsFd({
    amount: 1_000_000,
    days: 10,
    mfRate: 0.05,
    fdRate: 0.05,
    mfTaxRate: 0.2,
    fdTaxRate: 0.2,
  });
  close(tied.mfAdvantage, 0);
  close(tied.fdAdvantage, 0);
  close(tied.difference, 0);
});

test("every editable Excel input sweeps without breaking formulas", () => {
  const amounts = [1, 100_000, 1_000_000_000];
  const daysList = [1, 15, 365];
  const rates = [0, 0.03, 0.12];
  for (const amount of amounts) {
    for (const days of daysList) {
      for (const mfRate of rates) {
        for (const fdRate of rates) {
          const r = calculateMfVsFd({
            amount,
            days,
            mfRate,
            fdRate,
            mfTaxRate: 0.2,
            fdTaxRate: 0.25,
          });
          assertLeg(r.mf, excelLeg(amount, days, mfRate, 0.2));
          assertLeg(r.fd, excelLeg(amount, days, fdRate, 0.25));
          close(r.mfAdvantage, Math.max(0, r.mf.postTax - r.fd.postTax));
          close(r.fdAdvantage, Math.max(0, r.fd.postTax - r.mf.postTax));
        }
      }
    }
  }
});

test("compare[] rows match Excel particulars (Invested / Gain / Tax / Net)", () => {
  const r = calculateMfVsFd({
    amount: 1_000_000_000,
    days: 15,
    mfRate: 0.05,
    fdRate: 0.03,
    mfTaxRate: 0.2,
    fdTaxRate: 0.25,
  });
  assert.deepEqual(
    r.compare.map((row) => row.category),
    ["Invested", "Gain", "Tax", "Net"],
  );
  close(r.compare[0].mf, r.mf.invested);
  close(r.compare[0].fd, r.fd.invested);
  close(r.compare[1].mf, r.mf.gain);
  close(r.compare[1].fd, r.fd.gain);
  close(r.compare[2].mf, r.mf.tax);
  close(r.compare[2].fd, r.fd.tax);
  close(r.compare[3].mf, r.mf.net);
  close(r.compare[3].fd, r.fd.net);
});
