/**
 * ImageGenarateAI — Image Generation Service (abstracted)
 *
 * This module is the ONLY place that knows how images are produced.
 * The UI never calls a provider directly — it calls `generateImage()`.
 *
 * Architecture:
 *
 *   UI (hero-generator)
 *        ↓
 *   generateImage()  ←  this file
 *        ↓
 *   POST /api/generate          (server route — see src/app/api/generate/route.ts)
 *        ↓
 *   z-ai-web-dev-sdk OR demo image
 *        ↓
 *   image URL
 *        ↓
 *   generated-result.tsx
 *
 * The API key (when real generation is enabled) lives ONLY in env vars on the
 * server. The browser never sees it.
 *
 * To enable real generation later:
 *   1. Add to .env:
 *        ZAI_API_KEY=sk-your-key-here
 *        USE_REAL_API=true
 *   2. Restart the dev server. The UI stays the same.
 */

export type GenerationStatus = "idle" | "generating" | "completed" | "error";

export type AspectRatio = "1:1" | "4:5" | "3:4" | "16:9" | "9:16";
export type Quality = "Standard" | "High" | "Ultra";
export type ImageCount = 1 | 2 | 4;

export type StyleId =
  | "Auto"
  | "Photorealistic"
  | "Cinematic"
  | "Digital Art"
  | "Anime"
  | "3D"
  | "Illustration"
  | "Minimal"
  | "Product Photography";

export interface GenerationOptions {
  style: StyleId;
  aspectRatio: AspectRatio;
  quality: Quality;
  count: ImageCount;
}

export interface GenerationProgress {
  /** 0..100 */
  progress: number;
  /** Human-friendly status line for the current phase */
  message: string;
}

export interface GenerationResult {
  imageUrl: string;
  /** All generated image URLs (1, 2, or 4 depending on options.count) */
  images: string[];
  prompt: string;
  options: GenerationOptions;
  /** ISO timestamp */
  createdAt: string;
  /** Stable id (used as React key) */
  id: string;
  /** Whether the result came from the demo path or a real provider */
  demo: boolean;
  /** Whether the generation was saved to the user's history (auth required) */
  saved: boolean;
  /** Credits used for this generation */
  creditsUsed?: number;
  /** Credits remaining after this generation */
  creditsRemaining?: number;
}

/** Phases used to drive both the progress curve and the status messages. */
const PHASES: Array<{ at: number; message: string }> = [
  { at: 0, message: "Understanding your prompt..." },
  { at: 18, message: "Planning composition..." },
  { at: 42, message: "Building the scene..." },
  { at: 67, message: "Adding lighting and details..." },
  { at: 89, message: "Rendering final image..." },
  { at: 92, message: "Almost there..." },
  { at: 100, message: "Image ready ✨" },
];

function messageFor(progress: number): string {
  let current = PHASES[0].message;
  for (const phase of PHASES) {
    if (progress >= phase.at) current = phase.message;
  }
  return current;
}

/**
 * Progress curve that drives the cinematic animation while the server works.
 *
 * The progress eases through the phases 0→18→42→67→89, then **caps at 92%**
 * and waits there ("Rendering final image...") until the server responds.
 *
 * When the fetch resolves, `finish()` is called which fast-forwards to 100%
 * and reveals the result. This way the UI never shows a fake "Ready" state
 * before the real image is available.
 *
 * The animation runs indefinitely (capped at 92%) so it works for both the
 * demo path (~instant) and the real API path (~30-60s).
 */
