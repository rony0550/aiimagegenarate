"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Copy,
  RefreshCw,
  Share2,
  Sparkles,
  Check,
  Layers,
  Maximize2,
  Bookmark,
  Grid2x2,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerationResult } from "@/lib/image-generation";
import { ImageDetailModal } from "./image-detail-modal";

interface GeneratedResultProps {
  result: GenerationResult;
  onRegenerate: () => void;
  onVariation: () => void;
}

function getDisplayImageUrl(imageUrl: string): string {
  try {
    const parsed = new URL(imageUrl);
    const match = parsed.pathname.match(
      /^\/storage\/v1\/object\/public\/[^/]+\/(.+)$/,
    );
    if (!match) return imageUrl;

    const objectPath = decodeURIComponent(match[1]);
    return `/api/images?path=${encodeURIComponent(objectPath)}`;
  } catch {
    return imageUrl;
  }
}

export function GeneratedResult({
  result,
  onRegenerate,
  onVariation,
}: GeneratedResultProps) {
  const displayResult = {
    ...result,
    imageUrl: getDisplayImageUrl(result.imageUrl),
    images: result.images.map(getDisplayImageUrl),
  };
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(result.saved);
  const [upscaling, setUpscaling] = React.useState(false);
  const [detailIndex, setDetailIndex] = React.useState<number | null>(null);

  const ratioClass = React.useMemo(() => {
    switch (result.options.aspectRatio) {
      case "1:1":
        return "aspect-square";
      case "4:5":
        return "aspect-[4/5]";
      case "3:4":
        return "aspect-[3/4]";
      case "16:9":
        return "aspect-[16/9]";
      case "9:16":
        return "aspect-[9/16]";
      default:
        return "aspect-[16/9]";
    }
  }, [result.options.aspectRatio]);

  const imageCount = result.images.length;
  const isMulti = imageCount > 1;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard not available */
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "ImageGenarateAI",
          text: result.prompt,
          url: window.location.href,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopyPrompt();
    }
  };

  const handleDownload = (idx = 0) => {
    const url = displayResult.images[idx] ?? displayResult.imageUrl;
    const a = document.createElement("a");
    a.href = url;
    a.download = `imagegenarateai-${result.id}-${idx + 1}.png`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = () => setSaved((s) => !s);

  const [upscaleError, setUpscaleError] = React.useState<string | null>(null);

  const handleUpscale = async () => {
    if (upscaling) return;
    setUpscaling(true);
    setUpscaleError(null);
    try {
      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: displayResult.imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upscale failed");
      }
      // Open the upscaled image in a new tab so the user can download it.
      window.open(data.imageUrl, "_blank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setUpscaleError(msg);
    } finally {
      setUpscaling(false);
    }
  };

  // Grid layout for multi-image
  const gridClass = cn(
    isMulti && imageCount === 2 && "grid grid-cols-2 gap-2",
    isMulti && imageCount === 4 && "grid grid-cols-2 gap-2",
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="ring-gradient overflow-hidden rounded-xl bg-[#13152c]"
      >
        {/* FIXED-SIZE PREVIEW CANVAS */}
        <div className="relative w-full overflow-hidden bg-[#0a0b1e]" style={{ aspectRatio: "16 / 9" }}>
          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
            {isMulti ? (
              /* Multi-image grid */
              <div className={cn("h-full max-h-full w-full", gridClass)}>
                {result.images.map((imgSrc, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    onClick={() => setDetailIndex(idx)}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    className={cn(
                      "group/img relative h-full w-full overflow-hidden rounded-md ring-1 ring-white/10 transition-all hover:ring-violet-400/50",
                      ratioClass,
                    )}
                    aria-label={`View image ${idx + 1} in detail`}
                  >
                    <motion.img
                      src={getDisplayImageUrl(imgSrc)}
                      alt={`${result.prompt} (variation ${idx + 1})`}
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={{ filter: "blur(20px)", transform: "scale(1.04)" }}
                      animate={{ filter: "blur(0px)", transform: "scale(1)" }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.08 }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

                    {/* Hover overlay with "View" hint */}
                    <div className="absolute inset-0 flex items-end justify-start bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover/img:opacity-100">
                      <div className="flex items-center gap-1.5 p-2 text-[10px] font-medium text-white">
                        <Maximize2 className="h-3 w-3" />
                        View
                      </div>
                    </div>

                    {/* Image number badge */}
                    <div className="absolute right-1.5 top-1.5 rounded-full border border-white/15 bg-[#0a0b1e]/70 px-1.5 py-0.5 font-mono text-[9px] text-white backdrop-blur-md">
                      {idx + 1}
                    </div>

                    {upscaling && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0b1e]/70 backdrop-blur-sm">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/15"
                        >
                          <Maximize2 className="h-3 w-3 text-violet-200" />
                        </motion.div>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              /* Single image (original behavior) */
              <button
                type="button"
                onClick={() => setDetailIndex(0)}
                className={cn(
                  "group/img relative h-full max-h-full w-full overflow-hidden rounded-md ring-1 ring-white/10 transition-all hover:ring-violet-400/50",
                  ratioClass,
                )}
                aria-label="View image in detail"
              >
                <motion.img
                  src={displayResult.imageUrl}
                  alt={result.prompt}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ filter: "blur(24px)", transform: "scale(1.04)" }}
                  animate={{ filter: "blur(0px)", transform: "scale(1)" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end justify-start bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover/img:opacity-100">
                  <div className="flex items-center gap-1.5 p-2.5 text-xs font-medium text-white">
                    <Maximize2 className="h-3.5 w-3.5" />
                    View full size
                  </div>
                </div>

                {upscaling && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0b1e]/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/15"
                      >
                        <Maximize2 className="h-3.5 w-3.5 text-violet-200" />
                      </motion.div>
                      <span className="text-[11px] font-medium text-zinc-200">
                        Upscaling...
                      </span>
                    </div>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Top-left Ready badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/25 px-2.5 py-1 backdrop-blur-md"
          >
            <span className="text-xs">✨</span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-violet-100">
              Ready
            </span>
          </motion.div>

          {/* Multi-image count badge */}
          {isMulti && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0a0b1e]/70 px-2.5 py-1 backdrop-blur-md">
              {imageCount === 4 ? (
                <Grid2x2 className="h-3 w-3 text-zinc-300" />
              ) : (
                <Layers className="h-3 w-3 text-zinc-300" />
              )}
              <span className="font-mono text-[10px] font-medium text-white">
                {imageCount} images
              </span>
            </div>
          )}

          {/* Saved indicator */}
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "absolute flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 backdrop-blur-md",
                isMulti ? "right-3 bottom-3" : "right-3 top-3",
              )}
            >
              <Check className="h-3 w-3 text-emerald-300" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-100">
                Saved
              </span>
            </motion.div>
          )}
        </div>

        {/* Metadata + prompt */}
        <div className="space-y-3 border-t border-white/5 bg-[#181a35] p-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md border border-white/10 bg-white/4 px-2 py-0.5 font-medium text-zinc-300">
              {result.options.style}
            </span>
            <span className="rounded-md border border-white/10 bg-white/4 px-2 py-0.5 font-medium text-zinc-300">
              {result.options.aspectRatio}
            </span>
            <span className="rounded-md border border-white/10 bg-white/4 px-2 py-0.5 font-medium text-zinc-300">
              {result.options.quality}
            </span>
            {result.demo ? (
              <span className="rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-300">
                Demo
              </span>
            ) : (
              <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
                Live AI
              </span>
            )}
            <span className="ml-auto font-mono text-zinc-600">
              {new Date(result.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/2 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Prompt
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300">
              {result.prompt}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => handleDownload(0)}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-violet-600 to-pink-500 px-3 py-2.5 text-xs font-semibold text-white shadow-[0_4px_18px_-4px_rgba(139,92,246,0.6)] transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 sm:col-span-1 sm:flex-1"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-white/25 hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 sm:flex-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleUpscale}
              disabled={upscaling}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:opacity-50 sm:flex-1"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {upscaling ? "Upscaling…" : "Upscale (2)"}
            </button>
            <button
              type="button"
              onClick={onVariation}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-white/25 hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 sm:flex-1"
            >
              <Layers className="h-3.5 w-3.5" />
              Variation
            </button>
            <button
              type="button"
              onClick={handleSave}
              aria-pressed={saved}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 sm:flex-1",
                saved
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-white/3 text-zinc-200 hover:border-white/25 hover:bg-white/6",
              )}
            >
              <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-emerald-300")} />
              <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-white/25 hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 sm:flex-1"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="sm:sr-only">Share</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Image detail modal — only renders when detailIndex is not null */}
      <ImageDetailModal
        result={detailIndex !== null ? displayResult : null}
        index={detailIndex ?? 0}
        onClose={() => setDetailIndex(null)}
        onPrev={() =>
          setDetailIndex((i) => (i === null ? null : (i - 1 + imageCount) % imageCount))
        }
        onNext={() =>
          setDetailIndex((i) => (i === null ? null : (i + 1) % imageCount))
        }
      />
    </>
  );
}

/** Compact CTA shown above the result when the user wants to start a new generation. */
export function ResultHeader() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <span>Your image is ready</span>
      </div>
    </div>
  );
}
