"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GenerationAnimationProps {
  /** 0..100 */
  progress: number;
  message: string;
  /**
   * Optional final image to reveal progressively (blur → sharp).
   *
   * - Demo mode: pass a local demo image so the user sees a cinematic
   *   blur-to-sharp reveal.
   * - Live mode: pass `undefined` / omit. Only the abstract animation
   *   (noise, colors, shimmer, scan line) plays until the server
   *   responds and the result card replaces this component.
   */
  finalImageUrl?: string;
  aspectRatioClassName?: string;
}

/**
 * Cinematic generation preview.
 *
 * Two modes:
 *
 * 1. WITH `finalImageUrl` (demo mode):
 *    Phases blend abstract noise → progressive blur-to-sharp final image.
 *
 * 2. WITHOUT `finalImageUrl` (live mode):
 *    Only the abstract animation plays — noise, color fragments, floating
 *    shapes, light sweep, scan line. No fake preview image is shown.
 *    The animation stays until `progress` hits 100% (i.e. the server
 *    responded), then the parent swaps in the real result card.
 */
export function GenerationAnimation({
  progress,
  message,
  finalImageUrl,
  aspectRatioClassName = "aspect-[16/9]",
}: GenerationAnimationProps) {
  const hasFinalImage = Boolean(finalImageUrl);
  const isRevealed = progress >= 100;

  // --- Demo-mode-only image opacities (ignored in live mode) ---
  const blur = React.useMemo(() => {
    const b = Math.max(0, 36 * (1 - progress / 100));
    return `${b}px`;
  }, [progress]);

  const scale = React.useMemo(() => {
    const s = 1 + 0.06 * (1 - progress / 100);
    return s.toFixed(4);
  }, [progress]);

  const finalOpacity = React.useMemo(() => {
    if (!hasFinalImage) return 0;
    if (progress < 45) return 0;
    if (progress >= 100) return 1;
    return Math.min(1, (progress - 45) / 55);
  }, [progress, hasFinalImage]);

  // Noise layer opacity: in live mode, stays at 1 the whole time.
  // In demo mode, fades out as the final image reveals.
  const noiseOpacity = React.useMemo(() => {
    if (!hasFinalImage) return 1; // live mode: always visible
    if (progress >= 100) return 0;
    if (progress < 60) return 1;
    return Math.max(0, 1 - (progress - 60) / 40);
  }, [progress, hasFinalImage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-white/10 bg-[#13152c]"
    >
      {/* FIXED-SIZE PREVIEW CANVAS
          The outer box always has the same size — a 16:9 frame that fills
          the generator card width. The chosen aspect ratio is applied to
          an INNER frame that is centered inside this box, so switching
          between 1:1, 16:9, 9:16 etc. never resizes the card itself. */}
      <div className="relative w-full overflow-hidden bg-[#0a0b1e]" style={{ aspectRatio: "16 / 9" }}>
        {/* Aspect-ratio-aware inner frame (centered, letterboxed) */}
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
          <div
            className={cn(
              "relative h-full max-h-full w-full overflow-hidden rounded-md ring-1 ring-white/5",
              aspectRatioClassName,
            )}
          >
            {/* Final image (demo mode only — revealed progressively) */}
            {hasFinalImage && (
              <motion.img
                src={finalImageUrl}
                alt="Generated artwork"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  filter: `blur(${blur})`,
                  transform: `scale(${scale})`,
                  opacity: finalOpacity,
                }}
                animate={isRevealed ? { filter: "blur(0px)", transform: "scale(1)" } : {}}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}

            {/* Abstract noise / color fragment layer
                — In live mode: always visible (the ONLY thing the user sees).
                — In demo mode: fades out as the final image reveals. */}
            <div
              className="absolute inset-0"
              style={{ opacity: noiseOpacity, transition: "opacity 200ms linear" }}
              aria-hidden
            >
              <AbstractNoiseLayer />
            </div>

            {/* Light sweep across the preview — visible the whole time in live mode */}
            {!isRevealed && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-md"
                  style={{
                    animation: "shimmer 2.2s ease-in-out infinite",
                  }}
                />
              </div>
            )}

            {/* Scan line during generation */}
            {!isRevealed && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent"
                  style={{ animation: "scan-line 2.4s ease-in-out infinite" }}
                />
              </div>
            )}

            {/* Vignette */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
          </div>
        </div>

        {/* Top-left phase badge (sits on the outer fixed frame) */}
        {!isRevealed && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0b1e]/70 px-2.5 py-1 backdrop-blur-md">
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300">
              Generating
            </span>
          </div>
        )}

        {/* Top-right percentage (sits on the outer fixed frame) */}
        {!isRevealed && (
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-[#0a0b1e]/70 px-2.5 py-1 font-mono text-[11px] tabular-nums text-white backdrop-blur-md">
            {progress}%
          </div>
        )}
      </div>

      {/* Progress bar + status */}
      <div className="space-y-2 border-t border-white/5 bg-[#181a35] px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300">{message}</span>
          {!isRevealed && (
            <span className="font-mono tabular-nums text-zinc-500">{progress}%</span>
          )}
        </div>
        <div className="relative h-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-pink-400"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: "linear" }}
          >
            <div className="absolute inset-0 opacity-50 blur-sm bg-gradient-to-r from-violet-400 to-pink-400" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/** Layered abstract gradient + noise used as the early-stage preview. */
function AbstractNoiseLayer() {
  return (
    <div className="absolute inset-0">
      {/* Color fragments */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(at 30% 30%, rgba(139,92,246,0.55) 0%, transparent 50%), radial-gradient(at 70% 40%, rgba(236,72,153,0.45) 0%, transparent 55%), radial-gradient(at 50% 70%, rgba(59,130,246,0.45) 0%, transparent 55%), radial-gradient(at 80% 80%, rgba(99,102,241,0.4) 0%, transparent 55%)",
          filter: "blur(28px) saturate(140%)",
        }}
      />

      {/* Floating soft shapes */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-violet-500/30 blur-2xl"
        animate={{ x: [0, 24, -16, 0], y: [0, -18, 12, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full bg-pink-500/25 blur-2xl"
        animate={{ x: [0, -22, 14, 0], y: [0, 16, -10, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-28 w-28 rounded-full bg-blue-500/25 blur-2xl"
        animate={{ x: [0, 18, -22, 0], y: [0, -14, 18, 0], scale: [1, 1.2, 0.85, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />

      {/* Fine noise overlay (SVG turbulence) */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay">
        <filter id="noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-filter)" />
      </svg>

      {/* Subtle moving shimmer veil */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          animation: "shimmer 2.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
