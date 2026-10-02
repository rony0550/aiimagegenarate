import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";

/**
 * GET /api/credits/balance
 * Returns the authenticated user's current credit balance + recent
 * transactions. Returns 401 if not authenticated.
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const transactions = await db.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    credits: user.credits,
    transactions,
  });
}
