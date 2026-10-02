import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getSessionUser,
  COOKIE_NAME,
} from "@/lib/auth";
import { getImageRouteUrl } from "@/lib/supabase-storage";

/**
 * GET /api/generations
 *
 * Returns the authenticated user's generation history
 * in newest-first order.
 *
 * Query params:
 *   limit  — max items to return (default 50, max 200)
 *   offset — pagination offset (default 0)
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

    const user = await getSessionUser(
      req.cookies.get(COOKIE_NAME)?.value,
    );

    if (!user) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          code: "AUTH_REQUIRED",
        },
        {
          status: 401,
        },
      );
    }

    // --------------------------------------------------
    // Query parameters
    // --------------------------------------------------

    const url = new URL(req.url);

    const rawLimit =
      parseInt(
        url.searchParams.get("limit") ?? "50",
        10,
      );

    const rawOffset =
      parseInt(
        url.searchParams.get("offset") ?? "0",
        10,
      );

    const limit = Math.min(
      Math.max(
        Number.isNaN(rawLimit)
          ? 50
          : rawLimit,
        1,
      ),
      200,
    );

    const offset = Math.max(
      Number.isNaN(rawOffset)
        ? 0
        : rawOffset,
      0,
    );

    // --------------------------------------------------
    // Fetch generations + total count
    // --------------------------------------------------

    const [generations, totalCount] =
      await Promise.all([
        db.generation.findMany({
          where: {
            userId: user.id,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: limit,
          skip: offset,
        }),

        db.generation.count({
          where: {
            userId: user.id,
          },
        }),
      ]);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return NextResponse.json({
      generations: generations.map((generation) => ({
        ...generation,
        imageUrl: getImageRouteUrl(generation.imageUrl, user.id),
      })),
      totalCount,
      limit,
      offset,
      hasMore:
        offset + generations.length <
        totalCount,
    });
  } catch (error) {
    console.error(
      "[GET /api/generations]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load generation history",
        code: "GENERATIONS_FETCH_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}