import type { Metadata } from "next";
import { ComingSoonCalculator } from "@/components/calc/coming-soon";

export const metadata: Metadata = { title: "Investment Growth" };

export default function GrowthPage() {
  return (
    <ComingSoonCalculator
      title="Investment Growth"
      calculatorId="growth-sip"
      modes={[
        { id: "sip", label: "SIP" },
        { id: "stepup", label: "Step-up" },
        { id: "lumpsum", label: "Lumpsum" },
        { id: "periodic", label: "Periodic" },
      ]}
      description="Reference screen for Prajyot (Days 6–8). Modes map to POST /api/calculate/growth-sip | growth-stepup | growth-lumpsum | growth-periodic."
    />
  );
}
