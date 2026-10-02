import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getSessionUser,
  COOKIE_NAME,
} from "@/lib/auth";
import fs from "fs";
import path from "path";
import { deleteGeneratedImage } from "@/lib/supabase-storage";

/**
 * DELETE /api/generations/[id]
 *
 * Deletes a generation record and its generated image file.
 *
 * Security:
 * - Requires authentication
 * - Users can only delete their own generations
 * - Returns 404 if the generation does not exist
 *   or belongs to another user
 */

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
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
    // Get generation ID
    // --------------------------------------------------

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: "Generation ID is required",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // Find generation owned by current user
    // --------------------------------------------------

    const generation =
      await db.generation.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

    if (!generation) {
      return NextResponse.json(
        {
          error: "Generation not found",
          code: "GENERATION_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------
    // Delete image file
    // --------------------------------------------------

    /**
     * imageUrl is expected to look like:
     *
     * /generated/gen_123456_abc123.png
     *
     * We remove the leading slash before joining
     * it with the public directory.
     */

    try {
      if (generation.imageUrl.startsWith("/generated/")) {
        const relativePath = generation.imageUrl.replace(/^[/\\]+/, "");
        const filePath = path.join(process.cwd(), "public", relativePath);
        const publicDir = path.resolve(process.cwd(), "public");
        const resolvedFilePath = path.resolve(filePath);

        if (
          resolvedFilePath.startsWith(publicDir + path.sep) &&
          fs.existsSync(resolvedFilePath)
        ) {
          fs.unlinkSync(resolvedFilePath);
        }
      } else {
        await deleteGeneratedImage(generation.imageUrl, user.id);
      }
    } catch (fileError) {
      // File deletion is best-effort.
      // The DB record should still be deleted.
      console.warn(
        "[DELETE /api/generations/[id]] Could not delete image file:",
        fileError,
      );
    }

    // --------------------------------------------------
    // Delete database record
    // --------------------------------------------------

    await db.generation.delete({
      where: {
        id: generation.id,
      },
    });

    // --------------------------------------------------
    // Success response
    // --------------------------------------------------

    return NextResponse.json({
      ok: true,
      deleted: generation.id,
    });
  } catch (error) {
    console.error(
      "[DELETE /api/generations/[id]]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete generation",
        code: "DELETE_GENERATION_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}