"use client";

import { motion } from "framer-motion";
import { Images } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32">
      {/* Pulsing glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/2 top-1/2 h-72 w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/25 blur-[140px]"
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[28%] top-[38%] h-64 w-64 rounded-full bg-pink-600/25 blur-[120px]"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute right-[28%] bottom-[30%] h-56 w-56 rounded-full bg-blue-600/20 blur-[110px]"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.875rem, 7vw, 4.5rem)", lineHeight: 1.03 }}
          >
            Your imagination has{" "}
            <span className="text-gradient-aurora animate-gradient-pan">
              no limits.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-300 sm:text-lg">
            Start with a sentence. End with something incredible.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#generator"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-pink-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-all hover:shadow-[0_12px_40px_-8px_rgba(139,92,246,0.8)]"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Start Creating
              <span aria-hidden>✨</span>
            </a>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/5"
            >
              <Images className="h-4 w-4 text-zinc-400" />
              Explore Gallery
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
