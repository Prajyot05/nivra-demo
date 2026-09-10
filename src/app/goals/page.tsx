import type { Metadata } from "next";
import { UnifiedGoalPlanner } from "@/components/calc/unified-goal-planner";

export const metadata: Metadata = { title: "Goal with Current Investments" };

export default function GoalsPage() {
  return <UnifiedGoalPlanner />;
}
