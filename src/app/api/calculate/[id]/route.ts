import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { dispatch } from "@/lib/calculate-dispatch";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  let user: Awaited<ReturnType<typeof getCurrentAppUser>> = null;
  try {
    user = await getCurrentAppUser();
  } catch (error) {
    console.error("getCurrentAppUser failed on calculate", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitlements } = user;
  if (!entitlements.canUseCalculators) {
    return NextResponse.json(
      { error: "Calculators are locked for this organization" },
      { status: 403 },
    );
  }
  if (
    entitlements.allowedCalculatorIds.length > 0 &&
    !entitlements.allowedCalculatorIds.includes("*") &&
    !entitlements.allowedCalculatorIds.includes(id)
  ) {
    return NextResponse.json(
      { error: `Calculator not included in plan: ${id}` },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const result = dispatch(id, body);
    return NextResponse.json({ id, result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : "Calculation failed";
    if (status >= 500) console.error(error);
    return NextResponse.json({ error: message }, { status });
  }
}
