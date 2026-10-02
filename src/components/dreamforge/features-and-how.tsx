"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Type,
  Layers,
  Maximize2,
  Copy,
  Sparkles,
  Wand2,
  PenLine,
} from "lucide-react";
import { StaggerGroup, slideUpItem } from "./anim";

const FEATURES = [
  {
    icon: Type,
    title: "Text to Image",
    description:
      "Turn natural language into detailed visuals. Describe any scene, character, or concept and watch it come to life with cinematic quality.",
  },
  {
    icon: Layers,
    title: "Multiple Styles",
    description:
      "Explore cinematic, realistic, artistic, anime, 3D, illustration, and more. Each style is tuned for fidelity and creative direction.",
  },
  {
    icon: Maximize2,
    title: "High Resolution",
    description:
      "Create sharp, detailed images suitable for professional projects, marketing campaigns, presentations, and large-format prints.",
  },
  {
    icon: Copy,
    title: "Image Variations",
    description:
      "Generate alternate versions from your favorite idea. Iterate quickly on composition, lighting, mood, and color without starting over.",
  },
  {
    icon: Sparkles,
    title: "AI Upscaling",
    description:
      "Improve image resolution and detail with one click. Enhance textures, recover sharpness, and prepare assets for any deliverable size.",
  },
  {
    icon: Wand2,
    title: "Smart Prompt Enhancement",
    description:
      "Turn simple ideas into richer generation prompts. Our model adds lighting, composition, and quality cues tuned for the chosen style.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
            Features
          </p>
          <h2
            className="mt-3 font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.75rem, 6vw, 3.5rem)", lineHeight: 1.05 }}
          >
            Everything you need to{" "}
            <span className="text-gradient-aurora">create.</span>
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            A complete creative toolkit — from prompt to polished result.
          </p>
        </motion.div>

        <StaggerGroup className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={slideUpItem}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1f2142] to-[#13152c] p-6 transition-colors hover:border-violet-400/30"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/0 blur-3xl transition-colors duration-500 group-hover:bg-violet-500/15" />

              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-violet-300 transition-colors group-hover:border-violet-400/40 group-hover:bg-violet-500/10"
                >
                  <feature.icon className="h-5 w-5" />
                </motion.div>

                <h3 className="mt-4 text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

const STEPS = [
  {
    num: "01",
    icon: PenLine,
    title: "Describe",
    description:
      "Write what you imagine. A sentence is enough — add detail and style cues to refine the direction.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Generate",
    description:
      "AI transforms your prompt into a detailed image. Watch it come to life, from abstract forms to sharp visuals.",
  },
  {
    num: "03",
    icon: Wand2,
    title: "Create",
    description:
      "Download, refine, share, and continue creating. Generate variations or upscale to higher resolution.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-72 w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
            How it works
          </p>
          <h2
            className="mt-3 font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.75rem, 6vw, 3.5rem)", lineHeight: 1.05 }}
          >
            From words to visuals in{" "}
            <span className="text-gradient-aurora">seconds.</span>
          </h2>
        </motion.div>

        <StaggerGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              variants={slideUpItem}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#181a35] p-6 hover:border-violet-400/30"
            >
              <div className="flex items-center justify-between">
                <motion.span
                  className="font-mono text-3xl font-semibold text-white/10 transition-colors group-hover:text-violet-400/30"
                >
                  {step.num}
                </motion.span>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/10 text-violet-300"
                >
                  <step.icon className="h-4 w-4" />
                </motion.div>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {step.description}
              </p>

              {/* Connector arrow on desktop */}
              {i < STEPS.length - 1 && (
                <motion.div
                  className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-violet-400/30 md:block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.div>
              )}
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
