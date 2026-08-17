import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { dispatch } from "@/lib/calculate-dispatch";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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
