import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { UserRole, UserStatus, type User } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
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

/**
 * Ensure a Neon User row exists for the signed-in Clerk user.
 * Organization is never created by Clerk — assign organizationId in Neon / admin.
 */
export async function syncUserFromClerk(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email;

  if (!isDatabaseConfigured()) {
    // Offline / no DB: ephemeral stand-in for UI wiring
    return {
      id: `local_${userId}`,
      clerkUserId: userId,
      email,
      name,
      role: roleFromClerkMetadata(clerkUser.publicMetadata as Record<string, unknown>),
      organizationId: null,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }

  const prisma = getPrisma()!;
  const role = roleFromClerkMetadata(
    clerkUser.publicMetadata as Record<string, unknown>,
  );

  const existing = await prisma.user.findUnique({ where: { clerkUserId: userId } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        name,
        // Do not overwrite role from metadata on every request once set in DB,
        // unless DB role is still default employee and metadata elevates.
        ...(existing.role === UserRole.COMPANY_EMPLOYEE &&
        role !== UserRole.COMPANY_EMPLOYEE
          ? { role }
          : {}),
        lastLoginAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });
  }

  return prisma.user.create({
    data: {
      clerkUserId: userId,
      email,
      name,
      role,
      organizationId: null,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    },
  });
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const user = await syncUserFromClerk();
  if (!user) return null;
  const entitlements = await getEntitlements({
    role: user.role,
    organizationId: user.organizationId,
  });
  return { ...user, entitlements };
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
