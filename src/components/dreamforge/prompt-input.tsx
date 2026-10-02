"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Wand2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_CHARS = 1000;

const STYLE_CHIPS = [
  "Cinematic",
  "Photorealistic",
  "Anime",
  "3D Render",
  "Product Photo",
  "Fantasy",
] as const;

const EXAMPLE_PROMPTS = [
  "A futuristic city floating above the clouds at sunset",
  "Editorial portrait of a woman with freckles, dramatic light",
  "Minimal concrete house in a vast desert at golden hour",
  "Stylized 3D fox adventurer, Pixar-quality render",
];

export interface PromptInputProps {
  value: string;
  onChange: (v: string) => void;
  onEnhance: () => void;
  enhancing: boolean;
  onSubmit: () => void;
  disabled?: boolean;
  showExamplePrompts?: boolean;
}

export function PromptInput({
  value,
  onChange,
  onEnhance,
  enhancing,
  onSubmit,
  disabled,
  showExamplePrompts = true,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const autoResize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, []);

  React.useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const remaining = MAX_CHARS - value.length;
  const overLimit = remaining < 0;

  const applyChip = (chip: (typeof STYLE_CHIPS)[number]) => {
    const suffix =
      chip === "3D Render"
        ? "3d render, octane, stylized"
        : chip === "Product Photo"
          ? "product photography, studio lighting"
          : chip.toLowerCase();
    if (!value.trim()) {
      onChange(suffix);
    } else {
      onChange(`${value.replace(/[,\s]+$/, "")}, ${suffix}`);
    }
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 0 1px rgba(139,92,246,0.55), 0 12px 40px -12px rgba(139,92,246,0.35)"
            : "0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px -16px rgba(0,0,0,0.6)",
        }}
        transition={{ duration: 0.25 }}
        className={cn(
          "relative rounded-2xl bg-[#181a35] transition-colors",
          isFocused && "bg-[#1f2142]",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS + 50))}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          rows={3}
          placeholder="Describe the image you want to create..."
          aria-label="Image prompt"
          className={cn(
            "block w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-white placeholder:text-zinc-500",
            "sm:px-5 sm:py-4",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:opacity-60 scrollbar-thin",
          )}
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1 sm:gap-3 sm:px-4 sm:pb-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              <CornerDownLeft className="h-3 w-3" /> ⌘
            </kbd>
            <span className="hidden sm:inline">to generate</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "font-mono text-xs tabular-nums transition-colors",
                overLimit
                  ? "text-rose-400"
                  : remaining < 100
                    ? "text-amber-400"
                    : "text-zinc-500",
              )}
            >
              {value.length} / {MAX_CHARS}
            </span>

            {value.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  textareaRef.current?.focus();
                }}
                disabled={disabled}
                aria-label="Clear prompt"
                className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onEnhance}
              disabled={disabled || !value.trim() || enhancing}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-medium text-violet-200 transition-all",
                "hover:border-violet-400/60 hover:bg-violet-500/20 hover:text-white",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {enhancing ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </motion.span>
                  Enhancing…
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Enhance Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="-mx-2.5 flex items-center gap-2 overflow-x-auto px-2.5 pb-1 scrollbar-thin sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <span className="shrink-0 text-xs text-zinc-500">Style:</span>
        {STYLE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => applyChip(chip)}
            disabled={disabled}
            className={cn(
              "shrink-0 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-medium text-zinc-300 transition-all",
              "hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showExamplePrompts && !value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="-mx-2.5 flex items-center gap-2 overflow-x-auto px-2.5 pb-1 scrollbar-thin sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              <span className="shrink-0 text-xs text-zinc-600">Try:</span>
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    textareaRef.current?.focus();
                  }}
                  disabled={disabled}
                  className={cn(
                    "shrink-0 rounded-md border border-white/5 bg-white/[0.01] px-2.5 py-1 text-xs text-zinc-500 transition-all",
                    "hover:border-white/15 hover:text-zinc-300",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  {p.length > 48 ? `${p.slice(0, 48)}…` : p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
