import {
  InvitationStatus,
  SubscriptionStatus,
  UserStatus,
  type Prisma,
  type PrismaClient,
  type UserRole,
} from "@prisma/client";
import { getPrisma } from "@/lib/db";

type Db = PrismaClient | Prisma.TransactionClient;

export type SeatUsage = {
  planName: string | null;
  /** Null = unlimited. */
  limit: number | null;
  members: number;
  pendingInvites: number;
  used: number;
  available: number | null;
  subscriptionActive: boolean;
};

export type PendingInvite = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  expiresAt: Date;
};

/** Seats = members not removed/disabled + unexpired pending invitations. */
export async function getSeatUsage(organizationId: string, db: Db = getPrisma()!): Promise<SeatUsage> {
  const now = new Date();
  const [subscription, members, pendingInvites] = await Promise.all([
    db.subscription.findFirst({
      where: { organizationId, endedAt: null },
      orderBy: { startedAt: "desc" },
      select: { status: true, plan: { select: { name: true, seatLimit: true } } },
    }),
    db.user.count({
      where: { organizationId, deletedAt: null, status: { not: UserStatus.DISABLED } },
    }),
    db.invitation.count({
      where: { organizationId, status: InvitationStatus.PENDING, expiresAt: { gt: now } },
    }),
  ]);

  const limit = subscription?.plan.seatLimit ?? null;
  const used = members + pendingInvites;
  return {
    planName: subscription?.plan.name ?? null,
    limit,
    members,
    pendingInvites,
    used,
    available: limit == null ? null : Math.max(0, limit - used),
    subscriptionActive:
      subscription?.status === SubscriptionStatus.ACTIVE ||
      subscription?.status === SubscriptionStatus.TRIALING,
  };
}

export async function listPendingInvites(organizationId: string): Promise<PendingInvite[]> {
  return getPrisma()!.invitation.findMany({
    where: {
      organizationId,
      status: InvitationStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, expiresAt: true },
  });
}
