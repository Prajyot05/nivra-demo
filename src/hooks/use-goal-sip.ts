import { useEffect, useState } from "react";
import { calculate } from "@/lib/calculate-client";

export type GoalSipResult = {
  inflAdjGoal: number;
  targetGoal: number;
  standard: {
    monthlySip: number;
    invested: number;
    maturity: number;
    gain: number;
    tax: number;
    netAfterTax: number;
  };
  stepUp: {
    monthlySip: number;
    endMonthlySip?: number;
    invested: number;
    maturity: number;
    gain: number;
    tax: number;
    netAfterTax: number;
  };
  schedule: Array<{
    year: number;
    stdMonthly: number;
    stdYearEnd: number;
    stepMonthly: number;
    stepYearEnd: number;
  }>;
  delays: Array<{ months: number; sipRequired: number; extraInvested: number }>;
};

export type GoalSipInput = {
  clientName: string;
  age: number;
  goalAmount: number;
  tenureYears: number;
  returnPct: number;
  inflationPct: number;
  taxPct: number;
  stepUpPct: number;
  useInflationAdjustedGoal: boolean;
};

export function useGoalSip(input: GoalSipInput) {
  const [result, setResult] = useState<GoalSipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (input.tenureYears <= 0 || input.goalAmount < 0) {
      setError("Tenure and goal must be valid");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      calculate<GoalSipResult>("goal-sip", {
        clientName: input.clientName,
        age: input.age,
        goalAmount: input.goalAmount,
        tenureYears: input.tenureYears,
        returnPct: input.returnPct,
        inflationPct: input.inflationPct,
        taxPct: input.taxPct,
        stepUpPct: input.stepUpPct,
        useInflationAdjustedGoal: input.useInflationAdjustedGoal,
      })
        .then((payload) => {
          if (cancelled) return;
          setResult(payload.result);
          setError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Calculation failed");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [
    input.clientName,
    input.age,
    input.goalAmount,
    input.tenureYears,
    input.returnPct,
    input.inflationPct,
    input.taxPct,
    input.stepUpPct,
    input.useInflationAdjustedGoal,
  ]);

  return { result, error, loading };
}
