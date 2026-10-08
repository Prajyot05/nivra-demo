-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "clerkInvitationId" TEXT,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "seatLimit" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeSessionId" TEXT,
ADD COLUMN     "activeSessionStartedAt" TIMESTAMP(3);
