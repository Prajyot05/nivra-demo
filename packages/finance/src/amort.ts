import { fv, monthlyRate, nper, nominalMonthlyRate, pmt } from "./core";

export type AmortInput = {
  principal: number;
  years: number;
  annualRate: number;
};

export type AmortRow = {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

/**
 * Loan amortisation (Nivra Loan EMI Calculator v1).
 * Uses nominal monthly rate annual/12 — not the investment effective monthly rate.
 */
export function loanEmi(principal: number, years: number, annualRate: number): number {
  const n = years * 12;
  const r = nominalMonthlyRate(annualRate);
  if (r === 0) return principal / n;
  const factor = (1 + r) ** n;
  return (principal * r * factor) / (factor - 1);
}

export function calculateAmort(input: AmortInput): {
  emi: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortRow[];
} {
  const n = input.years * 12;
  const r = nominalMonthlyRate(input.annualRate);
  const emi = loanEmi(input.principal, input.years, input.annualRate);
  const schedule: AmortRow[] = [];
  let balance = input.principal;
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (let month = 1; month <= n; month += 1) {
    const interest = balance * r;
    let principalPaid = emi - interest;
    if (month === n || principalPaid > balance) {
      principalPaid = balance;
    }
    const payment = principalPaid + interest;
    balance -= principalPaid;
    if (balance < 0 && Math.abs(balance) < 1e-9) balance = 0;
    totalInterest += interest;
    totalPrincipal += principalPaid;
    schedule.push({
      month,
      emi: payment,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return {
    emi,
    totalPrincipal,
    totalInterest,
    totalPaid: totalPrincipal + totalInterest,
    schedule,
  };
}

export type ExtraAmortRow = AmortRow & { extra: number };

/**
 * Loan amortisation with extra payment at the end of each year
 * (Nivra Loan with Periodic Extra Payments v1).
 */
export function calculateAmortWithYearlyExtra(input: AmortInput & {
  yearlyExtra: number;
  recoverReturn?: number;
}): {
  emi: number;
  monthsPaid: number;
  totalPrincipal: number;
  totalInterest: number;
  totalExtra: number;
  originalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  recoverSip: number;
  revisedRecoverSip: number;
  schedule: ExtraAmortRow[];
  originalSchedule: AmortRow[];
} {
  const original = calculateAmort(input);
  const n = input.years * 12;
  const r = nominalMonthlyRate(input.annualRate);
  const emi = original.emi;
  const extra = input.yearlyExtra;
  const schedule: ExtraAmortRow[] = [];
  let balance = input.principal;
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalExtra = 0;

  for (let month = 1; month <= n && balance > 1e-9; month += 1) {
    const interest = balance * r;
    const applyExtra =
      extra > 0 && month % 12 === 0 && balance + interest > emi;
    const extraNow = applyExtra ? extra : 0;
    let payment = emi;
    if (balance + interest < emi) payment = balance + interest;
    let principalPaid = payment - interest + extraNow;
    if (principalPaid > balance) {
      principalPaid = balance;
    }
    const extraApplied = Math.max(0, principalPaid - (payment - interest));
    balance -= principalPaid;
    if (balance < 0 && Math.abs(balance) < 1e-9) balance = 0;
    totalInterest += interest;
    totalPrincipal += principalPaid;
    totalExtra += extraApplied;
    schedule.push({
      month,
      emi: payment,
      principal: principalPaid,
      interest,
      extra: extraApplied,
      balance,
    });
  }

  const monthsPaid = schedule.length;
  const recoverR = input.recoverReturn ?? 0.12;
  const recoverSip = pmt(monthlyRate(recoverR), n, 0, -original.totalInterest, 1);
  const revisedRecoverSip = pmt(monthlyRate(recoverR), n, 0, -totalInterest, 1);

  return {
    emi,
    monthsPaid,
    totalPrincipal,
    totalInterest,
    totalExtra,
    originalInterest: original.totalInterest,
    interestSaved: original.totalInterest - totalInterest,
    monthsSaved: n - monthsPaid,
    recoverSip,
    revisedRecoverSip,
    schedule,
    originalSchedule: original.schedule,
  };
}

export type ExtraVsInvestInput = {
  principal: number;
  years: number;
  annualRate: number;
  extraAmount: number;
  extraMonth: number;
  investReturn: number;
  taxRate: number;
  incomeTaxRate: number;
};

/**
 * One extra lumpsum during the loan vs investing that amount
 * (Unprotected Loan Extra Payment vs Investment v2).
 */
export function calculateExtraVsInvest(input: ExtraVsInvestInput) {
  const orig = calculateAmort({
    principal: input.principal,
    years: input.years,
    annualRate: input.annualRate,
  });
  const n = input.years * 12;
  const extraMonth = Math.min(Math.max(1, Math.round(input.extraMonth)), n);
  const r = nominalMonthlyRate(input.annualRate);
  const emi = orig.emi;

  let principalPaidToDate = 0;
  let interestPaidToDate = 0;
  for (const row of orig.schedule) {
    if (row.month > extraMonth) break;
    principalPaidToDate += row.principal;
    interestPaidToDate += row.interest;
  }

  const balanceAfterExtra = input.principal - principalPaidToDate - input.extraAmount;
  const remainingMonths =
    balanceAfterExtra <= 1e-9 ? 0 : nper(r, emi, -balanceAfterExtra, 0, 0);
  const interestOnBalance =
    remainingMonths <= 0 ? 0 : remainingMonths * emi - balanceAfterExtra;
  const option1Interest = interestPaidToDate + interestOnBalance;

  const remainingYears = (n - extraMonth) / 12;
  const growth = (1 + input.investReturn) ** remainingYears;
  const corpusAfterTax =
    input.extraAmount * (growth - (growth - 1) * input.taxRate);

  const origInterest = orig.totalInterest;
  const origTaxSavings = origInterest * input.incomeTaxRate;
  const origNetCost = origInterest - origTaxSavings;

  const opt1TaxSavings = option1Interest * input.incomeTaxRate;
  const opt1NetCost = option1Interest - opt1TaxSavings;
  const opt1Saving = origNetCost - opt1NetCost;

  const opt2NetCost = origNetCost - (corpusAfterTax - input.extraAmount);
  const opt2Saving = origNetCost - opt2NetCost;

  const path: Array<{
    month: number;
    outstandingPrepay: number;
    investment: number;
  }> = [];
  let prepayBalance = input.principal;
  for (let month = 1; month <= n; month += 1) {
    const origRow = orig.schedule[month - 1];
    if (month < extraMonth) {
      prepayBalance = origRow.balance;
    } else if (month === extraMonth) {
      prepayBalance = Math.max(0, origRow.balance - input.extraAmount);
    } else if (prepayBalance > 1e-9) {
      const interest = prepayBalance * r;
      let principalPaid = emi - interest;
      if (principalPaid > prepayBalance) principalPaid = prepayBalance;
      prepayBalance -= principalPaid;
      if (prepayBalance < 1e-9) prepayBalance = 0;
    }
    const t = Math.max(0, (month - extraMonth) / 12);
    const invested =
      month < extraMonth ? 0 : input.extraAmount * (1 + input.investReturn) ** t;
    path.push({
      month,
      outstandingPrepay: prepayBalance,
      investment: invested,
    });
  }

  return {
    emi,
    originalInterest: origInterest,
    originalTaxSavings: origTaxSavings,
    originalNetCost: origNetCost,
    extraMonth,
    principalPaidToDate,
    interestPaidToDate,
    balanceAfterExtra,
    remainingMonths,
    option1Interest,
    option1TaxSavings: opt1TaxSavings,
    option1NetCost: opt1NetCost,
    option1Saving: opt1Saving,
    corpusAfterTax,
    option2NetCost: opt2NetCost,
    option2Saving: opt2Saving,
    interestSavedVsOriginal: origInterest - option1Interest,
    path,
  };
}

export type InterestRecoveryInput = {
  principal: number;
  years: number;
  annualRate: number;
  proposedYears: number;
  sipReturn: number;
};

/**
 * Loan-only vs shorter loan + SIP that recovers interest
 * (Unprotected Loan Interest Recovery v7, Proposed mode).
 */
export function calculateInterestRecovery(input: InterestRecoveryInput) {
  const baseline = calculateAmort({
    principal: input.principal,
    years: input.years,
    annualRate: input.annualRate,
  });
  const proposedYears = Math.min(input.proposedYears, input.years);
  const proposed = calculateAmort({
    principal: input.principal,
    years: proposedYears,
    annualRate: input.annualRate,
  });
  const sipRate = monthlyRate(input.sipReturn);
  const sipMonths = proposedYears * 12;
  const monthlySip = pmt(sipRate, sipMonths, 0, -proposed.totalInterest, 1);
  const sipInvested = monthlySip * sipMonths;
  const sipAtProposedEnd = proposed.totalInterest;
  const extraYears = input.years - proposedYears;
  const sipAtHorizon =
    extraYears <= 0
      ? sipAtProposedEnd
      : sipAtProposedEnd * (1 + input.sipReturn) ** extraYears;

  const yearRows: Array<{
    year: number;
    baseline: number;
    proposed: number;
    sip: number;
    loanPlusSip: number;
  }> = [];
  for (let year = 1; year <= input.years; year += 1) {
    const bMonth = Math.min(year * 12, baseline.schedule.length) - 1;
    const pMonth = year * 12;
    const baselineBal =
      year * 12 > baseline.schedule.length ? 0 : baseline.schedule[bMonth].balance;
    const proposedBal =
      pMonth > proposed.schedule.length ? 0 : proposed.schedule[pMonth - 1].balance;
    const sipValue =
      year <= proposedYears
        ? fv(sipRate, year * 12, -monthlySip, 0, 1)
        : fv(input.sipReturn, year - proposedYears, 0, -sipAtProposedEnd, 1);
    yearRows.push({
      year,
      baseline: baselineBal,
      proposed: proposedBal,
      sip: sipValue,
      loanPlusSip: proposedBal + sipValue,
    });
  }

  return {
    baselineEmi: baseline.emi,
    baselineInterest: baseline.totalInterest,
    baselinePaid: baseline.totalPaid,
    proposedEmi: proposed.emi,
    proposedInterest: proposed.totalInterest,
    proposedPaid: proposed.totalPaid,
    monthlySip,
    sipInvested,
    sipAtProposedEnd,
    sipAtHorizon,
    totalInvestedLoanPlusSip: proposed.totalPaid + sipInvested,
    savingsVsBaselinePaid: baseline.totalPaid - (proposed.totalPaid + sipInvested),
    wealthCreated: sipAtHorizon,
    totalAssetPlusWealth: input.principal + sipAtHorizon,
    additionalWealth:
      sipAtHorizon + (baseline.totalPaid - (proposed.totalPaid + sipInvested)),
    schedule: yearRows,
    baselineSchedule: baseline.schedule,
    proposedSchedule: proposed.schedule,
  };
}
