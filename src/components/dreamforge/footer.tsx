"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const FOOTER_LINKS = [
  {
    section: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Gallery", href: "#showcase" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    section: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    section: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#0c0d20]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <div className="absolute h-11 w-11 rounded-xl bg-linear-to-br from-violet-500 via-indigo-500 to-pink-500 opacity-70 blur-md" />
                <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 via-indigo-500 to-pink-500">
                  <div className="absolute inset-px rounded-[11px] bg-linear-to-br from-white/20 to-transparent" />
                  <Sparkles className="relative h-5 w-5 text-white" />
                </div>
              </motion.div>
              <span className="text-sm font-semibold tracking-tight text-white">
                ImageGenarate<span className="text-zinc-500">AI</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-zinc-500">
              Create anything you can imagine. Next-generation AI image
              generation for creators, designers, and businesses.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.section}>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {col.section}
              </p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-600">
            © 2026 ImageGenarateAI. Crafted with imagination.
          </p>
          <p className="text-xs text-zinc-600">
            All AI-generated artwork shown is for demonstration purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}
