"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User as UserIcon,
  Image as ImageIcon,
  Coins,
  LogOut,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Sparkles,
  Calendar,
  Search,
  Trash2,
  Settings,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-context";
import { ImageDetailModal } from "./image-detail-modal";
import type { GenerationResult } from "@/lib/image-generation";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Which tab to show first */
  initialTab?: "profile" | "gallery";
}

interface GenerationItem {
  id: string;
  prompt: string;
  style: string;
  ratio: string;
  quality: string;
  imageUrl: string;
  creditsUsed: number;
  createdAt: string;
}

interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

type Tab = "profile" | "gallery";

export function ProfileModal({ open, onClose, initialTab = "profile" }: ProfileModalProps) {
  const { user, signOut, refresh } = useAuth();
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [generations, setGenerations] = React.useState<GenerationItem[]>([]);
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [loadingGallery, setLoadingGallery] = React.useState(false);
  const [galleryError, setGalleryError] = React.useState<string | null>(null);
  const [detailIndex, setDetailIndex] = React.useState<number | null>(null);

  // Sync tab when modal opens
  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // Lock body scroll
  React.useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Fetch gallery + transactions when the gallery tab is opened
  const loadGallery = React.useCallback(async () => {
    setLoadingGallery(true);
    setGalleryError(null);
    try {
      const [genRes, balRes] = await Promise.all([
        fetch("/api/generations?limit=100"),
        fetch("/api/credits/balance"),
      ]);
      const genData = await genRes.json();
      const balData = await balRes.json();
      if (genRes.ok && genData.generations) {
        setGenerations(genData.generations);
      } else {
        setGalleryError(genData.error || "Failed to load gallery");
      }
      if (balRes.ok && balData.transactions) {
        setTransactions(balData.transactions);
      }
    } catch {
      setGalleryError("Network error");
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && tab === "gallery") {
      loadGallery();
    }
  }, [open, tab, loadGallery]);

  const handleDeleteGeneration = React.useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Delete failed");
        }
        // Remove from local state
        setGenerations((prev) => prev.filter((g) => g.id !== id));
      } catch {
        // silently ignore — could add a toast here
      }
    },
    [],
  );

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  // Build a fake GenerationResult for the detail modal
  const detailResult: GenerationResult | null = React.useMemo(() => {
    if (detailIndex === null || !generations[detailIndex]) return null;
    const g = generations[detailIndex];
    return {
      id: g.id,
      imageUrl: g.imageUrl,
      images: [g.imageUrl],
      prompt: g.prompt,
      options: {
        style: g.style as GenerationResult["options"]["style"],
        aspectRatio: g.ratio as GenerationResult["options"]["aspectRatio"],
        quality: g.quality as GenerationResult["options"]["quality"],
        count: 1,
      },
      createdAt: g.createdAt,
      demo: false,
      saved: true,
    };
  }, [detailIndex, generations]);

  if (!user) return null;

  const initials = (user.name || user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#05060f]/80 backdrop-blur-md"
              onClick={onClose}
              aria-hidden
            />

            {/* Modal panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-title"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="ring-gradient relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-[#1a1c38]/95 to-[#13152c]/95 backdrop-blur-2xl"
            >
              {/* Ambient glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

              {/* Header with avatar + name + close */}
              <div className="relative flex items-center justify-between border-b border-white/5 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-pink-500">
                    <span className="text-sm font-semibold text-white">
                      {initials || "U"}
                    </span>
                  </div>
                  <div>
                    <h2
                      id="profile-title"
                      className="text-lg font-semibold tracking-tight text-white"
                    >
                      {user.name || "Account"}
                    </h2>
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 border-b border-white/5 px-4 pt-3">
                <TabButton
                  active={tab === "profile"}
                  onClick={() => setTab("profile")}
                  icon={<UserIcon className="h-3.5 w-3.5" />}
                  label="Profile"
                />
                <TabButton
                  active={tab === "gallery"}
                  onClick={() => setTab("gallery")}
                  icon={<ImageIcon className="h-3.5 w-3.5" />}
                  label="My Images"
                />
              </div>

              {/* Tab content (scrollable) */}
              <div className="relative flex-1 overflow-y-auto scrollbar-thin">
                {tab === "profile" ? (
                  <ProfileTab
                    user={user}
                    transactions={transactions}
                    onSignOut={handleSignOut}
                  />
                ) : (
                  <GalleryTab
                    generations={generations}
                    loading={loadingGallery}
                    error={galleryError}
                    onRetry={loadGallery}
                    onImageClick={(idx) => setDetailIndex(idx)}
                    onDelete={handleDeleteGeneration}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image detail modal (for gallery images) */}
      <ImageDetailModal
        result={detailResult}
        index={0}
        onClose={() => setDetailIndex(null)}
        onPrev={() => {}}
        onNext={() => {}}
      />
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none",
        active ? "text-white" : "text-zinc-400 hover:text-zinc-200",
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

function ProfileTab({
  user,
  transactions,
  onSignOut,
}: {
  user: { credits: number; email: string; name: string | null };
  transactions: TransactionItem[];
  onSignOut: () => void;
}) {
  const { updateProfile } = useAuth();
  const [editName, setEditName] = React.useState(user.name || "");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password change state
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [savingPw, setSavingPw] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSaveName = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile({ name: editName });
      setProfileMsg({ type: "success", text: "Name updated!" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setProfileMsg({ type: "error", text: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setSavingPw(true);
    setPwMsg(null);
    try {
      await updateProfile({
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwMsg({ type: "success", text: "Password changed!" });
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password change failed";
      setPwMsg({ type: "error", text: msg });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Credit balance card */}
      <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 to-pink-500/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-300">
              Credit Balance
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{user.credits}</span>
              <span className="text-sm text-zinc-400">credits</span>
            </div>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
            <Coins className="h-6 w-6 text-violet-300" />
          </div>
        </div>
        <a
          href="#pricing"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
          onClick={(e) => {
            e.preventDefault();
            document.querySelector("[aria-modal='true']")?.setAttribute("hidden", "");
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            document.body.style.overflow = "";
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Buy more credits
        </a>
      </div>

      {/* Settings — Edit Name */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4 text-zinc-400" />
          Profile Settings
        </h3>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {/* Email (read-only) */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Email (read-only)
            </label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-white/5 bg-white/[0.01] px-3 py-2 text-sm text-zinc-400"
            />
          </div>
          {/* Name (editable) */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition-all focus:border-violet-400/50 focus:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={savingProfile || editName.trim() === (user.name || "")}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {profileMsg && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                profileMsg.type === "success"
                  ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  : "border border-rose-400/20 bg-rose-500/10 text-rose-200",
              )}
            >
              {profileMsg.type === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {profileMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4 text-zinc-400" />
          Change Password
        </h3>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Current Password
            </label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition-all focus:border-violet-400/50 focus:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              New Password
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition-all focus:border-violet-400/50 focus:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
            />
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={savingPw || !currentPw || !newPw || newPw.length < 6}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPw ? "Changing..." : "Change Password"}
          </button>
          {pwMsg && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                pwMsg.type === "success"
                  ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  : "border border-rose-400/20 bg-rose-500/10 text-rose-200",
              )}
            >
              {pwMsg.type === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {pwMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Calendar className="h-4 w-4 text-zinc-400" />
          Transaction History
        </h3>
        {transactions.length === 0 ? (
          <p className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-xs text-zinc-500">
            No transactions yet. Buy credits or generate images to see activity here.
          </p>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full",
                      t.amount > 0
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300",
                    )}
                  >
                    {t.amount > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">
                      {t.description || t.type}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(t.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-mono text-sm font-semibold",
                    t.amount > 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={onSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-500/5 px-4 py-3 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}

function GalleryTab({
  generations,
  loading,
  error,
  onRetry,
  onImageClick,
  onDelete,
}: {
  generations: GenerationItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onImageClick: (idx: number) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [styleFilter, setStyleFilter] = React.useState<string>("all");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Derive available styles from the generations
  const availableStyles = React.useMemo(() => {
    const styles = new Set(generations.map((g) => g.style));
    return Array.from(styles).sort();
  }, [generations]);

  // Filtered generations
  const filtered = React.useMemo(() => {
    let result = generations;
    if (styleFilter !== "all") {
      result = result.filter((g) => g.style === styleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) => g.prompt.toLowerCase().includes(q));
    }
    return result;
  }, [generations, search, styleFilter]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-lg bg-white/[0.04]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <p className="text-sm text-rose-300">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5"
        >
          Try again
        </button>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
          <ImageIcon className="h-6 w-6 text-zinc-500" />
        </div>
        <p className="text-sm font-medium text-zinc-300">No images yet</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Your generated images will appear here. Start creating with the
          generator above!
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Search + filter bar */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 transition-all focus:border-violet-400/50 focus:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
          />
        </div>
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white transition-all focus:border-violet-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        >
          <option value="all">All styles</option>
          {availableStyles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {generations.length} image
        {generations.length > 1 ? "s" : ""} · Click to view · Hover to delete
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-xs text-zinc-500">
          No images match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((gen) => {
            const originalIdx = generations.indexOf(gen);
            const isDeleting = deletingId === gen.id;
            return (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: originalIdx * 0.04 }}
                className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#0a0b1e] transition-all hover:border-violet-400/50"
              >
                <button
                  type="button"
                  onClick={() => onImageClick(originalIdx)}
                  className="absolute inset-0 h-full w-full cursor-pointer"
                  aria-label={`View image: ${gen.prompt.slice(0, 40)}`}
                >
                  <img
                    src={gen.imageUrl}
                    alt={gen.prompt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
                {/* View hint (top-right) */}
                <div className="pointer-events-none absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#0a0b1e]/70 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5 text-white" />
                </div>
                {/* Delete button (top-left, appears on hover) */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setDeletingId(gen.id);
                    await onDelete(gen.id);
                    setDeletingId(null);
                  }}
                  disabled={isDeleting}
                  aria-label="Delete image"
                  className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/20 text-rose-200 opacity-0 backdrop-blur-md transition-all hover:bg-rose-500/40 disabled:opacity-50 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {/* Prompt preview on hover */}
                <div className="pointer-events-none absolute inset-x-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="line-clamp-2 text-[10px] leading-relaxed text-zinc-200">
                    {gen.prompt}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[9px] text-violet-300">
                    <Coins className="h-2.5 w-2.5" />
                    {gen.creditsUsed} credits · {gen.style}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
