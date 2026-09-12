import type { Metadata } from "next";
import { MfVsFd } from "@/components/calc/mf-vs-fd";

export const metadata: Metadata = { title: "Mutual Fund vs Fixed Deposit" };

export default function MfFdPage() {
  return <MfVsFd />;
}
