import type { Metadata } from "next";
import { MultiGoalCalculator } from "@/components/calc/multi-goal";

export const metadata: Metadata = { title: "Multi-Goal" };

export default function MultiGoalPage() {
  return <MultiGoalCalculator />;
}
