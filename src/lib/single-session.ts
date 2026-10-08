import { clerkClient } from "@clerk/nextjs/server";
import { cache } from "react";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export type SessionCheck = "ok" | "evicted";

export const SIGNED_OUT_ELSEWHERE_PATH = "/signed-out";

/**
 * New login wins: revoke every other active Clerk session for this user.
 * Called from `enforceSingleSession` and the `session.created` webhook.
 */
export async function revokeOtherClerkSessions(
  clerkUserId: string,
  keepSessionId: string,
): Promise<number> {
  const client = await clerkClient();
  const list = await client.sessions.getSessionList({
    userId: clerkUserId,
    status: "active",
  });
  let revoked = 0;
  for (const session of list.data) {
    if (session.id === keepSessionId) continue;
    await client.sessions.revokeSession(session.id);
    revoked += 1;
  }
  return revoked;
}

/**
 * One live session per account, enforced on every authenticated server request.
 * The newest Clerk session claims `User.activeSessionId`; any older session that
 * shows up afterwards is revoked and reported as `evicted`.
 * Works without the webhook; the webhook only makes eviction faster.
 */
export const enforceSingleSession = cache(
  async (clerkUserId: string, sessionId: string): Promise<SessionCheck> => {
    if (!isDatabaseConfigured()) return "ok";
    const prisma = getPrisma()!;

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const user = await prisma.user.findUnique({
          where: { clerkUserId },
          select: { id: true, activeSessionId: true, activeSessionStartedAt: true },
        });
        if (!user) return "ok";
        if (user.activeSessionId === sessionId) return "ok";

        const client = await clerkClient();
        const session = await client.sessions.getSession(sessionId);
        const startedAt = new Date(session.createdAt);

        if (
          user.activeSessionStartedAt &&
          startedAt.getTime() < user.activeSessionStartedAt.getTime()
        ) {
          await client.sessions.revokeSession(sessionId).catch(() => undefined);
          return "evicted";
        }

        const claimed = await prisma.user.updateMany({
          where: { id: user.id, activeSessionId: user.activeSessionId },
          data: { activeSessionId: sessionId, activeSessionStartedAt: startedAt },
        });
        if (claimed.count === 0) continue;

        const revoked = await revokeOtherClerkSessions(clerkUserId, sessionId);
        if (revoked > 0) {
          await prisma.auditLog.create({
            data: {
              actorUserId: user.id,
              action: "SESSION_EVICTED_OTHERS",
              targetType: "clerk_user",
              targetId: clerkUserId,
              metadata: { keepSessionId: sessionId, revoked },
            },
          });
        }
        return "ok";
      }
      return "ok";
    } catch (error) {
      console.warn("Single-session check failed; allowing request", error);
      return "ok";
    }
  },
);
