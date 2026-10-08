"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { InvitationStatus, UserRole, UserStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { ADMIN_CACHE_TAG } from "@/lib/admin/queries";
import { resolveCompanyAdminContext } from "@/lib/company-context";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { getSeatUsage } from "@/lib/seats";

export type MemberActionResult = { ok: boolean; message: string };

const INVITE_EXPIRY_DAYS = 7;

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(["admin", "advisor"]),
});

function refresh() {
  revalidateTag(ADMIN_CACHE_TAG);
  revalidatePath("/company/users");
}

async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function requireContext() {
  if (!isDatabaseConfigured()) return null;
  return resolveCompanyAdminContext();
}

export async function inviteMember(input: {
  name: string;
  email: string;
  role: "admin" | "advisor";
}): Promise<MemberActionResult> {
  const ctx = await requireContext();
  if (!ctx) return { ok: false, message: "Only a company admin can invite users." };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, email } = parsed.data;
  const role = parsed.data.role === "admin" ? UserRole.COMPANY_ADMIN : UserRole.COMPANY_EMPLOYEE;
  const prisma = getPrisma()!;

  const reserved = await prisma.$transaction(async (tx) => {
    // Serialize seat checks per org so two admins cannot both take the last seat.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ctx.organizationId}))`;

    const existingUser = await tx.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
      select: { id: true },
    });
    if (existingUser) {
      return { ok: false as const, message: "This email already has a Nivra account." };
    }

    const existingInvite = await tx.invitation.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (existingInvite) {
      return { ok: false as const, message: "This email already has a pending invitation." };
    }

    const seats = await getSeatUsage(ctx.organizationId, tx);
    if (!seats.subscriptionActive) {
      return { ok: false as const, message: "Your subscription is not active." };
    }
    if (seats.limit != null && seats.used >= seats.limit) {
      return {
        ok: false as const,
        message: `Seat limit reached (${seats.used} of ${seats.limit} on ${seats.planName ?? "your plan"}). Remove a member or upgrade the plan.`,
      };
    }

    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + INVITE_EXPIRY_DAYS);
    const invitation = await tx.invitation.create({
      data: {
        organizationId: ctx.organizationId,
        email,
        name,
        role,
        tokenHash: randomUUID(),
        invitedByUserId: ctx.user.id,
        expiresAt,
      },
    });
    return { ok: true as const, invitationId: invitation.id };
  });

  if (!reserved.ok) return reserved;

  try {
    const client = await clerkClient();
    const clerkInvitation = await client.invitations.createInvitation({
      emailAddress: email,
      expiresInDays: INVITE_EXPIRY_DAYS,
      notify: true,
      redirectUrl: `${await appOrigin()}/sign-up`,
      publicMetadata: { role, organizationId: ctx.organizationId },
    });
    await prisma.invitation.update({
      where: { id: reserved.invitationId },
      data: { clerkInvitationId: clerkInvitation.id },
    });
  } catch (error) {
    await prisma.invitation.delete({ where: { id: reserved.invitationId } });
    console.error("Clerk invitation failed", error);
    const detail =
      (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0];
    return {
      ok: false,
      message: detail?.longMessage ?? detail?.message ?? "Could not send the invitation.",
    };
  }

  await prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      actorUserId: ctx.user.id,
      action: "MEMBER_INVITED",
      targetType: "invitation",
      targetId: reserved.invitationId,
      metadata: { role },
    },
  });
  refresh();
  return { ok: true, message: `Invitation sent to ${email}.` };
}

export async function revokeInvite(invitationId: string): Promise<MemberActionResult> {
  const ctx = await requireContext();
  if (!ctx) return { ok: false, message: "Only a company admin can manage invitations." };
  const prisma = getPrisma()!;

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId: ctx.organizationId,
      status: InvitationStatus.PENDING,
    },
  });
  if (!invitation) return { ok: false, message: "Invitation not found." };

  if (invitation.clerkInvitationId) {
    try {
      const client = await clerkClient();
      await client.invitations.revokeInvitation(invitation.clerkInvitationId);
    } catch (error) {
      console.warn("Clerk revokeInvitation failed", error);
    }
  }
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: InvitationStatus.REVOKED },
  });
  await prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      actorUserId: ctx.user.id,
      action: "INVITATION_REVOKED",
      targetType: "invitation",
      targetId: invitation.id,
    },
  });
  refresh();
  return { ok: true, message: `Invitation for ${invitation.email} revoked. Seat freed.` };
}

/**
 * Frees the seat and deletes the Clerk account, which ends every session
 * and lets the same email be invited again later.
 */
export async function removeMember(userId: string): Promise<MemberActionResult> {
  const ctx = await requireContext();
  if (!ctx) return { ok: false, message: "Only a company admin can remove users." };
  if (userId === ctx.user.id) return { ok: false, message: "You cannot remove yourself." };
  const prisma = getPrisma()!;

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: ctx.organizationId, deletedAt: null },
  });
  if (!target) return { ok: false, message: "User not found in this company." };

  if (target.role === UserRole.COMPANY_ADMIN) {
    const admins = await prisma.user.count({
      where: {
        organizationId: ctx.organizationId,
        role: UserRole.COMPANY_ADMIN,
        deletedAt: null,
        status: { not: UserStatus.DISABLED },
      },
    });
    if (admins <= 1) return { ok: false, message: "A company needs at least one admin." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      deletedAt: new Date(),
      status: UserStatus.DISABLED,
      activeSessionId: null,
      activeSessionStartedAt: null,
    },
  });

  if (!target.clerkUserId.startsWith("seed_")) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(target.clerkUserId);
    } catch (error) {
      console.warn("Clerk deleteUser failed", error);
    }
  }

  await prisma.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      actorUserId: ctx.user.id,
      action: "MEMBER_REMOVED",
      targetType: "user",
      targetId: target.id,
    },
  });
  refresh();
  return { ok: true, message: `${target.name} removed. Seat freed.` };
}
