"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOWCASE_IMAGES, type ShowcaseImage } from "@/lib/showcase-data";

const CATEGORIES = [
  "All",
  "Cinematic",
  "Portrait",
  "Fantasy",
  "Architecture",
  "Product",
  "3D",
  "Anime",
  "Abstract",
];

export function ShowcaseGallery() {
  const [active, setActive] = React.useState<string>("All");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (active === "All") return SHOWCASE_IMAGES;
    return SHOWCASE_IMAGES.filter((img) => img.category === active);
  }, [active]);

  const handleCopyPrompt = async (img: ShowcaseImage) => {
    try {
      await navigator.clipboard.writeText(img.prompt);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId((c) => (c === img.id ? null : c)), 1800);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = img.prompt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopiedId(img.id);
        setTimeout(() => setCopiedId((c) => (c === img.id ? null : c)), 1800);
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <section id="showcase" className="relative py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
            Showcase
          </p>
          <h2
            className="mt-3 font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.75rem, 5vw, 3.5rem)", lineHeight: 1.05 }}
          >
            Imagine. Generate.{" "}
            <span className="text-gradient-aurora">Create.</span>
          </h2>
          <p className="mt-4 text-sm text-zinc-400 sm:text-base">
            Explore what creators are making with AI.
          </p>
        </motion.div>

        {/* Category filter — scrollable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 scrollbar-thin sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                  active === cat
                    ? "border-violet-400/50 bg-violet-500/15 text-white"
                    : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Masonry grid */}
        <div className="mt-8 columns-1 gap-3 sm:mt-10 sm:columns-2 sm:gap-4 lg:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4">
          {filtered.map((img, i) => {
            const isCopied = copiedId === img.id;
            return (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={cn(
                  "group relative break-inside-avoid overflow-hidden rounded-xl border border-white/10 bg-[#181a35] transition-colors hover:border-violet-400/30",
                  img.span === "tall" && "sm:row-span-2",
                )}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.title}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />

                  {/* Overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />

                  {/* Top-left category */}
                  <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3">
                    <span className="rounded-full border border-white/15 bg-[#0a0b1e]/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-md">
                      {img.category}
                    </span>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3 sm:bottom-3">
                    <p className="text-sm font-medium text-white">{img.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-300/80">
                      {img.prompt}
                    </p>

                    {/* Click-to-copy View Prompt button */}
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(img)}
                      aria-label={`Copy prompt: ${img.title}`}
                      className={cn(
                        "mt-2.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                        isCopied
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                          : "border-violet-400/30 bg-violet-500/10 text-violet-200 opacity-0 group-hover:opacity-100 hover:border-violet-400/60 hover:bg-violet-500/20 hover:text-white",
                      )}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {isCopied ? (
                          <motion.span
                            key="copied"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Copied!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="inline-flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            View Prompt
                            <ArrowUpRight className="h-3 w-3" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
