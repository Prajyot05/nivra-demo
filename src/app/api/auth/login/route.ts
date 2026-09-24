import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Legacy password login removed — use Clerk SignIn at /login. */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Password login is disabled. Use Clerk at /login." },
    { status: 410 },
  );
}
