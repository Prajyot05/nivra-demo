import { calculateSipPlan, CalculatorInputs } from "./src/utils/calculator";

const inputs: CalculatorInputs = {
  goalAmount: 10000000,
  years: 15,
  expectedReturnRate: 0.12,
  taxRate: 0.125,
  stepUpPercentage: 0.10,
  inflationRate: 0.0575,
  useInflationAdjusted: false,
  delayMonths: 0,
};

const resMath = calculateSipPlan(inputs);
console.log("--- MATHEMATICAL ---");
console.log(`Standard SIP Required: ${resMath.sipRequired.toFixed(2)} (Expected ~22782)`);
console.log(`Standard SIP Total Invested: ${resMath.sipTotalInvested.toFixed(2)} (Expected ~4100788)`);
console.log(`Standard SIP Maturity: ${resMath.sipMaturityValue.toFixed(2)} (Expected ~10842744)`);
console.log(`Standard SIP Tax: ${resMath.sipTax.toFixed(2)} (Expected ~842744)`);
console.log(`Step-Up SIP Start: ${resMath.suStartAmount.toFixed(2)} (Expected ~12958.46)`);
console.log(`Step-Up SIP Total Invested: ${resMath.suTotalInvested.toFixed(2)} (Expected ~4940669)`);
console.log(`Step-Up SIP Maturity: ${resMath.suMaturityValue.toFixed(2)} (Expected ~10722761)`);
console.log(`Step-Up SIP Tax: ${resMath.suTax.toFixed(2)} (Expected ~722761)`);

const resGoalSeek = calculateSipPlan(inputs);
console.log("\n--- GOAL SEEK ---");
console.log(`Step-Up SIP Start: ${resGoalSeek.suStartAmount.toFixed(2)} (Expected ~12958.46)`);
console.log(`Step-Up SIP Total Invested: ${resGoalSeek.suTotalInvested.toFixed(2)} (Expected ~4940669)`);
console.log(`Step-Up SIP Maturity: ${resGoalSeek.suMaturityValue.toFixed(2)} (Expected ~10722761)`);
console.log(`Step-Up SIP Tax: ${resGoalSeek.suTax.toFixed(2)} (Expected ~722761)`);
