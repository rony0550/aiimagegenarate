
import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

import { db } from "@/lib/db";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uploadGeneratedImage } from "@/lib/supabase-storage";

import type {
  AspectRatio,
  GenerationOptions,
  Quality,
  StyleId,
} from "@/lib/image-generation";

export const runtime = "nodejs";
export const maxDuration = 300;

const CREDITS_PER_IMAGE = 5;

interface GenerateRequestBody {
  prompt: string;
  options?: GenerationOptions;
}

const RATIO_TO_SIZE: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "4:5": "768x960",
  "3:4": "768x1024",
  "16:9": "1024x576",
  "9:16": "576x1024",
};

const STYLE_CUES: Record<StyleId, string> = {
  Auto: "",

  Photorealistic:
    "photorealistic, hyperrealistic, professional photography, realistic skin texture, natural lighting, sharp focus, realistic depth of field",

  Cinematic:
    "cinematic film still, dramatic lighting, atmospheric depth, golden hour lighting, cinematic composition, professional color grading, shallow depth of field",

  "Digital Art":
    "digital art, concept art, highly detailed, vibrant colors, dramatic lighting, polished digital painting, intricate details",

  Anime:
    "anime style, detailed anime key visual, cinematic colors, dramatic lighting, polished illustration, expressive characters",

  "3D":
    "high quality 3D render, realistic materials, ray traced lighting, detailed textures, cinematic lighting, polished 3D composition",

  Illustration:
    "detailed illustration, painterly style, hand drawn quality, rich colors, intricate linework, professional illustration",

  Minimal:
    "minimalist composition, clean background, generous negative space, soft diffused lighting, elegant premium design",

  "Product Photography":
    "professional product photography, studio lighting, softbox reflections, clean seamless background, commercial advertising quality, ultra sharp focus",
};

function detectSubjectCues(prompt: string): string {
  const lower = prompt.toLowerCase();

  const cues: string[] = [];

  if (
    /\b(portrait|woman|man|person|girl|boy|face|headshot|model)\b/.test(
      lower,
    )
  ) {
    cues.push(
      "realistic skin texture",
      "detailed eyes",
      "natural skin tones",
      "balanced facial proportions",
    );
  }

  if (
    /\b(mountain|landscape|forest|ocean|sea|beach|sunset|sunrise|sky|desert|valley|lake|river)\b/.test(
      lower,
    )
  ) {
    cues.push(
      "atmospheric perspective",
      "natural color grading",
      "expansive depth",
      "detailed environment",
    );
  }

  if (
    /\b(city|building|architecture|skyline|street|urban|skyscraper|house|tower|interior)\b/.test(
      lower,
    )
  ) {
    cues.push(
      "architectural detail",
      "realistic materials",
      "accurate perspective",
      "detailed environment",
    );
  }

  if (
    /\b(product|bottle|phone|watch|car|vehicle|chair|table|object|package)\b/.test(
      lower,
    )
  ) {
    cues.push(
      "precise material rendering",
      "realistic reflections",
      "commercial grade detail",
      "professional product presentation",
    );
  }

  if (
    /\b(food|meal|dish|cake|dessert|fruit|coffee|drink|cuisine|burger|pizza)\b/.test(
      lower,
    )
  ) {
    cues.push(
      "appetizing food photography",
      "fresh texture detail",
      "soft directional lighting",
      "professional food styling",
    );
  }

  if (
    /\b(cat|dog|animal|bird|fish|lion|tiger|dragon|creature|wildlife|horse)\b/.test(
      lower,
    )
  ) {
    cues.push(
      "detailed texture",
      "natural anatomy",
      "expressive eyes",
      "realistic lighting",
    );
  }

  if (
    /\b(fantasy|magic|wizard|kingdom|castle|spaceship|alien|futuristic|cyberpunk|sci-fi|robot)\b/.test(
      lower,
    )
  ) {
    cues.push(
      "epic scale",
      "intricate details",
      "immersive atmosphere",
      "cinematic environment",
    );
  }

  return cues.join(", ");
}

function buildStyledPrompt(
  prompt: string,
  style: StyleId,
  quality: Quality,
): string {
  const parts: string[] = [prompt.trim()];

  const subjectCues = detectSubjectCues(prompt);

  if (subjectCues) {
    parts.push(subjectCues);
  }

  const styleCue = STYLE_CUES[style];

  if (styleCue) {
    parts.push(styleCue);
  }

  const qualityBoosters = [
    "highly detailed",
    "sharp focus",
    "professional composition",
    "coherent lighting",
    "high visual quality",
  ];

  if (quality === "Ultra") {
    qualityBoosters.push(
      "maximum detail",
      "premium quality",
      "exceptionally refined details",
    );
  } else if (quality === "High") {
    qualityBoosters.push(
      "high detail",
      "professional quality",
    );
  } else {
    qualityBoosters.push("clean quality");
  }

  parts.push(qualityBoosters.join(", "));

  return parts.filter(Boolean).join(", ");
}

