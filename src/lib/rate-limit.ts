import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * In a single-server deployment this is sufficient. For multi-server
 * production, replace with Redis-backed rate limiting.
 *
 * Usage in a route handler:
 *
 *   const limited = rateLimit(req, { key: "generate", limit: 5, windowMs: 60_000 });
 *   if (limited) return limited;  // 429 response
 */

interface RateLimitOptions {
  /** Logical key namespace (e.g. "generate", "login"). */
  key: string;
  /** Maximum requests allowed in the window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Optional custom identifier — defaults to IP + userId (from cookie). */
  identifier?: string;
}

interface Bucket {
  timestamps: number[];
}

// Map of "namespace:identifier" → bucket
const buckets = new Map<string, Bucket>();

// Periodically clean up expired buckets to avoid memory leaks.
// Runs every 5 minutes.
setInterval(() => {
  const now = Date.now();
  for (const [k, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter(
      (t) => now - t < 5 * 60 * 1000,
    );
    if (bucket.timestamps.length === 0) {
      buckets.delete(k);
    }
  }
}, 5 * 60 * 1000);

/**
 * Extracts a client identifier from the request.
 * Uses the forwarded IP + session cookie (if present) so anonymous and
 * authenticated users are rate-limited independently.
 */
function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const cookie = req.cookies.get("iga_session")?.value ?? "";
  return `${ip}:${cookie.slice(-12)}`;
}

/**
 * Returns a 429 NextResponse if the rate limit is exceeded, or null
 * if the request is allowed.
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): NextResponse | null {
  const clientId = opts.identifier ?? getClientId(req);
  const bucketKey = `${opts.key}:${clientId}`;
  const now = Date.now();

  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(bucketKey, bucket);
  }

  // Remove timestamps outside the window.
  bucket.timestamps = bucket.timestamps.filter(
    (t) => now - t < opts.windowMs,
  );

  if (bucket.timestamps.length >= opts.limit) {
    const oldest = bucket.timestamps[0];
    const retryAfter = Math.ceil((opts.windowMs - (now - oldest)) / 1000);
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  // Record this request.
  bucket.timestamps.push(now);
  return null;
}
