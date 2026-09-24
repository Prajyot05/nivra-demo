import { NextResponse } from "next/server";
import { getCurrentAppUser, navProfileForRole } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    profileId: navProfileForRole(user.role),
    role: user.role,
    userId: user.id,
    name: user.name,
    email: user.email,
    organizationId: user.organizationId,
    entitlements: {
      lockMode: user.entitlements.lockMode,
      canUseCalculators: user.entitlements.canUseCalculators,
      canGenerateReports: user.entitlements.canGenerateReports,
      tierName: user.entitlements.tierName,
      allowedCalculatorIds: user.entitlements.allowedCalculatorIds,
      reportsRemaining: user.entitlements.reportsRemaining,
    },
  });
}
