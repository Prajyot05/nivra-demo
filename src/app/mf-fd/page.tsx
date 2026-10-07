import type { Metadata } from "next";
import { MfVsFd } from "@/components/calc/mf-vs-fd";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Mutual Fund vs Fixed Deposit" };

export default async function MfFdPage() {
  await requireCalculatorAccess();
  return <MfVsFd />;
}
