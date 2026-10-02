"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowDownToLine,
  Copy,
  Check,
  Share2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerationResult } from "@/lib/image-generation";

interface ImageDetailModalProps {
  /** The result that owns the images */
  result: GenerationResult | null;
  /** Index of the currently-viewed image (0-based) */
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Full-screen image viewer. Shows one image at a time with prev/next
 * navigation, full prompt, metadata, and download/share actions.
 */
export function ImageDetailModal({
  result,
  index,
  onClose,
  onPrev,
  onNext,
}: ImageDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  // Lock body scroll
  React.useEffect(() => {
    if (result) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [result]);

  // Keyboard nav
  React.useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, onClose, onPrev, onNext]);

  const handleCopyPrompt = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = result.images[index];
    const a = document.createElement("a");
    a.href = url;
    a.download = `imagegenarateai-${result.id}-${index + 1}.png`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ImageGenarateAI",
          text: result.prompt,
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else {
      handleCopyPrompt();
    }
  };

  const total = result?.images.length ?? 0;
  const currentUrl = result?.images[index];

  return (
    <AnimatePresence>
      {result && currentUrl && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#05060f]/90 backdrop-blur-lg"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Image detail viewer"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="ring-gradient relative grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1c38]/95 to-[#13152c]/95 backdrop-blur-2xl lg:grid-cols-[1.5fr_1fr]"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close viewer"
              className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0a0b1e]/70 text-zinc-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Image area */}
            <div className="relative flex items-center justify-center bg-[#0a0b1e] p-3 sm:p-6">
              <motion.img
                key={currentUrl}
                src={currentUrl}
                alt={result.prompt}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="max-h-[60vh] max-w-full rounded-lg object-contain sm:max-h-[75vh]"
              />

              {/* Prev/next arrows (only if more than 1 image) */}
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={onPrev}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0a0b1e]/70 text-white backdrop-blur-md transition-all hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0a0b1e]/70 text-white backdrop-blur-md transition-all hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#0a0b1e]/70 px-3 py-1 font-mono text-[11px] text-white backdrop-blur-md">
                    {index + 1} / {total}
                  </div>
                </>
              )}
            </div>

            {/* Details panel */}
            <div className="flex flex-col gap-4 border-t border-white/5 bg-[#181a35]/50 p-5 sm:p-6 lg:border-l lg:border-t-0">
              {/* Title row */}
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-violet-300" />
                <h3 className="text-sm font-semibold text-white">Image details</h3>
              </div>

              {/* Metadata chips */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-medium text-zinc-300">
                  {result.options.style}
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-medium text-zinc-300">
                  {result.options.aspectRatio}
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-medium text-zinc-300">
                  {result.options.quality}
                </span>
                {result.saved && (
                  <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
                    Saved
                  </span>
                )}
                {!result.demo && (
                  <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
                    Live AI
                  </span>
                )}
              </div>

              {/* Prompt */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
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
                <p className="text-sm leading-relaxed text-zinc-300">
                  {result.prompt}
                </p>
              </div>

              {/* Timestamp */}
              <div className="text-[11px] text-zinc-500">
                Generated at{" "}
                {new Date(result.createdAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>

              {/* Actions */}
              <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 px-3 py-2.5 text-xs font-semibold text-white shadow-[0_4px_18px_-4px_rgba(139,92,246,0.6)] transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 sm:col-span-1"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-white/25 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>

              {/* Keyboard hints */}
              {total > 1 && (
                <div className="hidden text-center text-[10px] text-zinc-600 sm:block">
                  Use ← → arrow keys to navigate · Esc to close
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
