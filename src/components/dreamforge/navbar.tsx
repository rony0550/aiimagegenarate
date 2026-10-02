"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, User, LogOut, Bookmark, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginModal } from "./login-modal";
import { ProfileModal } from "./profile-modal";
import { useAuth } from "./auth-context";

const NAV_LINKS = [
  { label: "Explore", href: "#showcase" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [profileModalTab, setProfileModalTab] = React.useState<"profile" | "gallery">("profile");
  const profileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close profile dropdown on outside click
  React.useEffect(() => {
    if (!profileOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [profileOpen]);

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
  };

  // Derive initials from name/email for the avatar fallback
  const initials = React.useMemo(() => {
    const src = user?.name || user?.email || "";
    return src
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  }, [user]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-3 sm:py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl px-3 py-2 transition-all duration-300",
            scrolled
              ? "border border-white/10 bg-[#13152c]/70 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              : "border border-transparent bg-transparent",
          )}
        >
          {/* Logo */}
          <a
            href="#top"
            className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight text-white">
              ImageGenarate<span className="text-zinc-500">AI</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative rounded-lg px-3.5 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <span className="relative z-10">{link.label}</span>
                {/* Hover background pill */}
                <span className="absolute inset-0 z-0 rounded-lg bg-white/4 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-1 md:flex">
            {loading ? (
              // Skeleton placeholder while session is being verified
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/5" />
            ) : user ? (
              // Authenticated: profile dropdown
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((p) => !p)}
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/4 py-1 pl-1 pr-2.5 transition-all hover:border-white/25 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  {/* Avatar */}
                  <div className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-violet-500 to-pink-500">
                    <span className="text-[11px] font-semibold text-white">
                      {initials || "U"}
                    </span>
                  </div>
                  <span className="hidden max-w-25 truncate text-xs font-medium text-zinc-200 sm:inline">
                    {user.name || user.email.split("@")[0]}
                  </span>
                  {/* Credit pill */}
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                    <Sparkles className="h-2.5 w-2.5" />
                    {user.credits}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-zinc-400 transition-transform",
                      profileOpen && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1a1c38]/95 p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                    >
                      {/* Profile header */}
                      <div className="border-b border-white/5 px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-white">
                          {user.name || "Account"}
                        </p>
                        <p className="truncate text-[11px] text-zinc-400">
                          {user.email}
                        </p>
                        {/* Credit balance row */}
                        <div className="mt-2 flex items-center justify-between rounded-md border border-violet-400/20 bg-violet-500/10 px-2 py-1.5">
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-violet-200">
                            <Sparkles className="h-3 w-3" />
                            Credits
                          </span>
                          <span className="text-xs font-bold text-white">
                            {user.credits}
                          </span>
                        </div>
                      </div>
                      {/* Menu items */}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setProfileModalTab("profile");
                          setProfileModalOpen(true);
                        }}
                        className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        Profile
                      </button>
                      <a
                        href="#pricing"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-violet-200 transition-colors hover:bg-violet-500/10"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Buy more credits
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setProfileModalTab("gallery");
                          setProfileModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-zinc-400" />
                        My Images
                      </button>
                      <div className="my-1 h-px bg-white/5" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Anonymous: Sign In button
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                Sign In
              </button>
            )}
            <a
              href="#generator"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-linear-to-r from-violet-600 via-indigo-500 to-pink-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_4px_20px_-6px_rgba(139,92,246,0.6)] transition-all hover:shadow-[0_8px_28px_-6px_rgba(139,92,246,0.8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* Shimmer sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Start Creating</span>
              <Sparkles className="relative h-3.5 w-3.5 text-white transition-transform group-hover:rotate-12" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-white transition-colors hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#13152c]/95 p-2 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        handleSignOut();
                      }}
                      className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-medium text-rose-300"
                    >
                      Sign Out
                    </button>
                    <a
                      href="#generator"
                      onClick={() => setOpen(false)}
                      className="rounded-lg bg-linear-to-r from-violet-600 to-pink-500 px-3 py-2 text-center text-sm font-semibold text-white"
                    >
                      Start Creating
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setLoginOpen(true);
                      }}
                      className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-medium text-zinc-300"
                    >
                      Sign In
                    </button>
                    <a
                      href="#generator"
                      onClick={() => setOpen(false)}
                      className="rounded-lg bg-linear-to-r from-violet-600 to-pink-500 px-3 py-2 text-center text-sm font-semibold text-white"
                    >
                      Start Creating
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Login modal */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* Profile / My Images modal */}
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </header>
  );
}

function LogoMark() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105"
      aria-hidden="true"
    >
      <div className="absolute h-11 w-11 rounded-xl bg-linear-to-br from-violet-500 via-indigo-500 to-pink-500 opacity-70 blur-md" />
      <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 via-indigo-500 to-pink-500">
        <div className="absolute inset-px rounded-[11px] bg-linear-to-br from-white/20 to-transparent" />
        <Sparkles className="relative h-5 w-5 text-white" />
      </div>
    </motion.div>
  );
}
