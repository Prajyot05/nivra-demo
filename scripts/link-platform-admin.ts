import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim() || "yashurade27@gmail.com";
  const clerkUserId = process.argv[2];
  if (!clerkUserId) {
    throw new Error("Usage: tsx scripts/link-platform-admin.ts <clerkUserId>");
  }

  const seed = await prisma.user.findUnique({ where: { clerkUserId: "seed_nivra_admin" } });
  const byClerk = await prisma.user.findUnique({ where: { clerkUserId } });
  const byEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  let user;
  if (byClerk) {
    user = await prisma.user.update({
      where: { id: byClerk.id },
      data: { email, name: "Yash Urade", role: UserRole.NIVRA_ADMIN },
    });
  } else if (seed) {
    user = await prisma.user.update({
      where: { id: seed.id },
      data: { clerkUserId, email, name: "Yash Urade", role: UserRole.NIVRA_ADMIN },
    });
  } else if (byEmail) {
    user = await prisma.user.update({
      where: { id: byEmail.id },
      data: { clerkUserId, email, name: "Yash Urade", role: UserRole.NIVRA_ADMIN },
    });
  } else {
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email,
        name: "Yash Urade",
        role: UserRole.NIVRA_ADMIN,
        organizationId: null,
      },
    });
  }

  const counts = {
    plans: await prisma.plan.count(),
    orgs: await prisma.organization.count(),
    calculators: await prisma.calculator.count(),
    users: await prisma.user.count(),
  };

  console.log(
    JSON.stringify(
      {
        admin: {
          id: user.id,
          email: user.email,
          role: user.role,
          clerkUserId: user.clerkUserId,
        },
        counts,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
