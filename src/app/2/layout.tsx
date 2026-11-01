import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { V2Shell } from "@/components/v2";
import { requireCalculatorAccess } from "@/lib/require-signed-in";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-v2-inter",
});

export default async function V2Layout({ children }: { children: ReactNode }) {
  await requireCalculatorAccess();
  return (
    <div className={`${inter.variable} ${inter.className}`}>
      <V2Shell>{children}</V2Shell>
    </div>
  );
}
