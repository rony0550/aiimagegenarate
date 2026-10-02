import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    error: "Credit payments are coming soon.",
  }, { status: 501 });
}
