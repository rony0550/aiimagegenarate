import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (based on the session cookie),
 * or 401 if not signed in.
 */

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "imagegenarateai-dev-secret-change-in-production",
);

const COOKIE_NAME = "iga_session";

export async function GET(_req: NextRequest) {
  const token = _req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub as string;
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true, credits: true },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
