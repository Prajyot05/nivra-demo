import type { Metadata } from "next";
import { ChildEducationPlanner } from "@/components/calc/child-education";

export const metadata: Metadata = { title: "Child Education Planner" };

export default function EducationPage() {
  return <ChildEducationPlanner />;
}