function runMockProgress(onProgress: (p: GenerationProgress) => void): () => void {
  // Time to reach 92% — after this, progress stays at 92% until the fetch
  // completes and `finish()` fast-forwards to 100%.
  const rampDuration = 20000; // 20s to reach 92%
  const start = performance.now();
  let raf = 0;
  let stopped = false;

  // Anchor points: [timeFraction, progress]
  // 0% → 18% → 42% → 67% → 89% → 92% (cap, NOT 100%)
  const curve: Array<[number, number]> = [
    [0.0, 0],
    [0.12, 18],
    [0.32, 42],
    [0.55, 67],
    [0.82, 89],
    [1.0, 92], // cap at 92% — 100% only when fetch completes
  ];

  const interp = (t: number): number => {
    for (let i = 0; i < curve.length - 1; i++) {
      const [t0, p0] = curve[i];
      const [t1, p1] = curve[i + 1];
      if (t >= t0 && t <= t1) {
        const local = (t - t0) / (t1 - t0);
        const eased =
          local < 0.5
            ? 2 * local * local
            : 1 - Math.pow(-2 * local + 2, 2) / 2;
        return Math.round(p0 + (p1 - p0) * eased);
      }
    }
    return 92; // cap
  };

  const tick = () => {
    if (stopped) return;
    const elapsed = performance.now() - start;
    const t = Math.min(1, elapsed / rampDuration);
    const progress = interp(t);
    onProgress({ progress, message: messageFor(progress) });
    // Keep ticking even after t reaches 1, so the progress stays at 92%
    // and the animation (shimmer, scan line) keeps playing until the
    // fetch completes and calls stopProgress().
    if (!stopped) {
      raf = requestAnimationFrame(tick);
    }
  };

  raf = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}

interface ApiSuccessResponse {
  imageUrl: string;
  images?: string[];
  count?: number;
  demo: boolean;
  prompt: string;
  options: GenerationOptions;
  createdAt: string;
  saved?: boolean;
  creditsUsed?: number;
  creditsRemaining?: number;
}
interface ApiErrorResponse {
  error: string;
  code?: "AUTH_REQUIRED" | "INSUFFICIENT_CREDITS" | string;
  required?: number;
  available?: number;
}

/** Custom error class so the UI can branch on auth/credits errors. */
export class GenerationError extends Error {
  code?: string;
  required?: number;
  available?: number;
  constructor(
    message: string,
    code?: string,
    required?: number,
    available?: number,
  ) {
    super(message);
    this.name = "GenerationError";
    this.code = code;
    this.required = required;
    this.available = available;
  }
}

/**
 * Public API — the only function the UI ever calls.
 *
 * 1. Starts the cinematic progress animation (capped at 92%).
 * 2. POSTs to /api/generate.
 * 3. When the server responds, fast-forwards progress to 100% and resolves
 *    with the result.
 *
 * The image is NOT preloaded here — the result card's <img> tag handles
 * loading. This avoids a hang if the Image object's onload never fires.
 */
