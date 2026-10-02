"use client";

import { motion } from "framer-motion";
import { SHOWCASE_IMAGES } from "@/lib/showcase-data";
import { StaggerGroup, slideUpItem } from "./anim";

const CREATOR_KINDS = [
  {
    title: "Designers",
    description: "Moodboards, concepts, visual directions.",
    image: SHOWCASE_IMAGES[4], // architecture
  },
  {
    title: "Artists",
    description: "New styles, references, creative directions.",
    image: SHOWCASE_IMAGES[2], // fantasy
  },
  {
    title: "Marketers",
    description: "Campaign visuals, product concepts.",
    image: SHOWCASE_IMAGES[3], // product
  },
  {
    title: "Storytellers",
    description: "Cinematic scenes, atmospheric worlds.",
    image: SHOWCASE_IMAGES[0], // cinematic
  },
];

export function Testimonials() {
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
            Community
          </p>
          <h2
            className="mt-3 font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.75rem, 6vw, 3.5rem)", lineHeight: 1.05 }}
          >
            Made for people who{" "}
            <span className="text-gradient-aurora">imagine differently.</span>
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            Creators across every discipline use ImageGenarateAI to bring ideas to life.
          </p>
        </motion.div>

        <StaggerGroup className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CREATOR_KINDS.map((kind) => (
            <motion.div
              key={kind.title}
              variants={slideUpItem}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#181a35] hover:border-violet-400/30"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={kind.image.src}
                  alt={kind.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b1e]/90 via-[#0a0b1e]/30 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    {kind.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-300/80 sm:text-xs">
                    {kind.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
