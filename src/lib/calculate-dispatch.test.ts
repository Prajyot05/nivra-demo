import assert from "node:assert/strict";
import { test } from "node:test";
import { ZodError } from "zod";
import { dispatch } from "./calculate-dispatch";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1e-6, Math.abs(expected) * rel);
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual} (diff ${actual - expected})`,
  );
};

test("dispatch growth-sip matches Unprotected SIP Calculator v3 sample", () => {
  const result = dispatch("growth-sip", {
    clientName: "Mr. Anshu Kaul",
    age: 30,
    monthlyInvestment: 1500,
    sipYears: 5,
    investYears: 5,
    returnPct: 12,
    inflationPct: 5.75,
    delayMonths: 6,
    taxPct: 0,
  }) as { maturity: number; totalInvested: number; delayedMaturity: number };
  close(result.totalInvested, 90_000, 0);
  close(result.maturity, 121655.41880029078);
  close(result.delayedMaturity, 106162.42472526057);
});

test("dispatch growth-lumpsum matches Unprotected One-Time Investment v2 sample", () => {
  const result = dispatch("growth-lumpsum", {
    amount: 5_000_000,
    years: 16,
    returnPct: 12,
    inflationPct: 5.75,
    delayMonths: 6,
    taxPct: 0,
  }) as { maturity: number };
  close(result.maturity, 30651968.25183946);
});

test("dispatch growth-stepup matches Unprotected SIP Step-Up v1 sample", () => {
  const result = dispatch("growth-stepup", {
    startMonthly: 5000,
    sipYears: 10,
    returnPct: 12,
    stepUpPct: 10,
    inflationPct: 5.75,
    taxPct: 0,
  }) as { maturity: number; totalInvested: number; endMonthly: number };
  close(result.totalInvested, 956245.4760600011);
  close(result.maturity, 1634449.2409538408);
  close(result.endMonthly, 5000 * 1.1 ** 9);
});

test("dispatch growth-periodic matches Unprotected Periodic Investment v1 sample", () => {
  const result = dispatch("growth-periodic", {
    amount: 100_000,
    timesPerYear: 2,
    years: 1,
    returnPct: 12,
    taxPct: 12,
  }) as { maturity: number; payments: number; tax: number };
  close(result.payments, 2, 0);
  close(result.maturity, 217830.05244258378);
  close(result.tax, 2139.6062931100532);
});

test("dispatch converts API percents to engine decimals", () => {
  const at12 = dispatch("growth-lumpsum", {
    amount: 100_000,
    years: 1,
    returnPct: 12,
    taxPct: 0,
  }) as { maturity: number };
  close(at12.maturity, 100_000 * 1.12);
});

test("dispatch rejects periodic timesPerYear that do not divide 12", () => {
  assert.throws(
    () =>
      dispatch("growth-periodic", {
        amount: 100_000,
        timesPerYear: 5,
        years: 1,
        returnPct: 12,
      }),
    ZodError,
  );
});

test("dispatch rejects SIP horizon shorter than SIP years", () => {
  assert.throws(
    () =>
      dispatch("growth-sip", {
        monthlyInvestment: 1500,
        sipYears: 10,
        investYears: 5,
        returnPct: 12,
      }),
    ZodError,
  );
});

test("dispatch unknown id is 404", () => {
  try {
    dispatch("not-a-calculator", {});
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { status?: number }).status, 404);
  }
});

const goalBody = {
  clientName: "Mr. John Doe",
  age: 30,
  goalAmount: 10_000_000,
  tenureYears: 15,
  returnPct: 12,
  inflationPct: 5.25,
  taxPct: 12.5,
  stepUpPct: 10,
  useInflationAdjustedGoal: true,
};

test("dispatch goal-sip matches Unprotected Goal v3 required SIP", () => {
  const result = dispatch("goal-sip", goalBody) as { standard: { monthlySip: number } };
  close(result.standard.monthlySip, 49082.47270047578);
});

test("dispatch goal-current with no existing matches goal-sip SIP", () => {
  const sip = dispatch("goal-sip", goalBody) as { standard: { monthlySip: number } };
  const current = dispatch("goal-current", {
    ...goalBody,
    currentCorpus: 0,
    currentMonthlySip: 0,
  }) as { standard: { monthlySip: number } };
  close(current.standard.monthlySip, sip.standard.monthlySip);
});

test("dispatch goal-existing-sip additional SIP is reduced by current SIP", () => {
  const sip = dispatch("goal-sip", goalBody) as { standard: { monthlySip: number } };
  const existing = dispatch("goal-existing-sip", {
    ...goalBody,
    currentMonthlySip: 10_000,
  }) as { standard: { monthlySip: number } };
  close(existing.standard.monthlySip, sip.standard.monthlySip - 10_000, 1e-6);
});

test("dispatch goal-ls-sip extra lumpsum lowers mix SIP", () => {
  const result = dispatch("goal-ls-sip", {
    ...goalBody,
    currentCorpus: 500_000,
    extraLumpsum: 200_000,
  }) as { allSip: number; mixSip: number };
  assert.ok(result.mixSip < result.allSip);
});

test("dispatch goal-periodic remaining SIP is below full goal SIP", () => {
  const sip = dispatch("goal-sip", goalBody) as { standard: { monthlySip: number } };
  const periodic = dispatch("goal-periodic", {
    ...goalBody,
    amount: 100_000,
    timesPerYear: 2,
  }) as { standard: { monthlySip: number } };
  assert.ok(periodic.standard.monthlySip < sip.standard.monthlySip);
});

test("dispatch goal-compounding extra years grow SIP corpus", () => {
  const result = dispatch("goal-compounding", {
    ...goalBody,
    extraYears: 5,
  }) as { standard: { maturity: number }; sipAfterExtra: number; schedule: unknown[] };
  assert.ok(result.sipAfterExtra > result.standard.maturity);
  assert.equal(result.schedule.length, 20);
});

test("dispatch education matches Unprotected Education-Plan lumpsum and withdrawals", () => {
  const result = dispatch("education", {
    clientName: "Mr. Anshu Kaul",
    age: 35,
    childName: "Jitender Agarwal",
    childAge: 5,
    returnPct: 12,
    taxPct: 12.5,
    costs: [
      { age: 3, classLabel: "Nursery", cost: 20_000 },
      { age: 4, classLabel: "LKG", cost: 21_600 },
      { age: 5, classLabel: "UKG", cost: 24_000 },
      { age: 6, classLabel: "Class 1", cost: 25_000 },
      { age: 7, classLabel: "Class 2", cost: 26_200 },
      { age: 8, classLabel: "Class 3", cost: 27_400 },
      { age: 9, classLabel: "Class 4", cost: 28_700 },
      { age: 10, classLabel: "Class 5", cost: 30_000 },
      { age: 11, classLabel: "Class 6", cost: 31_400 },
      { age: 12, classLabel: "Class 7", cost: 32_900 },
      { age: 13, classLabel: "Class 8", cost: 34_400 },
      { age: 14, classLabel: "Class 9", cost: 36_000 },
      { age: 15, classLabel: "Class 10", cost: 37_700 },
      { age: 16, classLabel: "Class 11", cost: 39_400 },
      { age: 17, classLabel: "Class 12", cost: 41_200 },
      { age: 18, classLabel: "College - 1", cost: 2_500_000 },
      { age: 19, classLabel: "College - 2", cost: 2_500_000 },
      { age: 20, classLabel: "College - 3", cost: 2_500_000 },
      { age: 21, classLabel: "College - 4", cost: 7_000_000 },
    ],
  }) as {
    lumpsum: { lumpsum: number };
    sip: { monthlySip: number };
    totalWithdrawal: number;
    lastFeeAge: number;
  };
  close(result.lumpsum.lumpsum, 3231850.6890932065);
  close(result.totalWithdrawal, 16751587.5, 0);
  close(result.lastFeeAge, 21, 0);
  assert.ok(result.sip.monthlySip > 32_012);
});
