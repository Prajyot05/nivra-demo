import type { Metadata } from "next";
import { UnifiedGoalPlanner } from "@/components/calc/unified-goal-planner";
import { requireSignedIn } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Goal with Current Investments" };

export default async function GoalsPage() {
  await requireSignedIn();
  return <UnifiedGoalPlanner />;
}
