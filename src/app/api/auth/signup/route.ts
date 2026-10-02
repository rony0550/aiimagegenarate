import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/signup
 * Body: { name, email, password }
 *
 * Creates a new user, hashes the password with bcrypt, and issues a JWT
 * session cookie. The password hash is NEVER returned to the client.
 */

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "imagegenarateai-dev-secret-change-in-production",
);

const COOKIE_NAME = "iga_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface SignupBody {
  name?: string;
  email?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 signups per hour per IP
  const limited = rateLimit(req, { key: "signup", limit: 5, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;

  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL and DIRECT_URL." },
      { status: 503 },
    );
  }

  try {
    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with 30 free welcome credits
    const user = await db.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        credits: 30,
      },
    });

    // Record the welcome bonus transaction
    await db.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 30,
        type: "bonus",
        description: "Welcome bonus — 30 free credits",
      },
    });

    // Issue JWT
    const token = await new SignJWT({ sub: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE}s`)
      .sign(JWT_SECRET);

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        credits: user.credits,
      },
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (error) {
    console.error("Signup request failed:", error);
    return NextResponse.json(
      { error: "Sign up is temporarily unavailable. Check the database connection and try again." },
      { status: 503 },
    );
  }
}
