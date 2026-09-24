import type { Metadata } from "next";
import { GoalSipPlanner } from "@/components/goal-sip-planner";
import { requireSignedIn } from "@/lib/require-signed-in";

export const metadata: Metadata = {
  title: "Goal – SIP & Step-Up SIP",
  description:
    "Plan and compare Standard and Step-Up SIP requirements side-by-side with tax, inflation and delay-cost analysis.",
};

export default async function HomePage() {
  await requireSignedIn();
  return <GoalSipPlanner />;
}
