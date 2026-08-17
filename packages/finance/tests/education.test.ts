import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateEducation,
  DEFAULT_EDUCATION_COSTS,
  projectEducationSipForInput,
} from "../src/education";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

const SAMPLE = {
  childAge: 5,
  annualReturn: 0.12,
  taxRate: 0.125,
  costs: DEFAULT_EDUCATION_COSTS,
};

/** Cached EduSIP in the Unprotected sheet (GoalSeek was not re-run after college-4 = 70L). */
const EXCEL_SIP = 32012.324262293652;

test("education withdrawals match Unprotected Education-Plan G / P36", () => {
  const result = calculateEducation(SAMPLE);
  close(result.totalWithdrawal, 16751587.5, 0);
  const class1 = result.schedule.find((row) => row.age === 6);
  assert.ok(class1);
  close(class1.tax, 3125, 0);
  close(class1.withdrawal, 28125, 0);
  close(class1.cost, 25_000, 0);
  const ukg = result.schedule.find((row) => row.age === 5);
  assert.ok(ukg);
  close(ukg.tax, 0, 0);
  close(ukg.withdrawal, 0, 0);
});

test("education lumpsum required matches Unprotected Q10 / I5", () => {
  const result = calculateEducation(SAMPLE);
  close(result.lumpsum.lumpsum, 3231850.6890932065);
  close(result.lastFeeAge, 21, 0);
  const class1 = result.schedule.find((row) => row.age === 6);
  assert.ok(class1);
  close(class1.lumpsumBalance, 3591547.7717843917);
  const college4 = result.schedule.find((row) => row.age === 21);
  assert.ok(college4);
  close(college4.lumpsumBalance, 0, 0);
});

test("education SIP projection matches Unprotected O/H at cached EduSIP", () => {
  const { corpus, balance } = projectEducationSipForInput(SAMPLE, EXCEL_SIP);
  const i14 = DEFAULT_EDUCATION_COSTS.findIndex((row) => row.age === 6);
  const i29 = DEFAULT_EDUCATION_COSTS.findIndex((row) => row.age === 21);
  close(corpus[i14], 408685.27073609742);
  close(balance[i14], 380560.27073609742);
  close(corpus[i29], 5535119.039840539);
  close(balance[i29], -2339880.960159461);
});

test("education required SIP GoalSeeks last-fee balance to 0", () => {
  const result = calculateEducation(SAMPLE);
  const college4 = result.schedule.find((row) => row.age === 21);
  assert.ok(college4);
  assert.ok(
    Math.abs(college4.sipBalance) < 1e-4,
    `last SIP balance should be ~0, got ${college4.sipBalance}`,
  );
  assert.ok(result.sip.monthlySip > EXCEL_SIP);
  close(result.sip.invested, result.sip.monthlySip * 12 * (21 - 5), 0);
  close(result.sip.tax, result.lumpsum.tax, 0);
  close(result.sip.tax, result.totalTax, 0);
});

test("education past years have zero SIP and lumpsum activity", () => {
  const result = calculateEducation(SAMPLE);
  for (const row of result.schedule.filter((r) => r.age <= 5)) {
    close(row.sipCorpus, 0, 0);
    close(row.sipBalance, 0, 0);
    close(row.lumpsumBalance, 0, 0);
    close(row.withdrawal, 0, 0);
  }
});

test("education compare is lumpsum vs SIP invested / tax / peak corpus", () => {
  const result = calculateEducation(SAMPLE);
  assert.equal(result.compare.length, 3);
  assert.equal(result.compare[0].category, "Invested");
  close(result.compare[0].lumpsum, result.lumpsum.invested, 0);
  close(result.compare[0].sip, result.sip.invested, 0);
  close(result.compare[1].lumpsum, result.totalTax, 0);
  close(result.compare[1].sip, result.totalTax, 0);
  close(result.compare[2].lumpsum, result.lumpsum.peakCorpus, 0);
  close(result.compare[2].sip, result.sip.peakCorpus, 0);
  assert.ok(result.costChart.length > 0);
  assert.ok(result.costChart.every((row) => row.cost > 0));
});

test("education with child younger than first class still discounts from today", () => {
  const result = calculateEducation({
    ...SAMPLE,
    childAge: 2,
  });
  assert.ok(result.lumpsum.lumpsum > 0);
  const nursery = result.schedule.find((row) => row.age === 3);
  assert.ok(nursery);
  assert.ok(nursery.sipCorpus > 0);
  assert.ok(nursery.withdrawal > 0);
  const last = result.schedule.find((row) => row.age === 21);
  assert.ok(last);
  assert.ok(
    Math.abs(last.sipBalance) < 1e-4,
    `last SIP balance should be ~0, got ${last.sipBalance}`,
  );
});

test("education with no future fees returns zeros", () => {
  const result = calculateEducation({
    ...SAMPLE,
    childAge: 22,
  });
  close(result.lumpsum.lumpsum, 0, 0);
  close(result.sip.monthlySip, 0, 0);
  close(result.totalWithdrawal, 0, 0);
});
