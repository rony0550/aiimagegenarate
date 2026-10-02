"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Shared animation primitives for the ImageGenarateAI landing page.
 *
 * All primitives respect `prefers-reduced-motion` automatically via
 * Framer Motion's default behavior.
 */

/** Stagger container — children reveal one-by-one as they enter view. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

/** Slide-up + fade-in child. */
export const slideUpItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Slide-in from left. */
export const slideLeftItem: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Slide-in from right. */
export const slideRightItem: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Scale-in (good for cards / images). */
export const scaleInItem: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Direction of the reveal. */
  direction?: "up" | "left" | "right" | "scale";
  /** Delay in seconds. */
  delay?: number;
  /** Only animate once when scrolled into view. */
  once?: boolean;
}

/**
 * Wraps children with a scroll-triggered reveal animation.
 * Uses `whileInView` so it fires when the element enters the viewport.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  once = true,
}: RevealProps) {
  const variants =
    direction === "left"
      ? slideLeftItem
      : direction === "right"
        ? slideRightItem
        : direction === "scale"
          ? scaleInItem
          : slideUpItem;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}

/**
 * Wraps a group of <Reveal> children so they stagger their entry.
 * Children must use <motion.div variants={slideUpItem}> directly,
 * or be wrapped in <Reveal> without their own whileInView.
 */
export function StaggerGroup({
  children,
  className,
  once = true,
}: StaggerGroupProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  /** Lift distance in pixels (default 6). */
  lift?: number;
}

/**
 * Wraps children with a hover lift effect (translateY + glow).
 * Use on cards, buttons, and any interactive surface.
 */
export function HoverLift({ children, className, lift = 6 }: HoverLiftProps) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ y: -lift }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Floating animation wrapper — subtle continuous up/down movement. */
export function Floating({
  children,
  className,
  duration = 6,
  distance = 12,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
