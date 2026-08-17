import { nominalMonthlyRate } from "./core";

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
