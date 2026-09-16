import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { UserRole, UserStatus, type User } from "@prisma/client";
import { getPrisma, isDatabaseConfigured, resetPrisma } from "@/lib/db";
import { getEntitlements, type Entitlements } from "@/lib/entitlements";

export type AppUser = User & {
  entitlements: Entitlements;
};

/** Map Clerk publicMetadata.role → UserRole. Default COMPANY_EMPLOYEE. */
export function roleFromClerkMetadata(
  metadata: Record<string, unknown> | undefined,
): UserRole {
  const raw = typeof metadata?.role === "string" ? metadata.role : "";
  if (raw === "NIVRA_ADMIN" || raw === "nivra_admin") return UserRole.NIVRA_ADMIN;
  if (raw === "COMPANY_ADMIN" || raw === "company_admin" || raw === "admin") {
    return UserRole.COMPANY_ADMIN;
  }
  return UserRole.COMPANY_EMPLOYEE;
}

function isPrismaConnectionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("Closed") ||
    msg.includes("Can't reach database") ||
    msg.includes("Connection terminated") ||
    msg.includes("ECONNRESET") ||
    msg.includes("server closed the connection")
  );
}

async function loadUserByClerkId(clerkUserId: string): Promise<User | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getPrisma()!.user.findUnique({ where: { clerkUserId } });
  } catch (error) {
    if (!isPrismaConnectionError(error)) throw error;
    console.warn("Prisma connection closed; reconnecting for user lookup");
    resetPrisma();
    try {
      return await getPrisma()!.user.findUnique({ where: { clerkUserId } });
    } catch (retryError) {
      console.warn("Prisma user lookup failed after reconnect", retryError);
      return null;
    }
  }
}

function sessionFallbackUser(clerkUserId: string, email?: string, name?: string, role?: UserRole): User {
  const platformEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const resolvedEmail = email ?? `${clerkUserId}@session.local`;
  const resolvedRole =
    role ??
    (platformEmail && resolvedEmail.toLowerCase() === platformEmail
      ? UserRole.NIVRA_ADMIN
      : UserRole.COMPANY_EMPLOYEE);

  return {
    id: `session_${clerkUserId}`,
    clerkUserId,
    email: resolvedEmail,
    name: name || resolvedEmail,
    role: resolvedRole,
    organizationId: null,
    status: UserStatus.ACTIVE,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

/**
 * Ensure a Neon User row exists for the signed-in Clerk user.
 * Organization is never created by Clerk — assign organizationId in Neon / admin.
 */
export async function syncUserFromClerk(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch (error) {
    // Clerk Backend API can flake (rate limit / network). Do not fail calculate.
    console.warn("Clerk currentUser() failed; falling back to Neon/session user", error);
  }

  if (!clerkUser) {
    const existing = await loadUserByClerkId(userId);
    if (existing) return existing;
    return sessionFallbackUser(userId);
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    const existing = await loadUserByClerkId(userId);
    if (existing) return existing;
    return sessionFallbackUser(userId);
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email;

  if (!isDatabaseConfigured()) {
    return sessionFallbackUser(
      userId,
      email,
      name,
      roleFromClerkMetadata(clerkUser.publicMetadata as Record<string, unknown>),
    );
  }

  const role = roleFromClerkMetadata(
    clerkUser.publicMetadata as Record<string, unknown>,
  );

  const runDb = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (!isPrismaConnectionError(error)) throw error;
      console.warn("Prisma connection closed during user sync; reconnecting");
      resetPrisma();
      return fn();
    }
  };

  try {
    return await runDb(async () => {
      const prisma = getPrisma()!;
      const existing = await prisma.user.findUnique({ where: { clerkUserId: userId } });

      if (existing) {
        return prisma.user.update({
          where: { id: existing.id },
          data: {
            email,
            name,
            ...(existing.role === UserRole.COMPANY_EMPLOYEE &&
            role !== UserRole.COMPANY_EMPLOYEE
              ? { role }
              : {}),
            lastLoginAt: new Date(),
            status: UserStatus.ACTIVE,
          },
        });
      }

      const byEmail = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
      });
      if (byEmail) {
        const platformEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
        const elevateToAdmin =
          platformEmail && email.toLowerCase() === platformEmail
            ? UserRole.NIVRA_ADMIN
            : undefined;
        return prisma.user.update({
          where: { id: byEmail.id },
          data: {
            clerkUserId: userId,
            email,
            name,
            ...(elevateToAdmin ? { role: elevateToAdmin } : {}),
            ...(byEmail.role === UserRole.COMPANY_EMPLOYEE &&
            role !== UserRole.COMPANY_EMPLOYEE
              ? { role }
              : {}),
            lastLoginAt: new Date(),
            status: UserStatus.ACTIVE,
          },
        });
      }

      const platformEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
      const bootstrapRole =
        platformEmail && email.toLowerCase() === platformEmail
          ? UserRole.NIVRA_ADMIN
          : role;

      return prisma.user.create({
        data: {
          clerkUserId: userId,
          email,
          name,
          role: bootstrapRole,
          organizationId: null,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
        },
      });
    });
  } catch (error) {
    console.warn("User sync to Neon failed; using session fallback", error);
    return sessionFallbackUser(userId, email, name, role);
  }
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const user = await syncUserFromClerk();
  if (!user) return null;
  try {
    const entitlements = await getEntitlements({
      role: user.role,
      organizationId: user.organizationId,
    });
    return { ...user, entitlements };
  } catch (error) {
    console.warn("getEntitlements failed; allowing calculator use", error);
    return {
      ...user,
      entitlements: {
        role: user.role,
        organizationId: user.organizationId,
        organization: null,
        tierLevel: 99,
        tierName: "Degraded",
        subscriptionStatus: null,
        lockMode: "none",
        softLockEndsAt: null,
        canUseCalculators: true,
        canGenerateReports: true,
        allowedCalculatorIds: ["*"],
        reportsGenerated: 0,
        reportLimit: null,
        reportsRemaining: null,
      },
    };
  }
}

/**
 * New login wins: revoke every other active Clerk session for this user.
 * Call from the session.created webhook.
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

export function isNivraAdmin(role: UserRole): boolean {
  return role === UserRole.NIVRA_ADMIN;
}

export function isCompanyAdmin(role: UserRole): boolean {
  return role === UserRole.COMPANY_ADMIN;
}

/** Nav visibility profile: platform admins see all calculators (incl. incomplete). */
export function navProfileForRole(role: UserRole): "dev" | "client" {
  return role === UserRole.NIVRA_ADMIN ? "dev" : "client";
}
