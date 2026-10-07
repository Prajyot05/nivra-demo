import type { Metadata } from "next";
import { FireHealthCalculator } from "@/components/calc/fire-health";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "FIRE Planner" };

export default async function FirePage() {
  await requireCalculatorAccess();
  return <FireHealthCalculator />;
}
