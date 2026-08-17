import type { Metadata } from "next";
import { UnifiedGoalPlanner } from "@/components/calc/unified-goal-planner";

export const metadata: Metadata = { title: "Unified Goal Planner" };

export default function GoalsPage() {
  return <UnifiedGoalPlanner />;
}
