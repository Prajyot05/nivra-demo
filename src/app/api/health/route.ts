import { NextResponse } from "next/server";
import { CALCULATOR_IDS } from "@/lib/calculate-schemas";

export async function GET() {
  return NextResponse.json({ ok: true, calculators: CALCULATOR_IDS });
}