function getHFParameters(
  aspectRatio: AspectRatio,
  quality: Quality,
) {
  const size =
    RATIO_TO_SIZE[aspectRatio] ??
    "1024x1024";

  const [width, height] =
    size.split("x").map(Number);

  let steps = 4;

  if (quality === "Ultra") {
    steps = 8;
  } else if (quality === "High") {
    steps = 6;
  }

  return {
    width,
    height,
    num_inference_steps: steps,
  };
}

/**
 * Generate image using Hugging Face Inference Providers.
 *
 * provider: "auto"
 * Hugging Face automatically selects an available provider.
 */
async function generateWithHuggingFace(
  prompt: string,
  options: {
    aspectRatio: AspectRatio;
    quality: Quality;
  },
): Promise<Buffer> {
  const token = process.env.HF_TOKEN;

  if (!token) {
    throw new Error(
      "HF_TOKEN is missing in environment variables.",
    );
  }

  const model =
    process.env.HF_IMAGE_MODEL ??
    "black-forest-labs/FLUX.1-schnell";

  const parameters = getHFParameters(
    options.aspectRatio,
    options.quality,
  );

  const client = new InferenceClient(token);

  const imageBlob =
    await client.textToImage({
      model,
      provider: "auto",
      inputs: prompt,

      width: parameters.width,
      height: parameters.height,

      num_inference_steps:
        parameters.num_inference_steps,
    }, { outputType: "blob" });

  const arrayBuffer =
    await imageBlob.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error(
      "Hugging Face returned an empty image.",
    );
  }

  return buffer;
}

