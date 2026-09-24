import type { Metadata } from "next";
import { MfVsFd } from "@/components/calc/mf-vs-fd";
import { requireSignedIn } from "@/lib/require-signed-in";

export const metadata: Metadata = { title: "Mutual Fund vs Fixed Deposit" };

export default async function MfFdPage() {
  await requireSignedIn();
  return <MfVsFd />;
}
