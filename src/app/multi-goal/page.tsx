import type { Metadata } from "next";
import { MultiGoalCalculator } from "@/components/calc/multi-goal";
import { requireSignedIn } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Multiple Goals – Corpus Assignment" };

export default async function MultiGoalPage() {
  await requireSignedIn();
  return <MultiGoalCalculator />;
}
