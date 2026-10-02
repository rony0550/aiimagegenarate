"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  ArrowRight,
  Sparkles,
  User,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-context";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "signin" | "signup";

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Lock body scroll while modal is open
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

  // Reset error when mode switches
  React.useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(name.trim(), email.trim(), password);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setEmail("");
        setPassword("");
        setName("");
      }, 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#05060f]/80 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />

          {/* Modal panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="ring-gradient relative w-full max-w-md overflow-hidden rounded-3xl bg-linear-to-b from-[#1a1c38]/95 to-[#13152c]/95 p-6 backdrop-blur-2xl sm:p-8"
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-violet-500/15 blur-3xl" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close login dialog"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              {/* Logo + heading */}
              <div className="mb-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center"
                >
                  <div className="absolute h-11 w-11 rounded-xl bg-linear-to-br from-violet-500 via-indigo-500 to-pink-500 opacity-70 blur-md" />
                  <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 via-indigo-500 to-pink-500">
                    <div className="absolute inset-px rounded-[11px] bg-linear-to-br from-white/20 to-transparent" />
                    <Sparkles className="relative h-5 w-5 text-white" />
                  </div>
                </motion.div>
                <h2
                  id="login-title"
                  className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
                >
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400">
                  {mode === "signin"
                    ? "Sign in to continue creating with ImageGenarateAI"
                    : "Start turning your imagination into images"}
                </p>
              </div>

              {/* Success overlay */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#13152c]/95 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-emerald-300">
                        <motion.path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        />
                      </svg>
                    </motion.div>
                    <p className="mt-4 text-sm font-medium text-white">
                      {mode === "signin" ? "Signed in!" : "Account created!"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Social auth */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-white/25 hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  <Chrome className="h-3.5 w-3.5" />
                  Google
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-white/25 hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  or
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === "signup" && (
                  <Field
                    icon={<User className="h-4 w-4" />}
                    label="Name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                  />
                )}
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  required
                />
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/3 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 transition-all focus:border-violet-400/50 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition-colors hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === "signin" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-400/40"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="text-xs text-violet-300 transition-colors hover:text-violet-200"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-linear-to-r from-violet-600 via-indigo-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)] transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-flex h-4 w-4 items-center justify-center"
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.span>
                      {mode === "signin" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {mode === "signin" ? "Sign In" : "Create Account"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Mode switch */}
              <p className="mt-5 text-center text-xs text-zinc-400">
                {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="font-medium text-violet-300 transition-colors hover:text-violet-200"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}

function Field({ icon, label, type, placeholder, value, onChange, autoComplete, required }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-lg border border-white/10 bg-white/3 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 transition-all focus:border-violet-400/50 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        />
      </div>
    </div>
  );
}
