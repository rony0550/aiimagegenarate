"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Sparkles, Coins, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  enhancePrompt,
  generateImage,
  GenerationError,
  type AspectRatio,
  type GenerationOptions,
  type GenerationResult,
  type GenerationStatus,
  type ImageCount,
  type Quality,
  type StyleId,
} from "@/lib/image-generation";
import { PromptInput } from "./prompt-input";
import { GenerationControls } from "./generation-controls";
import { GenerationAnimation } from "./generation-animation";
import { GeneratedResult } from "./generated-result";
import { useAuth } from "./auth-context";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Credits required per generated image. */
const CREDITS_PER_IMAGE = 5;

export function HeroGenerator() {
  const { user, refresh, updateCredits } = useAuth();
  const [prompt, setPrompt] = React.useState("");
  const [style, setStyle] = React.useState<StyleId>("Cinematic");
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("16:9");
  const [quality, setQuality] = React.useState<Quality>("Ultra");
  const [count, setCount] = React.useState<ImageCount>(1);

  const [status, setStatus] = React.useState<GenerationStatus>("idle");
  const [progress, setProgress] = React.useState(0);
  const [statusMessage, setStatusMessage] = React.useState("Understanding your prompt...");
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [error, setError] = React.useState<{
    message: string;
    code?: string;
    required?: number;
    available?: number;
  } | null>(null);
  const [enhancing, setEnhancing] = React.useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = React.useState(false);

  const options: GenerationOptions = { style, aspectRatio, quality, count };
  const totalCost = count * CREDITS_PER_IMAGE;
  const canAfford = (user?.credits ?? 0) >= totalCost;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError({ message: "Describe what you'd like to create first." });
      return;
    }
    if (prompt.length > 1000) {
      setError({ message: "Prompt is too long. Keep it under 1000 characters." });
      return;
    }

    // Auth gate
    if (!user) {
      setError({
        message: "Please sign in to generate images.",
        code: "AUTH_REQUIRED",
      });
      setStatus("error");
      setCreditDialogOpen(true);
      return;
    }
    // Credit gate
    if (!canAfford) {
      setError({
        message: `Insufficient credits. You need ${totalCost} credits (${CREDITS_PER_IMAGE} × ${count} image${count > 1 ? "s" : ""}) but have ${user.credits}.`,
        code: "INSUFFICIENT_CREDITS",
        required: totalCost,
        available: user.credits,
      });
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("generating");
    setProgress(0);
    setStatusMessage("Understanding your prompt...");
    setResult(null);

    try {
      const res = await generateImage(prompt, options, {
        onProgress: (p) => {
          setProgress(p.progress);
          setStatusMessage(p.message);
        },
      });
      setResult(res);
      setStatus("completed");
      // Update local credit balance immediately for responsive UX.
      if (res.creditsRemaining !== undefined) {
        updateCredits(res.creditsRemaining - (user?.credits ?? 0));
      }
      // Refresh from server to stay in sync.
      refresh();
    } catch (err) {
      if (err instanceof GenerationError) {
        if (err.code === "ABORTED") return;
        setError({
          message: err.message,
          code: err.code,
          required: err.required,
          available: err.available,
        });
        if (err.code === "INSUFFICIENT_CREDITS") {
          setCreditDialogOpen(true);
        }
      } else {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError({ message: msg === "ABORTED" ? "" : `Something went wrong: ${msg}` });
      }
      setStatus(err instanceof GenerationError && err.code === "ABORTED" ? "idle" : "error");
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch {
      // The enhance function already falls back to a local heuristic,
      // so this only fires if something truly unexpected happens.
    } finally {
      setEnhancing(false);
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  };

  const isGenerating = status === "generating";
  const aspectClass = React.useMemo(() => {
    switch (aspectRatio) {
      case "1:1":
        return "aspect-square";
      case "4:5":
        return "aspect-[4/5]";
      case "3:4":
        return "aspect-[3/4]";
      case "16:9":
        return "aspect-[16/9]";
      case "9:16":
        return "aspect-[9/16]";
      default:
        return "aspect-[16/9]";
    }
  }, [aspectRatio]);

  return (
    <div className="ring-gradient relative rounded-3xl bg-linear-to-b from-[#1f2142]/90 to-[#13152c]/90 p-3 backdrop-blur-sm sm:p-4 md:p-6">
      {/* Inner ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      <div className="relative space-y-4 sm:space-y-5">
        {/* Section label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              AI Generator
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-600">
            ImageGenarateAI v1.0
          </span>
        </div>

        {/* Prompt input */}
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onEnhance={handleEnhance}
          enhancing={enhancing}
          onSubmit={handleGenerate}
          disabled={isGenerating}
          showExamplePrompts={status === "idle"}
        />

        {/* Controls */}
        <GenerationControls
          style={style}
          setStyle={setStyle}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          quality={quality}
          setQuality={setQuality}
          count={count}
          setCount={setCount}
          disabled={isGenerating}
        />

        {/* Inline validation / error */}
        <AnimatePresence>
          {error && error.message && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs",
                error.code === "INSUFFICIENT_CREDITS"
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                  : error.code === "AUTH_REQUIRED"
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                    : "border-amber-400/20 bg-amber-500/10 text-amber-200",
              )}
            >
              {error.code === "AUTH_REQUIRED" ? (
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : error.code === "INSUFFICIENT_CREDITS" ? (
                <Coins className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <div className="flex-1">
                <span>{error.message}</span>
                {/* Action button for insufficient credits */}
                {error.code === "INSUFFICIENT_CREDITS" && (
                  <a
                    href="#pricing"
                    className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-rose-500/25"
                  >
                    <Coins className="h-3 w-3" />
                    Buy more credits
                  </a>
                )}
                {/* Action button for auth required */}
                {error.code === "AUTH_REQUIRED" && (
                  <p className="mt-1 text-[11px] text-amber-300/80">
                    Use the Sign In button in the navbar to log in or create an account.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credit cost indicator + Generate button row */}
        <div className="flex items-center gap-3">
          {/* Credit balance / cost pill */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-medium",
              user
                ? canAfford
                  ? "border-violet-400/30 bg-violet-500/10 text-violet-100"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                : "border-white/10 bg-white/3 text-zinc-400",
            )}
            title={
              user
                ? canAfford
                  ? `You have ${user.credits} credits. This generation costs ${totalCost}.`
                  : `You need ${totalCost} credits but only have ${user.credits}.`
                : "Sign in to see your credit balance"
            }
          >
            <Coins className="h-3.5 w-3.5" />
            {user ? (
              <>
                <span className="font-semibold">{user.credits}</span>
                <span className="text-zinc-500">·</span>
                <span>−{totalCost}</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </div>

          {/* Generate button (fills remaining width) */}
          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            whileHover={{ scale: isGenerating ? 1 : 1.01 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            className={cn(
              "group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold transition-all sm:px-6 sm:py-4",
              "bg-linear-to-r from-violet-600 via-indigo-500 to-pink-500 text-white",
              "shadow-[0_10px_40px_-8px_rgba(139,92,246,0.7)] hover:shadow-[0_14px_50px_-8px_rgba(139,92,246,0.9)] hover:brightness-110",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-90 disabled:hover:brightness-100",
            )}
          >
          {/* Shimmer */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

          {isGenerating ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="inline-flex h-4 w-4 items-center justify-center"
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
              Creating...
            </>
          ) : (
            <>
              Generate
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              <span className="ml-1">✨</span>
            </>
          )}
          </motion.button>
        </div>

        {/* Preview / result area */}
        <AnimatePresence mode="wait">
          {status === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GenerationAnimation
                progress={progress}
                message={statusMessage}
                aspectRatioClassName={aspectClass}
              />
            </motion.div>
          )}

          {status === "completed" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GeneratedResult
                result={result}
                onRegenerate={handleGenerate}
                onVariation={handleGenerate}
              />
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  ← Start a new generation
                </button>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-5 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10">
                  <AlertCircle className="h-5 w-5 text-rose-300" />
                </div>
                <p className="text-sm font-medium text-white">Something went wrong.</p>
                <p className="mt-1 text-xs text-zinc-400">
                  We couldn&apos;t generate that image. Try again or adjust your prompt.
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500/25"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-white/10 bg-white/2 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/5"
                  >
                    Edit Prompt
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {status === "idle" && !error && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-white/10 bg-white/1 p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/2">
                <Sparkles className="h-5 w-5 text-violet-300/70" />
              </div>
              <p className="text-sm font-medium text-zinc-300">Imagine anything.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Describe your idea and watch AI turn it into a visual.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="border-white/10 bg-[#13152c] text-white">
          <DialogHeader>
            <DialogTitle>Not enough credits</DialogTitle>
            <DialogDescription className="text-zinc-300">
              This generation needs {error?.required ?? totalCost} credits, but
              your balance is {error?.available ?? user?.credits ?? 0}. Buy
              credits to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
              >
                Not now
              </button>
            </DialogClose>
            <DialogClose asChild>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              >
                <Coins className="h-4 w-4" />
                Buy credits
              </a>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
