import { NextResponse } from "next/server";

/** Legacy password login removed — use Clerk SignIn at /login. */
export async function POST() {
  return NextResponse.json(
    { error: "Password login is disabled. Use Clerk at /login." },
    { status: 410 },
  );
}
