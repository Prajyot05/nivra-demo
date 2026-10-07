import type { Metadata } from "next";
import { ChildEducationPlanner } from "@/components/calc/child-education";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Child Education Planner" };

export default async function EducationPage() {
  await requireCalculatorAccess();
  return <ChildEducationPlanner />;
}
