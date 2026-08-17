import type { Metadata } from "next";
import { ComingSoonCalculator } from "@/components/calc/coming-soon";

export const metadata: Metadata = { title: "FIRE / Financial Health" };

export default function FirePage() {
  return (
    <ComingSoonCalculator
      title="FIRE / Financial Health"
      calculatorId="fire"
      modes={[
        { id: "fire", label: "FIRE" },
        { id: "health", label: "Health" },
      ]}
      description="Days 17–20. Reuse SIP, step-up, inflation, corpus growth."
    />
  );
}
