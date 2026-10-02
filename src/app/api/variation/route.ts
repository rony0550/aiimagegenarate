import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uploadGeneratedImage } from "@/lib/supabase-storage";
import type {
  AspectRatio,
  Quality,
  StyleId,
} from "@/lib/image-generation";

/**
 * POST /api/variation
 *
 * Generates a variation of an existing image — same prompt, but different
 * output. This is done by:
 *   1. Looking up the original generation record (by ID) to get the prompt
 *      and options.
 *   2. Appending a subtle variation cue to the prompt (different composition,
 *      angle, or mood) so the model produces a meaningfully different image.
 *   3. Passing a random `seed` to the SDK (some providers honor it, some
 *      don't — the prompt variation ensures a different result regardless).
 *
 * Costs 5 credits per variation (same as a normal generation).
 *
 * Request body:
 *   { generationId: string }   — the original generation to vary from
 *   OR
 *   { prompt: string, options: GenerationOptions }  — for variations from
 *     an unsaved result (e.g. from the generator card)
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const CREDITS_PER_VARIATION = 5;

const RATIO_TO_SIZE: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "4:5": "768x960",
  "3:4": "768x1024",
  "16:9": "1024x576",
  "9:16": "576x1024",
};

interface VariationBody {
  generationId?: string;
  prompt?: string;
  options?: {
    style?: StyleId;
    aspectRatio?: AspectRatio;
    quality?: Quality;
  };
}

/**
 * Subtle variation cues that change the composition/angle/mood without
 * altering the core subject. One is randomly appended to the prompt.
 */
const VARIATION_CUES = [
  "different camera angle, alternative perspective",
  "alternative composition, shifted framing",
  "slightly different lighting direction, varied atmosphere",
  "alternative mood, different time of day",
  "reimagined framing, different focal point",
  "varied color palette, alternative tone",
  "different depth of field, alternative focus",
  "alternative environmental detail, shifted background",
];

export async function POST(req: NextRequest) {
  // Rate limit: 10 variations per minute
  const limited = rateLimit(req, {
    key: "variation",
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const user = await getSessionUser(req.cookies.get(COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to create variations", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  if (user.credits < CREDITS_PER_VARIATION) {
    return NextResponse.json(
      {
        error: `Insufficient credits. Variation costs ${CREDITS_PER_VARIATION} credits but you have ${user.credits}.`,
        code: "INSUFFICIENT_CREDITS",
        required: CREDITS_PER_VARIATION,
        available: user.credits,
      },
      { status: 402 },
    );
  }

  let body: VariationBody;
  try {
    body = (await req.json()) as VariationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Resolve the source prompt + options.
  let prompt: string;
  let style: StyleId;
  let aspectRatio: AspectRatio;
  let quality: Quality;

  if (body.generationId) {
    const gen = await db.generation.findFirst({
      where: { id: body.generationId, userId: user.id },
    });
    if (!gen) {
      return NextResponse.json(
        { error: "Original generation not found" },
        { status: 404 },
      );
    }
    // Strip the "[Upscaled] " prefix if present
    prompt = gen.prompt.replace(/^\[Upscaled\]\s*/, "");
    style = gen.style as StyleId;
    aspectRatio = gen.ratio as AspectRatio;
    quality = gen.quality as Quality;
  } else {
    prompt = (body.prompt ?? "").trim();
    style = body.options?.style ?? "Auto";
    aspectRatio = body.options?.aspectRatio ?? "1:1";
    quality = body.options?.quality ?? "High";
    if (!prompt) {
      return NextResponse.json(
        { error: "Either generationId or prompt is required" },
        { status: 400 },
      );
    }
  }

  // Add a subtle variation cue to ensure a different output.
  const cue = VARIATION_CUES[Math.floor(Math.random() * VARIATION_CUES.length)];
  const variationPrompt = `${prompt}, ${cue}`;

  // Build the styled prompt (reuse the same logic as generate).
  const size = RATIO_TO_SIZE[aspectRatio] ?? "1024x1024";
  const styledPrompt = buildVariationStyledPrompt(variationPrompt, style, quality);

  try {
    const zai = await ZAI.create();

    // Generate with retry for transient 429s.
    const maxRetries = 3;
    let base64: string | undefined;
    let lastErr: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await zai.images.generations.create({
          prompt: styledPrompt,
          size,
          // Some providers honor `seed` — pass a random one for variation.
          // The SDK passes body through as-is.
          seed: Math.floor(Math.random() * 1_000_000),
        } as Parameters<typeof zai.images.generations.create>[0]);
        base64 = response.data?.[0]?.base64;
        if (base64) break;
      } catch (err) {
        lastErr = err;
        if (attempt === maxRetries) break;
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("429")) {
          await new Promise((r) =>
            setTimeout(r, 3000 * Math.pow(2, attempt)),
          );
          continue;
        }
        break;
      }
    }

    if (!base64) {
      const msg =
        lastErr instanceof Error ? lastErr.message : "Provider returned no image";
      return NextResponse.json(
        { error: `Variation failed: ${msg}` },
        { status: 502 },
      );
    }

    const imageUrl = await uploadGeneratedImage(
      user.id,
      "variation",
      Buffer.from(base64, "base64"),
    );

    // Deduct credits.
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { credits: { decrement: CREDITS_PER_VARIATION } },
      select: { credits: true },
    });

    // Record transaction.
    await db.creditTransaction.create({
      data: {
        userId: user.id,
        amount: -CREDITS_PER_VARIATION,
        type: "usage",
        description: `Variation — ${prompt.slice(0, 60)}`,
      },
    });

    // Save as a new generation record.
    await db.generation.create({
      data: {
        userId: user.id,
        prompt: `[Variation] ${prompt}`,
        style,
        ratio: aspectRatio,
        quality,
        imageUrl,
        creditsUsed: CREDITS_PER_VARIATION,
      },
    });

    return NextResponse.json({
      imageUrl,
      creditsUsed: CREDITS_PER_VARIATION,
      creditsRemaining: updatedUser.credits,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Variation failed: ${message}` },
      { status: 500 },
    );
  }
}

/**
 * Builds a styled prompt for the variation. Similar to the generate route's
 * buildStyledPrompt but self-contained (we don't import to keep the
 * variation endpoint independent).
 */
const STYLE_CUES: Record<StyleId, string> = {
  Auto: "",
  Photorealistic:
    "photorealistic, ultra-detailed, 8k, professional photography, sharp focus",
  Cinematic:
    "cinematic composition, dramatic lighting, volumetric light, film still, 8k",
  "Digital Art":
    "digital art, concept art, highly detailed, vibrant colors, artstation",
  Anime: "anime style, detailed anime illustration, vibrant colors, cinematic",
  "3D": "3d render, octane render, stylized 3d, soft cinematic lighting, detailed",
  Illustration: "detailed illustration, painterly, hand-drawn, rich colors",
  Minimal: "minimal, clean composition, negative space, subtle lighting",
  "Product Photography":
    "product photography, studio lighting, soft reflections, commercial quality",
};

function buildVariationStyledPrompt(
  prompt: string,
  style: StyleId,
  quality: Quality,
): string {
  const parts: string[] = [prompt.trim()];
  const styleCue = STYLE_CUES[style];
  if (styleCue) parts.push(styleCue);
  const qualityBooster =
    quality === "Ultra"
      ? "8k uhd, masterpiece, best quality"
      : quality === "High"
        ? "4k, high quality"
        : "high quality";
  parts.push("highly detailed, sharp focus, " + qualityBooster);
  return parts.filter(Boolean).join(", ");
}
