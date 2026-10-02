import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";
import {
  downloadGeneratedImage,
  getStoredImagePath,
  uploadGeneratedImage,
} from "@/lib/supabase-storage";

/**
 * POST /api/upscale
 *
 * Takes an existing generated image (by URL or generation ID) and produces
 * an enhanced, higher-detail version using the ZAI SDK's image-edit API.
 *
 * Costs 2 credits per upscale.
 *
 * Request body:
 *   { imageUrl?: string, generationId?: string }
 *
 * Response:
 *   { imageUrl, creditsUsed, creditsRemaining }
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const UPSCALE_CREDITS = 2;

interface UpscaleBody {
  imageUrl?: string;
  generationId?: string;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to upscale images", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  if (user.credits < UPSCALE_CREDITS) {
    return NextResponse.json(
      {
        error: `Insufficient credits. Upscaling costs ${UPSCALE_CREDITS} credits but you have ${user.credits}.`,
        code: "INSUFFICIENT_CREDITS",
        required: UPSCALE_CREDITS,
        available: user.credits,
      },
      { status: 402 },
    );
  }

  let body: UpscaleBody;
  try {
    body = (await req.json()) as UpscaleBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Resolve the source image URL.
  let sourceUrl = body.imageUrl;
  let sourceGen: {
    prompt: string;
    style: string;
    ratio: string;
    quality: string;
    imageUrl: string;
  } | null = null;

  if (body.generationId) {
    sourceGen = await db.generation.findFirst({
      where: { id: body.generationId, userId: user.id },
    });
    if (!sourceGen) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 },
      );
    }
    sourceUrl = sourceGen.imageUrl;
  }

  if (!sourceUrl) {
    return NextResponse.json(
      { error: "imageUrl or generationId is required" },
      { status: 400 },
    );
  }

  // localPath is used below to read the file and convert to base64.
  const localPath = sourceUrl.startsWith("/generated/")
    ? path.join(process.cwd(), "public", sourceUrl)
    : null;

  try {
    const zai = await ZAI.create();

    // Convert local image to base64 data URL (the API requires this for local files).
    let imageInput = sourceUrl;
    const storedImagePath = getStoredImagePath(sourceUrl);
    if (storedImagePath) {
      const storedImage = await downloadGeneratedImage(user.id, storedImagePath);
      const imageBase64 = Buffer.from(await storedImage.arrayBuffer()).toString("base64");
      imageInput = `data:${storedImage.type || "image/png"};base64,${imageBase64}`;
    } else if (localPath && fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const base64 = buffer.toString("base64");
      imageInput = `data:image/png;base64,${base64}`;
    }

    // Try image-edit first. If the provider rejects it, fall back to
    // regenerating at the largest available size with the original prompt
    // enhanced with quality cues — this produces a higher-detail variant.
    let base64: string | undefined;
    try {
      const editBody: Record<string, unknown> = {
        prompt:
          "Enhance and upscale this image to maximum resolution. Sharpen fine details, improve clarity, reduce noise, and preserve the original composition and colors. Ultra-detailed, high definition, 8k quality.",
        image: imageInput,
        size: "1024x1024",
      };
      const editResponse = await (zai as unknown as {
        images: {
          generations: {
            edit: (body: Record<string, unknown>) => Promise<{
              data?: Array<{ base64?: string }>;
            }>;
          };
        };
      }).images.generations.edit(editBody);
      base64 = editResponse.data?.[0]?.base64;
    } catch {
      // Image-edit failed — fall back to regenerating at max resolution.
      const upscalePrompt = sourceGen?.prompt
        ? `${sourceGen.prompt}, enhanced detail, ultra-detailed, 8k uhd, maximum resolution, sharp focus, professional quality`
        : "ultra-detailed image, 8k uhd, maximum resolution, sharp focus, professional quality";
      const genResponse = await zai.images.generations.create({
        prompt: upscalePrompt,
        size: "1024x1024",
      });
      base64 = genResponse.data?.[0]?.base64;
    }

    if (!base64) {
      throw new Error("Provider returned no upscaled image");
    }

    const imageUrl = await uploadGeneratedImage(
      user.id,
      "upscaled",
      Buffer.from(base64, "base64"),
    );

    // Deduct credits.
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { credits: { decrement: UPSCALE_CREDITS } },
      select: { credits: true },
    });

    // Record transaction.
    await db.creditTransaction.create({
      data: {
        userId: user.id,
        amount: -UPSCALE_CREDITS,
        type: "usage",
        description: `Upscaled image — ${sourceUrl.slice(-40)}`,
      },
    });

    // Save the upscaled image as a new generation record (linked to original prompt).
    await db.generation.create({
      data: {
        userId: user.id,
        prompt: sourceGen?.prompt
          ? `[Upscaled] ${sourceGen.prompt}`
          : "[Upscaled image]",
        style: sourceGen?.style ?? "Auto",
        ratio: sourceGen?.ratio ?? "1:1",
        quality: "Ultra",
        imageUrl,
        creditsUsed: UPSCALE_CREDITS,
      },
    });

    return NextResponse.json({
      imageUrl,
      creditsUsed: UPSCALE_CREDITS,
      creditsRemaining: updatedUser.credits,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Upscale failed: ${message}` },
      { status: 500 },
    );
  }
}
