import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";

/**
 * PATCH /api/auth/update
 *
 * Updates the authenticated user's profile (name and/or avatar URL).
 * Password changes require the current password and are handled separately.
 *
 * Body:
 *   { name?: string, avatar?: string, currentPassword?: string, newPassword?: string }
 */

export const runtime = "nodejs";

interface UpdateBody {
  name?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData: { name?: string | null; avatar?: string | null } = {};

  // Update name
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length > 0 && name.length <= 80) {
      updateData.name = name;
    }
  }

  // Update avatar URL
  if (typeof body.avatar === "string") {
    const avatar = body.avatar.trim();
    if (avatar.length <= 500) {
      updateData.avatar = avatar || null;
    }
  }

  // Password change (requires current password)
  if (body.newPassword) {
    // Lazy-load bcrypt only when needed
    const bcrypt = await import("bcryptjs");
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!body.currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to change password" },
        { status: 400 },
      );
    }
    const valid = await bcrypt.compare(body.currentPassword, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 403 },
      );
    }
    if (body.newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 },
      );
    }
    updateData.name = updateData.name; // keep name if set
    // We need to update passwordHash separately
    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.avatar !== undefined && { avatar: updateData.avatar }),
        passwordHash,
      },
    });
    return NextResponse.json({
      user: { ...user, ...updateData },
      passwordChanged: true,
    });
  }

  // No password change — just update name/avatar
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 },
    );
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, email: true, name: true, avatar: true, credits: true },
  });

  return NextResponse.json({ user: updated });
}
