import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not configured");
}

const JWT_SECRET = new TextEncoder().encode(secret);

const COOKIE_NAME = "iga_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, {
    key: "login",
    limit: 10,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  let body: LoginBody;

  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const valid = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const token = await new SignJWT({
    sub: user.id,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
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
}