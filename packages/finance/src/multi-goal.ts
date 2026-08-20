import { inflate } from "./inflation";
import { requiredLumpsum, requiredSip } from "./goal";

export type MultiGoalItem = {
  name: string;
  amount: number;
  years: number;
};

export type MultiGoalInput = {
  shortTermYears: number;
  shortTermReturn: number;
  longTermReturn: number;
  inflationRate: number;
  taxRate: number;
  delayMonths?: number;
  currentCorpus?: number;
  corpusReturn?: number;
  goals: MultiGoalItem[];
};

function yieldFor(years: number, shortTermYears: number, st: number, lt: number): number {
  return years <= shortTermYears ? st : lt;
}

/**
 * Full Set Multiple Goals with Corpus Assignment v2.
 * Corpus is assigned to soonest goals first (PV of required lumpsum), then remaining SIP / lumpsum.
 */
export function calculateMultiGoalAssign(input: MultiGoalInput) {
  const delay = input.delayMonths ?? 0;
  const corpusReturn = input.corpusReturn ?? input.shortTermReturn;
  let remainingCorpus = input.currentCorpus ?? 0;

  const ordered = input.goals
    .map((goal, index) => ({ ...goal, index }))
    .filter((g) => g.amount > 0 && g.years > 0)
    .sort((a, b) => a.years - b.years || a.index - b.index);

  const assignedByIndex = new Map<number, number>();
  for (const goal of ordered) {
    const infl = inflate(goal.amount, input.inflationRate, goal.years);
    const yld = yieldFor(goal.years, input.shortTermYears, input.shortTermReturn, input.longTermReturn);
    const fullLs = requiredLumpsum({
      target: infl,
      years: goal.years,
      annualReturn: yld,
      taxRate: input.taxRate,
    });
    const assigned = Math.min(remainingCorpus, fullLs);
    assignedByIndex.set(goal.index, assigned);
    remainingCorpus -= assigned;
  }

  const goals = input.goals.map((goal, index) => {
    if (goal.amount <= 0 || goal.years <= 0) {
      return {
        name: goal.name,
        amount: goal.amount,
        years: goal.years,
        inflAdjGoal: 0,
        assigned: 0,
        remainingTarget: 0,
        monthlySip: 0,
        lumpsum: 0,
        sipInvested: 0,
        delayCost: 0,
        bucket: "LT" as const,
      };
    }
    const inflAdjGoal = inflate(goal.amount, input.inflationRate, goal.years);
    const yld = yieldFor(goal.years, input.shortTermYears, input.shortTermReturn, input.longTermReturn);
    const assigned = assignedByIndex.get(index) ?? 0;
    const assignedFv = assigned * (((1 - (input.taxRate ?? 0)) * (1 + yld) ** goal.years) + (input.taxRate ?? 0));
    const remainingTarget = Math.max(0, inflAdjGoal - assignedFv);
    const monthlySip = remainingTarget <= 1e-8
      ? 0
      : requiredSip({
          target: remainingTarget,
          years: goal.years,
          annualReturn: yld,
          taxRate: input.taxRate,
        });
    const lumpsum = remainingTarget <= 1e-8
      ? 0
      : requiredLumpsum({
          target: remainingTarget,
          years: goal.years,
          annualReturn: yld,
          taxRate: input.taxRate,
        });
    const sipInvested = monthlySip * goal.years * 12;
    let delayCost = 0;
    if (delay > 0 && monthlySip > 0) {
      const delayedMonths = goal.years * 12 - delay;
      const delayedSip = requiredSip({
        target: remainingTarget,
        years: delayedMonths / 12,
        annualReturn: yld,
        taxRate: input.taxRate,
      });
      delayCost = delayedSip * delayedMonths - sipInvested;
    }
    return {
      name: goal.name,
      amount: goal.amount,
      years: goal.years,
      inflAdjGoal,
      assigned,
      remainingTarget,
      monthlySip,
      lumpsum,
      sipInvested,
      delayCost,
      bucket: (goal.years <= input.shortTermYears ? "ST" : "LT") as "ST" | "LT",
    };
  });

  return {
    goals,
    totalMonthlySip: goals.reduce((s, g) => s + g.monthlySip, 0),
    totalSipInvested: goals.reduce((s, g) => s + g.sipInvested, 0),
    totalLumpsum: goals.reduce((s, g) => s + g.lumpsum, 0),
    totalAssigned: goals.reduce((s, g) => s + g.assigned, 0),
    unassignedCorpus: remainingCorpus,
    compare: goals.filter((g) => g.years > 0 && g.amount > 0).map((g) => ({
      category: g.name,
      assigned: g.assigned,
      remaining: g.lumpsum,
    })),
  };
}
