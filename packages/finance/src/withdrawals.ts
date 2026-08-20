import { fv, monthlyRate } from "./core";
import { requiredSip } from "./goal";

export type WithdrawalItem = {
  name: string;
  amount: number;
  atAge: number;
};

export type MultiWithdrawalsInput = {
  age: number;
  annualReturn: number;
  taxRate: number;
  withdrawals: WithdrawalItem[];
};

/**
 * Unprotected SIP for Multiple Withdrawals v2.
 * Each withdrawal has its own SIP so net-after-tax corpus at that age equals the amount.
 */
export function calculateMultiWithdrawals(input: MultiWithdrawalsInput) {
  const rows = input.withdrawals
    .filter((w) => w.amount > 0 && w.atAge > input.age)
    .map((w) => {
      const years = w.atAge - input.age;
      const monthlySip = requiredSip({
        target: w.amount,
        years,
        annualReturn: input.annualReturn,
        taxRate: input.taxRate,
      });
      const invested = monthlySip * years * 12;
      const peakCorpus = fv(monthlyRate(input.annualReturn), years * 12, -monthlySip, 0, 1);
      const tax = Math.max(0, peakCorpus - invested) * input.taxRate;
      return {
        name: w.name,
        amount: w.amount,
        atAge: w.atAge,
        years,
        monthlySip,
        invested,
        peakCorpus,
        tax,
      };
    });

  const ages = new Set<number>();
  for (const row of rows) ages.add(row.atAge);
  ages.add(input.age);
  const lastAge = rows.reduce((m, r) => Math.max(m, r.atAge), input.age);
  const byAge: Array<{
    age: number;
    withdrawal: number;
    corpus: number;
    monthlySip: number;
  }> = [];

  for (let age = input.age; age <= lastAge; age += 1) {
    const years = age - input.age;
    let corpus = 0;
    let monthlySip = 0;
    let withdrawal = 0;
    for (const row of rows) {
      if (age <= row.atAge) monthlySip += row.monthlySip;
      if (years > 0 && age <= row.atAge) {
        corpus += fv(monthlyRate(input.annualReturn), years * 12, -row.monthlySip, 0, 1);
      }
      if (age === row.atAge) withdrawal += row.amount;
    }
    byAge.push({ age, withdrawal, corpus, monthlySip });
  }

  const phases: Array<{ fromAge: number; toAge: number; monthlySip: number }> = [];
  const cutoffAges = [...new Set(rows.map((r) => r.atAge))].sort((a, b) => a - b);
  let from = input.age;
  for (const to of cutoffAges) {
    const monthlySip = rows.filter((r) => r.atAge >= to).reduce((s, r) => s + r.monthlySip, 0);
    phases.push({ fromAge: from, toAge: to, monthlySip });
    from = to;
  }

  return {
    rows,
    phases,
    startMonthlySip: rows.reduce((s, r) => s + r.monthlySip, 0),
    totalInvested: rows.reduce((s, r) => s + r.invested, 0),
    totalWithdrawn: rows.reduce((s, r) => s + r.amount, 0),
    totalTax: rows.reduce((s, r) => s + r.tax, 0),
    ageChart: byAge.filter((r) => r.age > input.age),
    schedule: byAge,
  };
}
