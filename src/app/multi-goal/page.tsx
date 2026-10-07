import type { Metadata } from "next";
import { MultiGoalCalculator } from "@/components/calc/multi-goal";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Multiple Goals – Corpus Assignment" };

export default async function MultiGoalPage() {
  await requireCalculatorAccess();
  return <MultiGoalCalculator />;
}
