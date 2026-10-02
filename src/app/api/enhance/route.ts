import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/enhance
 *
 * Uses the ZAI SDK's chat completions to turn a short user prompt into a
 * richer, more cinematic generation prompt. Server-side only — the SDK
 * key is never shipped to the client.
 *
 * Request:  { "prompt": "futuristic car" }
 * Response: { "enhanced": "A futuristic electric sports car driving through a neon-lit megacity at night, ..." }
 */

export const runtime = "nodejs";
export const maxDuration = 30;

interface EnhanceRequestBody {
  prompt: string;
}

const SYSTEM_PROMPT = `You are a world-class AI image prompt engineer specializing in cinematic, photorealistic, and visually compelling image generation.

Transform the user's raw image idea into ONE concise, production-ready image-generation prompt.

CORE RULES:
- Output ONLY the final prompt.
- Never explain your changes.
- Never use quotes, markdown, headings, or labels.
- Maximum 90 words.
- Preserve the user's exact subject, intent, and important details.
- Do not replace, remove, or reinterpret the main subject.
- Do not invent people, objects, locations, brands, text, logos, or story elements unless naturally required by the user's request.
- Never add watermarks, captions, typography, or text unless explicitly requested.
- Resolve vague wording naturally without changing the intended concept.

INTELLIGENT ENHANCEMENT:
Analyze the subject and build the prompt around the most relevant visual dimensions:

1. SUBJECT
Describe the subject's appearance, shape, materials, clothing, pose, expression, or physical characteristics when relevant.

2. ENVIRONMENT
Create an appropriate setting, background, surroundings, and environmental details that support the user's idea.

3. COMPOSITION
Choose an appropriate framing and perspective such as close-up, medium shot, wide shot, aerial view, centered composition, rule of thirds, symmetrical composition, or dynamic perspective.

4. CAMERA
When photorealistic photography is appropriate, intelligently select a suitable lens, camera perspective, focus, depth of field, and subtle motion characteristics.

5. LIGHTING
Choose lighting that fits the scene: soft natural light, golden hour, dramatic studio lighting, rim lighting, volumetric light, neon lighting, overcast light, or other appropriate techniques.

6. COLOR & MOOD
Use a coherent color palette and atmosphere that naturally match the user's concept without unnecessarily forcing cinematic or dark aesthetics.

7. MATERIALS & TEXTURES
Add realistic surface qualities, textures, reflections, shadows, atmospheric depth, and fine details when relevant.

8. STYLE
Identify whether the request is best suited to photography, product advertising, editorial, illustration, 3D render, concept art, anime, fantasy, architecture, fashion, food photography, or another visual style.

SUBJECT-SPECIFIC OPTIMIZATION:
- Portrait → realistic skin texture, facial detail, natural expression, flattering light, lens, depth of field.
- Product → premium studio setup, material accuracy, controlled reflections, clean composition, commercial photography.
- Food → realistic textures, appetizing presentation, natural highlights, editorial food photography.
- Landscape → environmental depth, natural atmosphere, realistic lighting, expansive composition.
- Architecture → accurate perspective, realistic materials, balanced framing, architectural photography.
- City → believable urban environment, atmospheric depth, perspective, street lighting.
- Vehicle → accurate proportions, realistic paint and reflections, dynamic perspective, automotive photography.
- Character → anatomy, clothing, pose, expression, environment, character-focused lighting.
- Fantasy/Sci-Fi → coherent world-building, detailed environment, believable materials, atmospheric effects.
- Fashion → fabric detail, styling, pose, editorial composition, professional lighting.

QUALITY:
Prefer specific visual descriptions over generic quality words.
Use terms such as photorealistic, ultra-detailed, cinematic, professional photography, high dynamic range, or 8k only when they meaningfully improve the requested image.

DO NOT:
- Add irrelevant details just to make the prompt longer.
- Repeat the same adjectives.
- Overload the prompt with technical camera terminology.
- Force photorealism onto clearly artistic requests.
- Force cinematic lighting onto every image.
- Turn a simple concept into a different story.

FINAL VALIDATION:
Before outputting, silently verify:
- The original intent is preserved.
- The main subject is unchanged.
- Every added detail supports the concept.
- The prompt is visually specific and coherent.
- No unnecessary text or watermark instructions exist.
- The final prompt is a single paragraph and under 90 words.

Return ONLY the final enhanced image-generation prompt.`;

export async function POST(req: NextRequest) {
  // Rate limit: 20 enhances per minute
  const limited = rateLimit(req, { key: "enhance", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  let body: EnhanceRequestBody;
  try {
    body = (await req.json()) as EnhanceRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt } = body ?? {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 1100) {
    return NextResponse.json(
      { error: "Prompt too long (max 1100 chars)" },
      { status: 400 },
    );
  }

  try {
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 260,
    });

    const enhanced = response.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return NextResponse.json(
        { error: "Enhancement returned no content" },
        { status: 502 },
      );
    }

    // Strip any surrounding quotes the model may have added.
    const cleaned = enhanced.replace(/^["'`]+|["'`]+$/g, "").trim();

    return NextResponse.json({
      enhanced: cleaned,
      original: prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Enhancement failed: ${message}` },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/enhance",
    method: "POST",
    description: "AI-assisted prompt enhancement using ZAI chat completions",
  });
}
