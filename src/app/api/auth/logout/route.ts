import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Clerk handles sign-out on the client via useClerk().signOut(). This route is a no-op keep-alive for older callers. */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, hint: "Use Clerk signOut on the client" });
}
