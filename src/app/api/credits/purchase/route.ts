import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/credits/purchase
 * Body: { planId: "free" | "creator" | "pro" }
 *
 * Mock credit-purchase flow. In production this would redirect to a
 * Stripe Checkout session and credit the account via webhook. For this
 * demo, we credit the account immediately.
 *
 * Plan → credits mapping:
 *   free    →  30 credits  ($0)
 *   creator → 500 credits  ($18)
 *   pro     → unlimited*   ($49) — represented as 10000 credits
 *
 * *Pro is "unlimited" but we cap at 10000 to keep the int field sane.
 */

export const runtime = "nodejs";

interface PurchaseBody {
  planId?: string;
}

const PLAN_CREDITS: Record<string, { credits: number; label: string; price: number }> = {
  free: { credits: 30, label: "Free", price: 0 },
  creator: { credits: 500, label: "Creator", price: 18 },
  pro: { credits: 10000, label: "Pro", price: 49 },
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to purchase credits" },
      { status: 401 },
    );
  }

  let body: PurchaseBody;
  try {
    body = (await req.json()) as PurchaseBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const planId = (body.planId ?? "").toLowerCase();
  const plan = PLAN_CREDITS[planId];
  if (!plan) {
    return NextResponse.json(
      { error: "Invalid plan. Choose free, creator, or pro." },
      { status: 400 },
    );
  }

  // Credit the user's account atomically.
  const updated = await db.user.update({
    where: { id: user.id },
    data: { credits: { increment: plan.credits } },
    select: { credits: true },
  });

  // Record the transaction.
  await db.creditTransaction.create({
    data: {
      userId: user.id,
      amount: plan.credits,
      type: "purchase",
      description: `${plan.label} plan — ${plan.credits} credits`,
    },
  });

  return NextResponse.json({
    ok: true,
    plan: planId,
    creditsAdded: plan.credits,
    creditsTotal: updated.credits,
  });
}
