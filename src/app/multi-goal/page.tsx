import type { Metadata } from "next";
import { ComingSoonCalculator } from "@/components/calc/coming-soon";

export const metadata: Metadata = { title: "Multi-Goal" };

export default function MultiGoalPage() {
  return (
    <ComingSoonCalculator
      title="Multi-Goal & Withdrawals"
      calculatorId="multi-goal"
      modes={[
        { id: "assign", label: "Corpus assign" },
        { id: "withdrawals", label: "Withdrawals" },
      ]}
      description="Prajyot · Full Set only for Multiple Goals with Corpus Assignment."
    />
  );
}
