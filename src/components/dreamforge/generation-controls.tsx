"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AspectRatio,
  ImageCount,
  Quality,
  StyleId,
} from "@/lib/image-generation";

const STYLES: StyleId[] = [
  "Auto",
  "Photorealistic",
  "Cinematic",
  "Digital Art",
  "Anime",
  "3D",
  "Illustration",
  "Minimal",
  "Product Photography",
];

const RATIOS: { id: AspectRatio; label: string; box: string }[] = [
  { id: "1:1", label: "1:1", box: "h-3.5 w-3.5" },
  { id: "4:5", label: "4:5", box: "h-3.5 w-3" },
  { id: "3:4", label: "3:4", box: "h-4 w-3" },
  { id: "16:9", label: "16:9", box: "h-3 w-4" },
  { id: "9:16", label: "9:16", box: "h-4 w-2.5" },
];

const QUALITIES: Quality[] = ["Standard", "High", "Ultra"];
const COUNTS: ImageCount[] = [1, 2, 4];

export interface GenerationControlsProps {
  style: StyleId;
  setStyle: (s: StyleId) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (r: AspectRatio) => void;
  quality: Quality;
  setQuality: (q: Quality) => void;
  count: ImageCount;
  setCount: (c: ImageCount) => void;
  disabled?: boolean;
}

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
      <span className="inline-block h-1 w-1 rounded-full bg-zinc-600" />
      {children}
    </div>
  );
}

function PillButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
        "min-h-[32px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active
          ? "border-violet-400/60 bg-violet-500/20 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.2),0_4px_14px_-4px_rgba(139,92,246,0.4)]"
          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:bg-white/[0.05] hover:text-zinc-200",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {active && (
        <span className="inline-block h-1 w-1 rounded-full bg-violet-300 shadow-[0_0_4px_rgba(196,181,253,0.9)]" />
      )}
      {children}
    </button>
  );
}

function Dropdown({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          "inline-flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
          "min-h-[32px] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
          open
            ? "border-violet-400/60 bg-violet-500/10 text-white"
            : "border-white/10 bg-white/[0.02] text-zinc-200 hover:border-white/25 hover:bg-white/[0.05]",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#1a1c38]/95 p-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors",
                opt === value
                  ? "bg-violet-500/20 text-white"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <span>{opt}</span>
              {opt === value && <Check className="h-3 w-3 text-violet-300" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GenerationControls({
  style,
  setStyle,
  aspectRatio,
  setAspectRatio,
  quality,
  setQuality,
  count,
  setCount,
  disabled,
}: GenerationControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4 sm:gap-3">
      {/* Style */}
      <div className="col-span-2 sm:col-span-1">
        <ControlLabel>Style</ControlLabel>
        <Dropdown
          label="Style"
          value={style}
          options={STYLES}
          onChange={(v) => setStyle(v as StyleId)}
          disabled={disabled}
        />
      </div>

      {/* Aspect ratio — scrollable row on mobile */}
      <div className="col-span-2 sm:col-span-1">
        <ControlLabel>Aspect Ratio</ControlLabel>
        <div className="-mx-0.5 flex flex-nowrap gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-thin sm:flex-wrap sm:overflow-visible sm:pb-0">
          {RATIOS.map((r) => (
            <PillButton
              key={r.id}
              active={aspectRatio === r.id}
              disabled={disabled}
              onClick={() => setAspectRatio(r.id)}
            >
              <span
                className={cn(
                  "inline-block shrink-0 rounded-[3px] border border-current opacity-70",
                  r.box,
                )}
              />
              {r.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div>
        <ControlLabel>Quality</ControlLabel>
        <div className="flex gap-1.5">
          {QUALITIES.map((q) => (
            <PillButton
              key={q}
              active={quality === q}
              disabled={disabled}
              onClick={() => setQuality(q)}
            >
              {q}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Image count */}
      <div>
        <ControlLabel>Image Count</ControlLabel>
        <div className="flex gap-1.5">
          {COUNTS.map((c) => (
            <PillButton
              key={c}
              active={count === c}
              disabled={disabled}
              onClick={() => setCount(c)}
            >
              {c}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  );
}
