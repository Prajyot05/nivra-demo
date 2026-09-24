import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Drop the cached client so the next getPrisma() opens a fresh connection (Neon idle close). */
export function resetPrisma(): void {
  const existing = globalForPrisma.prisma;
  globalForPrisma.prisma = undefined;
  if (existing) {
    void existing.$disconnect().catch(() => undefined);
  }
}

export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

/** Prefer getPrisma(); this throws if DATABASE_URL is missing. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    if (!client) {
      throw new Error(
        "DATABASE_URL is not set. Add it to .env (see .env.example) before using the database.",
      );
    }
    return Reflect.get(client, prop, receiver);
  },
});
