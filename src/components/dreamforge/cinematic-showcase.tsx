"use client";

import { motion } from "framer-motion";
import { CINEMATIC_BG } from "@/lib/showcase-data";

export function CinematicShowcase() {
  return (
    <section className="relative my-12 overflow-hidden border-y border-white/5">
      {/* Background image with horizontal drift */}
      <motion.div
        initial={{ scale: 1.08, x: "-2%" }}
        whileInView={{ scale: 1, x: "2%" }}
        viewport={{ once: true }}
        transition={{ duration: 14, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <img
          src={CINEMATIC_BG}
          alt="Cinematic AI artwork — futuristic megacity at dusk"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </motion.div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Content */}
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 md:py-32 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300"
        >
          One prompt
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 font-semibold tracking-[-0.03em] text-white"
          style={{ fontSize: "clamp(1.75rem, 6.5vw, 4rem)", lineHeight: 1.05 }}
        >
          One prompt.{" "}
          <span className="text-gradient-aurora">Infinite possibilities.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-base text-zinc-300 sm:text-lg"
        >
          From impossible worlds to realistic products, your imagination becomes
          the starting point.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <a
            href="#generator"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-100"
          >
            Try it now
            <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
