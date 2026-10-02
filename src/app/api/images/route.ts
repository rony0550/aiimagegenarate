import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";
import { downloadGeneratedImage } from "@/lib/supabase-storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const objectPath = req.nextUrl.searchParams.get("path");
  if (!objectPath) {
    return NextResponse.json({ error: "Image path is required" }, { status: 400 });
  }

  try {
    const image = await downloadGeneratedImage(user.id, objectPath);
    return new Response(await image.arrayBuffer(), {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": image.type || "image/png",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}