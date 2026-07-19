export interface CalculatorInputs {
  goalAmount: number;
  years: number;
  expectedReturnRate: number; // e.g. 0.12 for 12%
  taxRate: number; // e.g. 0.125 for 12.5%
  stepUpPercentage: number; // e.g. 0.10 for 10%
  inflationRate: number; // e.g. 0.0575 for 5.75%
  useInflationAdjusted: boolean;
  delayMonths: number;
}

export interface CalculationResults {
  targetGoal: number;
  monthlyRate: number;
  
  // Standard SIP
  sipRequired: number;
  sipTotalInvested: number;
  sipMaturityValue: number;
  sipTax: number;
  
  // Step-Up SIP
  suStartAmount: number;
  suEndAmount: number;
  suTotalInvested: number;
  suMaturityValue: number;
  suTax: number;
  
  // Delay Cost
  delayedSipRequired: number;
  delayedSipTotalInvested: number;
  costOfDelay: number;
  delayProjections: {
    months: number;
    sipRequired: number;
    costOfDelay: number;
  }[];
  
  yearlyData: {
    year: number;
    sipAmount: number;
    sipBalance: number;
    stepUpAmount: number;
    stepUpBalance: number;
  }[];
}

/**
 * Calculates the future value of a single sum
 */
export const calculateFV = (rate: number, nper: number, pv: number): number => {
  return pv * Math.pow(1 + rate, nper);
};

export const calculateSipPlan = (inputs: CalculatorInputs): CalculationResults => {
  const {
    goalAmount,
    years,
    expectedReturnRate,
    taxRate,
    stepUpPercentage,
    inflationRate,
    useInflationAdjusted,
    delayMonths,
  } = inputs;

  const n = years * 12;
  const r = Math.pow(1 + expectedReturnRate, 1 / 12) - 1;
  
  // 1. Target Goal
  const targetGoal = useInflationAdjusted 
    ? calculateFV(inflationRate, years, goalAmount) 
    : goalAmount;

  // 2. Standard SIP (Mathematical)
  // M = (((1+r)^n - 1) / r) * (1+r)
  const M = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  
  // SIP = T / [ M - taxRate * (M - n) ]
  const sipRequired = targetGoal / (M - taxRate * (M - n));
  const sipTotalInvested = sipRequired * n;
  const sipMaturityValue = sipRequired * M;
  const sipTax = Math.max(0, (sipMaturityValue - sipTotalInvested) * taxRate);

  // 3. Step-Up SIP Multipliers
  let M_su = 0;
  for (let i = 1; i <= n; i++) {
    const yearIndex = Math.floor((i - 1) / 12);
    M_su += Math.pow(1 + stepUpPercentage, yearIndex) * Math.pow(1 + r, n - i + 1);
  }

  let P_mult = 0;
  for (let y = 1; y <= years; y++) {
    P_mult += 12 * Math.pow(1 + stepUpPercentage, y - 1);
  }

  let suStartAmount = 0;

  // Mathematical direct solution
  suStartAmount = targetGoal / (M_su - taxRate * (M_su - P_mult));

  const suEndAmount = suStartAmount * Math.pow(1 + stepUpPercentage, years - 1);
  const suMaturityValue = suStartAmount * M_su;
  const suTotalInvested = suStartAmount * P_mult;
  const suTax = Math.max(0, (suMaturityValue - suTotalInvested) * taxRate);

  // Calculate Year-by-Year Schedule
  const yearlyData = [];
  let currentSipBalance = 0;
  let currentStepUpBalance = 0;
  let currentStepUpAmount = suStartAmount;

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      currentSipBalance = (currentSipBalance + sipRequired) * (1 + r);
      currentStepUpBalance = (currentStepUpBalance + currentStepUpAmount) * (1 + r);
    }
    yearlyData.push({
      year: y,
      sipAmount: sipRequired,
      sipBalance: currentSipBalance,
      stepUpAmount: currentStepUpAmount,
      stepUpBalance: currentStepUpBalance
    });
    currentStepUpAmount = currentStepUpAmount * (1 + stepUpPercentage);
  }

  // 4. Cost of Delay (Only affects Standard SIP in Excel macro)
  let delayedSipRequired = 0;
  let delayedSipTotalInvested = 0;
  let costOfDelay = 0;

  if (delayMonths > 0 && delayMonths < n) {
    const nDelay = n - delayMonths;
    const M_delay = ((Math.pow(1 + r, nDelay) - 1) / r) * (1 + r);
    delayedSipRequired = targetGoal / (M_delay - taxRate * (M_delay - nDelay));
    delayedSipTotalInvested = delayedSipRequired * nDelay;
    costOfDelay = delayedSipTotalInvested - sipTotalInvested;
  }

  // Calculate 3, 6, 9, 12 month projections as seen in the Excel docx report
  const delayProjections = [];
  for (let m = 3; m <= 12; m += 3) {
    if (m < n) {
      const nDelay = n - m;
      const M_delay = ((Math.pow(1 + r, nDelay) - 1) / r) * (1 + r);
      const req = targetGoal / (M_delay - taxRate * (M_delay - nDelay));
      const total = req * nDelay;
      delayProjections.push({
        months: m,
        sipRequired: req,
        costOfDelay: total - sipTotalInvested
      });
    }
  }

  return {
    targetGoal,
    monthlyRate: r,
    
    sipRequired,
    sipTotalInvested,
    sipMaturityValue,
    sipTax,
    
    suStartAmount,
    suEndAmount,
    suTotalInvested,
    suMaturityValue,
    suTax,
    
    delayedSipRequired,
    delayedSipTotalInvested,
    costOfDelay,
    delayProjections,
    
    yearlyData
  };
};
