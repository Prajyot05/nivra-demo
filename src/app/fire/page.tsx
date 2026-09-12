import type { Metadata } from "next";
import { FireHealthCalculator } from "@/components/calc/fire-health";

export const metadata: Metadata = { title: "FIRE Planner" };

export default function FirePage() {
  return <FireHealthCalculator />;
}
