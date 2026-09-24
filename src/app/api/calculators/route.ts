import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CALCULATOR_IDS } from "@/lib/calculate-schemas";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ids: CALCULATOR_IDS });
}
