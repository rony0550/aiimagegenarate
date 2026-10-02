import { jwtVerify } from "jose";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "imagegenarateai-dev-secret-change-in-production",
);
const COOKIE_NAME = "iga_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  credits: number;
}

/**
 * Reads the session cookie from the request, verifies the JWT, and returns
 * the matching user (or null if not authenticated / token invalid).
 */
export async function getSessionUser(
  cookieValue: string | undefined,
): Promise<SessionUser | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, JWT_SECRET);
    const userId = payload.sub as string;
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        credits: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export { JWT_SECRET, COOKIE_NAME };
