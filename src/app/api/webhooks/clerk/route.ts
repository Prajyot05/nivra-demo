import { verifyWebhook } from "@clerk/backend/webhooks";
import { NextResponse } from "next/server";
import { revokeOtherClerkSessions } from "@/lib/auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export async function POST(request: Request) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request, {
      signingSecret:
        process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? process.env.CLERK_WEBHOOK_SECRET,
    });
  } catch (err) {
    console.error("Clerk webhook verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "session.created") {
    const sessionId = event.data.id;
    const userId =
      "user_id" in event.data
        ? String(event.data.user_id)
        : String((event.data as { userId?: string }).userId ?? "");
    if (!userId) {
      return NextResponse.json({ ok: true, skipped: "no user id" });
    }
    try {
      const revoked = await revokeOtherClerkSessions(userId, sessionId);
      if (isDatabaseConfigured()) {
        const prisma = getPrisma()!;
        await prisma.auditLog.create({
          data: {
            action: "SESSION_EVICTED_OTHERS",
            targetType: "clerk_user",
            targetId: userId,
            metadata: { keepSessionId: sessionId, revoked },
          },
        });
      }
    } catch (err) {
      console.error("Failed to revoke other sessions", err);
    }
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    // User sync is primarily done on first authenticated request via syncUserFromClerk.
    // Webhook is a no-op placeholder for future invite linking.
  }

  return NextResponse.json({ ok: true });
}