export async function POST(
  req: NextRequest,
) {
  // ------------------------------------------
  // RATE LIMIT
  // ------------------------------------------

  const limited = rateLimit(req, {
    key: "generate",
    limit: 10,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  // ------------------------------------------
  // PARSE REQUEST
  // ------------------------------------------

  let body: GenerateRequestBody;

  try {
    body =
      (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body",
      },
      { status: 400 },
    );
  }

  const { prompt, options } = body ?? {};

  // ------------------------------------------
  // VALIDATE PROMPT
  // ------------------------------------------

  if (
    !prompt ||
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    return NextResponse.json(
      {
        error: "Prompt is required",
      },
      { status: 400 },
    );
  }

  if (prompt.length > 1100) {
    return NextResponse.json(
      {
        error:
          "Prompt too long (max 1100 characters)",
      },
      { status: 400 },
    );
  }

  // ------------------------------------------
  // AUTHENTICATION
  // ------------------------------------------

  const user = await getSessionUser(
    req.cookies.get(COOKIE_NAME)?.value,
  );

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Please sign in to generate images",
        code: "AUTH_REQUIRED",
      },
      { status: 401 },
    );
  }

  // ------------------------------------------
  // IMAGE COUNT
  // ------------------------------------------

  const count = Math.min(
    Math.max(
      options?.count ?? 1,
      1,
    ),
    4,
  );

  const totalCost =
    count * CREDITS_PER_IMAGE;

  // ------------------------------------------
  // CREDIT CHECK
  // ------------------------------------------

  if (user.credits < totalCost) {
    return NextResponse.json(
      {
        error: `Insufficient credits. You need ${totalCost} credits (${CREDITS_PER_IMAGE} per image × ${count}) but have ${user.credits}.`,

        code: "INSUFFICIENT_CREDITS",

        required: totalCost,

        available: user.credits,
      },
      { status: 402 },
    );
  }

  try {
    // ----------------------------------------
    // ENV CHECK
    // ----------------------------------------

    if (!process.env.HF_TOKEN) {
      return NextResponse.json(
        {
          error:
            "HF_TOKEN is missing in environment variables.",

          code: "CONFIG_ERROR",
        },
        { status: 500 },
      );
    }

    // ----------------------------------------
    // OPTIONS
    // ----------------------------------------

    const quality =
      options?.quality ?? "High";

    const aspectRatio =
      options?.aspectRatio ?? "16:9";

    const style =
      options?.style ?? "Auto";

    // ----------------------------------------
    // BUILD PROMPT
    // ----------------------------------------

    const styledPrompt =
      buildStyledPrompt(
        prompt,
        style,
        quality,
      );

    // ----------------------------------------
    // GENERATE ONE IMAGE
    // ----------------------------------------

    const generateOne =
      async (): Promise<string> => {
        const maxRetries = 3;

        for (
          let attempt = 0;
          attempt <= maxRetries;
          attempt++
        ) {
          try {
            const imageBuffer =
              await generateWithHuggingFace(
                styledPrompt,
                {
                  aspectRatio,
                  quality,
                },
              );

            return await uploadGeneratedImage(
              user.id,
              "gen",
              imageBuffer,
            );
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Unknown error";

            console.error(
              `[HuggingFace attempt ${
                attempt + 1
              }]`,
              message,
            );

            if (
              attempt === maxRetries
            ) {
              throw error;
            }

            const lower =
              message.toLowerCase();

            const shouldRetry =
              message.includes("429") ||
              message.includes("500") ||
              message.includes("502") ||
              message.includes("503") ||
              message.includes("504") ||
              lower.includes(
                "rate limit",
              ) ||
              lower.includes(
                "loading",
              ) ||
              lower.includes(
                "temporarily unavailable",
              ) ||
              lower.includes(
                "timeout",
              );

            if (!shouldRetry) {
              throw error;
            }

            const delay =
              3000 *
              Math.pow(
                2,
                attempt,
              );

            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  delay,
                ),
            );
          }
        }

        throw new Error(
          "Unexpected generation failure.",
        );
      };

    // ----------------------------------------
    // GENERATE IMAGES
    // ----------------------------------------

    const urls: string[] = [];

    const failures: string[] = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      try {
        const url =
          await generateOne();

        urls.push(url);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        failures.push(
          `Image ${i + 1}: ${message}`,
        );
      }

      if (i < count - 1) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1000,
            ),
        );
      }
    }

    // ----------------------------------------
    // ALL FAILED
    // ----------------------------------------

    if (urls.length === 0) {
      return NextResponse.json(
        {
          error:
            `Generation failed. ${
              failures[0] ??
              "Please try again."
            }`,

          code:
            "GENERATION_FAILED",

          details: failures,
        },
        { status: 502 },
      );
    }

    // ----------------------------------------
    // CHARGE ONLY SUCCESSFUL IMAGES
    // ----------------------------------------

    const actualCost =
      urls.length *
      CREDITS_PER_IMAGE;

    const debit = await db.user.updateMany({
      where: {
        id: user.id,
        credits: {
          gte: actualCost,
        },
      },
      data: {
        credits: {
          decrement: actualCost,
        },
      },
    });

    if (debit.count === 0) {
      const latestUser = await db.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });
      const available = latestUser?.credits ?? 0;

      return NextResponse.json(
        {
          error: `Insufficient credits. You need ${actualCost} credits but have ${available}.`,
          code: "INSUFFICIENT_CREDITS",
          required: actualCost,
          available,
        },
        { status: 402 },
      );
    }

    const updatedUser = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { credits: true },
    });

    // ----------------------------------------
    // CREDIT TRANSACTION
    // ----------------------------------------

    await db.creditTransaction.create({
      data: {
        userId: user.id,

        amount:
          -actualCost,

        type: "usage",

        description:
          `Generated ${
            urls.length
          } image${
            urls.length > 1
              ? "s"
              : ""
          } — ${prompt.slice(
            0,
            60,
          )}`,
      },
    });

    // ----------------------------------------
    // SAVE GENERATION HISTORY
    // ----------------------------------------

    await Promise.all(
      urls.map(
        (imageUrl) =>
          db.generation.create({
            data: {
              userId:
                user.id,

              prompt,

              style,

              ratio:
                aspectRatio,

              quality,

              imageUrl,

              creditsUsed:
                CREDITS_PER_IMAGE,
            },
          }),
      ),
    );

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return NextResponse.json({
      imageUrl:
        urls[0],

      images:
        urls,

      count:
        urls.length,

      requestedCount:
        count,

      partialFailure:
        failures.length > 0,

      warning:
        failures.length > 0
          ? `${failures.length} of ${count} images failed. You were only charged for ${urls.length}.`
          : undefined,

      demo: false,

      prompt,

      options,

      createdAt:
        new Date().toISOString(),

      saved: true,

      provider:
        "huggingface",

      model:
        process.env.HF_IMAGE_MODEL ??
        "black-forest-labs/FLUX.1-schnell",

      creditsUsed:
        actualCost,

      creditsRemaining:
        updatedUser.credits,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    console.error(
      "[/api/generate]",
      error,
    );

    return NextResponse.json(
      {
        error:
          `Generation failed: ${message}`,

        code:
          "GENERATION_ERROR",
      },
      { status: 500 },
    );
  }
}

// ------------------------------------------
// GET
// ------------------------------------------

export async function GET() {
  return NextResponse.json({
    endpoint:
      "/api/generate",

    method:
      "POST",

    provider:
      "Hugging Face",

    model:
      process.env.HF_IMAGE_MODEL ??
      "black-forest-labs/FLUX.1-schnell",

    description:
      "AI image generation using Hugging Face Inference Providers",
  });
}
