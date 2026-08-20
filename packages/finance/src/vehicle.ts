import { fv, pmt } from "./core";
import { calculateAmort } from "./amort";

export type VehicleLoanInput = {
  onRoadCost: number;
  loanAmount: number;
  annualRate: number;
  years: number;
  incomeTaxRate: number;
  depreciationRate: number;
  fdRate: number;
  debtRate: number;
  conservativeRate: number;
  equityRate: number;
  fdTaxRate: number;
  debtTaxRate: number;
  conservativeTaxRate: number;
  equityTaxRate: number;
};

export type VehicleOption = {
  name: string;
  invested: number;
  maturity: number;
  profit: number;
  netProfit: number;
  outOfPocket: number;
  netOutOfPocket: number;
  financialBenefit: number;
};

function decliningDepreciation(cost: number, rate: number, years: number): {
  total: number;
  schedule: Array<{ year: number; value: number; depreciation: number; balance: number }>;
} {
  const schedule: Array<{
    year: number;
    value: number;
    depreciation: number;
    balance: number;
  }> = [];
  let value = cost;
  let total = 0;
  for (let year = 1; year <= years; year += 1) {
    const depreciation = value * rate;
    const balance = value - depreciation;
    total += depreciation;
    schedule.push({ year, value, depreciation, balance });
    value = balance;
  }
  return { total, schedule };
}

function investOption(
  name: string,
  loanAmount: number,
  years: number,
  returnRate: number,
  taxRate: number,
  compounding: "annual" | "quarterly",
  onRoad: number,
  interestPaid: number,
  totalTaxSaved: number,
): VehicleOption {
  const maturity =
    compounding === "quarterly"
      ? fv(returnRate / 4, years * 4, 0, -loanAmount, 0)
      : fv(returnRate, years, 0, -loanAmount, 0);
  const profit = maturity - loanAmount;
  const netProfit = profit * (1 - taxRate);
  const outOfPocket = onRoad + interestPaid;
  const netOutOfPocket = onRoad + interestPaid - totalTaxSaved - netProfit;
  return {
    name,
    invested: loanAmount,
    maturity,
    profit,
    netProfit,
    outOfPocket,
    netOutOfPocket,
    financialBenefit: onRoad - netOutOfPocket,
  };
}

/** Full Set Vehicle Loan Benefit Analysis-v2 (Veh-Loan sheet). */
export function calculateVehicleLoan(input: VehicleLoanInput) {
  const amort = calculateAmort({
    principal: input.loanAmount,
    years: input.years,
    annualRate: input.annualRate,
  });
  const emi = pmt(input.annualRate / 12, input.years * 12, -input.loanAmount, 0, 0);
  const dep = decliningDepreciation(
    input.onRoadCost,
    input.depreciationRate,
    input.years,
  );
  const taxOnInterest = amort.totalInterest * input.incomeTaxRate;
  const taxOnDepreciation = dep.total * input.incomeTaxRate;
  const totalTaxSaved = taxOnInterest + taxOnDepreciation;

  const noLoanOutOfPocket = input.onRoadCost - taxOnDepreciation;
  const noLoan: VehicleOption = {
    name: "No loan",
    invested: 0,
    maturity: 0,
    profit: 0,
    netProfit: 0,
    outOfPocket: input.onRoadCost,
    netOutOfPocket: noLoanOutOfPocket,
    financialBenefit: taxOnDepreciation,
  };

  const fd = investOption(
    "FD",
    input.loanAmount,
    input.years,
    input.fdRate,
    input.fdTaxRate,
    "quarterly",
    input.onRoadCost,
    amort.totalInterest,
    totalTaxSaved,
  );
  const debt = investOption(
    "MF debt",
    input.loanAmount,
    input.years,
    input.debtRate,
    input.debtTaxRate,
    "annual",
    input.onRoadCost,
    amort.totalInterest,
    totalTaxSaved,
  );
  const conservative = investOption(
    "Conservative",
    input.loanAmount,
    input.years,
    input.conservativeRate,
    input.conservativeTaxRate,
    "annual",
    input.onRoadCost,
    amort.totalInterest,
    totalTaxSaved,
  );
  const equity = investOption(
    "Equity",
    input.loanAmount,
    input.years,
    input.equityRate,
    input.equityTaxRate,
    "annual",
    input.onRoadCost,
    amort.totalInterest,
    totalTaxSaved,
  );

  const options = [noLoan, fd, debt, conservative, equity];
  const ranked = [...options].sort((a, b) => b.financialBenefit - a.financialBenefit);

  return {
    emi,
    totalInterest: amort.totalInterest,
    totalDepreciation: dep.total,
    taxOnInterest,
    taxOnDepreciation,
    totalTaxSaved,
    depreciation: dep.schedule,
    options,
    compare: options.map((opt) => ({
      category: opt.name,
      benefit: opt.financialBenefit,
    })),
    stacked: options.map((opt) => ({
      category: opt.name,
      taxShield: totalTaxSaved,
      opportunity: opt.netProfit,
      netBenefit: opt.financialBenefit,
    })),
    best: ranked[0]?.name ?? null,
  };
}