export function generateImage(
  prompt: string,
  options: GenerationOptions,
  handlers: {
    onProgress?: (p: GenerationProgress) => void;
    signal?: AbortSignal;
  } = {},
): Promise<GenerationResult> {
  const { onProgress, signal } = handlers;

  return new Promise((resolve, reject) => {
    if (!prompt.trim()) {
      reject(new Error("EMPTY_PROMPT"));
      return;
    }

    let stopProgress = runMockProgress((p) => {
      onProgress?.(p);
    });

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      // Fast-forward progress to 100% so the reveal animation is smooth.
      onProgress?.({ progress: 100, message: messageFor(100) });
      // Slight delay so the user reads "Image ready ✨" before the result
      // card replaces the progress card.
      setTimeout(() => {
        stopProgress();
        fn();
      }, 400);
    };

    const controller = new AbortController();

    // Safety timeout — if the server takes more than 180s (3 min), reject
    // gracefully instead of hanging forever.
    // 4 sequential images can take ~120-135s, so 180s gives ample headroom.
    const safetyTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      stopProgress();
      controller.abort();
      reject(new Error("Generation timed out. Please try again."));
    }, 180000);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(safetyTimer);
        controller.abort();
        stopProgress();
        if (!settled) reject(new Error("ABORTED"));
        settled = true;
      });
    }

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, options }),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(safetyTimer);
        let data: ApiSuccessResponse | ApiErrorResponse;
        try {
          data = (await res.json()) as ApiSuccessResponse | ApiErrorResponse;
        } catch {
          finish(() => reject(new Error("Invalid server response")));
          return;
        }

        if (!res.ok || "error" in data) {
          const msg = "error" in data ? data.error : `HTTP ${res.status}`;
          const code = "error" in data ? data.code : undefined;
          const required = "error" in data ? data.required : undefined;
          const available = "error" in data ? data.available : undefined;
          // Don't play the "Image ready" flash for errors.
          settled = true;
          stopProgress();
          clearTimeout(safetyTimer);
          reject(new GenerationError(msg, code, required, available));
          return;
        }

        // Resolve immediately — the result card's <img> will handle loading.
        finish(() =>
          resolve({
            id: `gen_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            imageUrl: data.imageUrl,
            images: data.images && data.images.length > 0 ? data.images : [data.imageUrl],
            prompt: data.prompt,
            options: data.options,
            createdAt: data.createdAt,
            demo: data.demo,
            saved: Boolean(data.saved),
            creditsUsed: data.creditsUsed,
            creditsRemaining: data.creditsRemaining,
          }),
        );
      })
      .catch((err: unknown) => {
        clearTimeout(safetyTimer);
        if (settled) return;
        settled = true;
        stopProgress();
        const msg = err instanceof Error ? err.message : "Network error";
        reject(new Error(msg));
      });
  });
}

/**
 * AI-assisted prompt enhancement.
 *
 * Calls `/api/enhance` (server-side), which uses the ZAI SDK's chat
 * completions to rewrite the user's prompt into a richer, more cinematic
 * generation prompt.
 *
 * If the server call fails, falls back to a local heuristic enhancer so
 * the UI never breaks.
 */
export async function enhancePrompt(raw: string): Promise<string> {
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  try {
    const res = await fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: trimmed }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as { enhanced?: string; error?: string };
    if (data.enhanced && data.enhanced.trim()) {
      return data.enhanced.trim();
    }
    throw new Error(data.error || "No enhanced prompt returned");
  } catch {
    // Fallback to the local heuristic enhancer if the API call fails.
    return localEnhance(trimmed);
  }
}

/** Local fallback enhancer — used if /api/enhance is unavailable. */
function localEnhance(trimmed: string): string {
  // If the prompt is already long and detailed, leave it alone.
  if (trimmed.length > 220) return trimmed;

  const qualityBoosters = [
    "cinematic composition",
    "dramatic lighting",
    "volumetric light",
    "ultra-detailed",
    "high-end photography",
    "atmospheric depth",
    "rich color grading",
  ];

  const lower = trimmed.toLowerCase();
  const additions: string[] = [];

  if (/car|vehicle|truck/.test(lower)) {
    additions.push(
      "driving through a neon-lit megacity at night",
      "realistic materials",
      "dramatic reflections",
      "professional automotive photography",
    );
  } else if (/portrai|woman|man|person|girl|boy/.test(lower)) {
    additions.push(
      "editorial studio lighting",
      "realistic skin texture",
      "shallow depth of field",
      "shot on Hasselblad",
    );
  } else if (/city|building|skyline/.test(lower)) {
    additions.push(
      "atmospheric fog",
      "dramatic sky",
      "volumetric lighting",
      "high-end cinematic photography",
    );
  } else if (/landscap|mountain|forest|desert/.test(lower)) {
    additions.push(
      "golden hour lighting",
      "atmospheric haze",
      "ultra-detailed environment",
      "national geographic photography",
    );
  } else if (/product|bottle|phone|watch/.test(lower)) {
    additions.push(
      "studio lighting",
      "soft reflections",
      "minimal background",
      "commercial product photography",
    );
  } else {
    additions.push(...qualityBoosters);
  }

  const existing = new Set(lower.split(/[\s,]+/));
  const finalAdditions = additions.filter((a) => {
    const words = a.toLowerCase().split(/\s+/);
    return !words.every((w) => existing.has(w));
  });

  return `${trimmed.replace(/[.\s]+$/, "")}, ${finalAdditions.join(", ")}.`;
}
