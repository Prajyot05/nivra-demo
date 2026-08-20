import type { Metadata } from "next";
import { MfVsFd } from "@/components/calc/mf-vs-fd";

export const metadata: Metadata = { title: "MF vs FD" };

export default function MfFdPage() {
  return <MfVsFd />;
}
