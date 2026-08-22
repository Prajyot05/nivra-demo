import { NextResponse } from "next/server";
import {
  authenticateUser,
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const profileId = authenticateUser(username, password);
  if (!profileId) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(profileId);
  const secure = request.url.startsWith("https://");
  const response = NextResponse.json({ ok: true, profileId });
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions(secure));
  return response;
}
