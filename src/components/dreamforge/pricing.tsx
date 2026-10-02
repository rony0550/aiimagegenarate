"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { StaggerGroup, slideUpItem } from "./anim";
import { useAuth } from "./auth-context";

interface Plan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  credits: number;
  highlighted?: boolean;
  cta: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For exploring AI image generation.",
    priceMonthly: 0,
    credits: 30,
    cta: "30 Credits at Signup",
    features: [
      "30 credits (6 images)",
      "5 credits per image",
      "Standard resolution",
      "6 core styles",
      "Up to 2 variations",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "For regular creators and designers.",
    priceMonthly: 18,
    credits: 500,
    highlighted: true,
    cta: "Get 500 Credits",
    features: [
      "500 credits (100 images)",
      "5 credits per image",
      "High resolution (up to 2K)",
      "All styles + custom prompts",
      "Smart prompt enhancement",
      "Priority generation queue",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For professionals and businesses.",
    priceMonthly: 49,
    credits: 10000,
    cta: "Get Pro Credits",
    features: [
      "10,000 credits (2,000 images)",
      "5 credits per image",
      "Ultra resolution (up to 4K)",
      "All styles + brand presets",
      "AI upscaling & variations",
      "Commercial license",
    ],
  },
];

export function Pricing() {
  const { user } = useAuth();
  const [notice, setNotice] = React.useState<string | null>(null);

  const handlePurchase = (planId: string) => {
    setNotice(
      planId === "free"
        ? "New accounts receive 30 free credits. Paid top-ups are coming soon."
        : "Payments are coming soon. Your account has not been charged.",
    );
  };

  return (
    <section id="pricing" className="relative py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
            Pricing
          </p>
          <h2
            className="mt-3 font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.75rem, 6vw, 3.5rem)", lineHeight: 1.05 }}
          >
            Create at your{" "}
            <span className="text-gradient-aurora">own pace.</span>
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            5 credits per image. Start free. Top up when you need more.
          </p>

          {/* Credit balance badge (when signed in) */}
          {user && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-medium text-violet-100">
              <Coins className="h-3.5 w-3.5" />
              Your balance:{" "}
              <span className="font-semibold text-white">
                {user.credits} credits
              </span>
            </div>
          )}
        </motion.div>

        {notice && (
          <div aria-live="polite" className="mx-auto mt-6 max-w-xl rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {notice}
          </div>
        )}

        <StaggerGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            return (
              <motion.div
                key={plan.id}
                variants={slideUpItem}
                whileHover={{ y: plan.highlighted ? -8 : -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-6",
                  plan.highlighted
                    ? "border-violet-400/40 bg-linear-to-b from-[#251a3d] to-[#13152c] shadow-[0_8px_40px_-12px_rgba(139,92,246,0.4)]"
                    : "border-white/10 bg-[#181a35]",
                )}
              >
                {plan.highlighted && (
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </div>
                )}

                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">{plan.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-sm text-zinc-500">/ month</span>
                </div>

                {/* Credit count highlight */}
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-violet-300">
                  <Coins className="h-3.5 w-3.5" />
                  {plan.credits.toLocaleString()} credits
                </div>

                <button
                  type="button"
                  onClick={() => handlePurchase(plan.id)}
                  className={cn(
                    "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
                    plan.highlighted
                      ? "bg-linear-to-r from-violet-600 to-pink-500 text-white hover:opacity-90"
                      : "border border-white/10 bg-white/3 text-white hover:border-white/20 hover:bg-white/5",
                  )}
                >
                  {plan.cta}
                </button>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
