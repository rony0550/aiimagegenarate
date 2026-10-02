"use client";

import { motion } from "framer-motion";
import {
  PenTool,
  Video,
  Megaphone,
  Brush,
  Code2,
  Building2,
} from "lucide-react";
import { StaggerGroup, slideUpItem } from "./anim";

const USE_CASES = [
  {
    icon: PenTool,
    title: "Designers",
    description:
      "Create concepts, moodboards, and visual directions in minutes. Explore multiple variations before committing to a direction.",
  },
  {
    icon: Video,
    title: "Content Creators",
    description:
      "Generate thumbnails, backgrounds, and creative assets for videos, posts, and streams — without a photo budget.",
  },
  {
    icon: Megaphone,
    title: "Marketers",
    description:
      "Create campaign visuals and product concepts. Iterate on messaging, mood, and color story in real time.",
  },
  {
    icon: Brush,
    title: "Artists",
    description:
      "Explore new styles and creative directions. Use AI as a starting point and refine in your own medium.",
  },
  {
    icon: Code2,
    title: "Developers",
    description:
      "Prototype product visuals, UI concepts, and marketing pages without leaving the editor. Ship faster with real imagery.",
  },
  {
    icon: Building2,
    title: "Businesses",
    description:
      "Create marketing and brand imagery at scale. Maintain visual consistency across every channel and campaign.",
  },
];

export function UseCases() {
  return (
    <section className="relative py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
            Use cases
          </p>
          <h2
            className="mt-3 font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.75rem, 6vw, 3.5rem)", lineHeight: 1.05 }}
          >
            Built for creators of{" "}
            <span className="text-gradient-aurora">every kind.</span>
          </h2>
        </motion.div>

        <StaggerGroup className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((uc) => (
            <motion.div
              key={uc.title}
              variants={slideUpItem}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group rounded-2xl border border-white/10 bg-[#181a35] p-6 transition-colors hover:border-violet-400/30"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors group-hover:border-violet-400/40 group-hover:bg-violet-500/10 group-hover:text-violet-300"
              >
                <uc.icon className="h-4 w-4" />
              </motion.div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {uc.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {uc.description}
              </p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
