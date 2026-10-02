"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Images } from "lucide-react";
import { HeroGenerator } from "./hero-generator";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-16 md:pt-44 md:pb-24"
    >
      {/* Background: grid + animated glow orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-60" />

        {/* Primary centered glow */}
        <motion.div
          className="absolute left-1/2 top-0 h-[480px] w-[860px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[140px]"
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating orb 1 — indigo */}
        <motion.div
          className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-indigo-600/25 blur-[120px]"
          animate={{
            x: [0, 30, -10, 0],
            y: [0, -20, 15, 0],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating orb 2 — pink */}
        <motion.div
          className="absolute right-[12%] top-[15%] h-72 w-72 rounded-full bg-pink-600/25 blur-[120px]"
          animate={{
            x: [0, -25, 12, 0],
            y: [0, 18, -12, 0],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Floating orb 3 — blue, lower */}
        <motion.div
          className="absolute bottom-[10%] left-[40%] h-64 w-64 rounded-full bg-blue-600/20 blur-[110px]"
          animate={{
            x: [0, 20, -15, 0],
            y: [0, -15, 10, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md">
            <GradientSparkles />
            AI Image Generation
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">Beta</span>
          </div>
        </motion.div>

        {/* Headline with aurora glow behind it */}
        <div className="relative mt-6 sm:mt-7">
          {/* Aurora glow behind headline */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-10 -z-10 mx-auto h-40 max-w-3xl rounded-full bg-gradient-to-r from-violet-600/30 via-pink-500/20 to-blue-500/30 blur-[80px] sm:h-56"
          />
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto max-w-5xl text-center font-semibold tracking-[-0.04em] text-white"
            style={{
              fontSize: "clamp(2.25rem, 9vw, 6.875rem)",
              lineHeight: 1.03,
            }}
          >
            Turn Your{" "}
            <span className="text-gradient-aurora animate-gradient-pan">
              Imagination
            </span>{" "}
            Into Images.
          </motion.h1>
        </div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-5 max-w-2xl px-2 text-center text-sm leading-relaxed text-zinc-400 sm:mt-6 sm:px-0 sm:text-base md:text-lg"
        >
          Create cinematic, realistic, artistic, and imaginative images from
          simple text prompts using next-generation AI.
        </motion.p>

        {/* Hero CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:mt-8 sm:gap-3"
        >
          <a
            href="#generator"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-8px_rgba(139,92,246,0.7)] transition-all hover:shadow-[0_14px_50px_-8px_rgba(139,92,246,0.9)] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 sm:py-3.5"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Generate Image</span>
            <span aria-hidden className="relative">✨</span>
          </a>
          <a
            href="#showcase"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-200 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 sm:py-3.5"
          >
            <Images className="h-4 w-4 text-zinc-400" />
            Explore Gallery
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-[11px] text-zinc-500 sm:mt-6 sm:text-xs"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Fast generation
          </span>
          <span className="hidden sm:inline">·</span>
          <span>High quality</span>
          <span className="hidden sm:inline">·</span>
          <span>Multiple styles</span>
        </motion.div>

        {/* Generator */}
        <motion.div
          id="generator"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mx-auto mt-10 max-w-3xl scroll-mt-20 sm:mt-14 sm:scroll-mt-24"
        >
          {/* Premium ambient glow around the generator card */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-violet-500/15 via-indigo-500/5 to-pink-500/15 blur-3xl"
          />
          <HeroGenerator />
        </motion.div>
      </div>
    </section>
  );
}

function GradientSparkles() {
  return (
    <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-sm bg-gradient-to-br from-violet-400 to-pink-400"
        animate={{ rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <Sparkles className="relative h-2.5 w-2.5 text-white" />
    </span>
  );
}
