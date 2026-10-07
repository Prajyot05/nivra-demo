import type { Metadata } from "next";
import { UnifiedGoalPlanner } from "@/components/calc/unified-goal-planner";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Goal with Current Investments" };

export default async function GoalsPage() {
  await requireCalculatorAccess();
  return <UnifiedGoalPlanner />;
}
