"use client";

import * as React from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  credits: number;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** Sign in with email + password. Throws on failure. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up with name + email + password. Throws on failure. */
  signUp: (name: string, email: string, password: string) => Promise<void>;
  /** Sign out — clears the session cookie. */
  signOut: () => Promise<void>;
  /** Re-fetch the current user from /api/auth/me. */
  refresh: () => Promise<void>;
  /** Update local credit balance after a purchase or generation. */
  updateCredits: (delta: number) => void;
  /** Update profile (name, avatar, password) via /api/auth/update. */
  updateProfile: (data: {
    name?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { user: AuthUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Sign in failed");
    }
    setUser(data.user);
  }, []);

  const signUp = React.useCallback(
    async (name: string, email: string, password: string) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Sign up failed (${res.status})`);
      }
      if (!data?.user) {
        throw new Error("Sign up returned an invalid response");
      }
      setUser(data.user);
    },
    [],
  );

  const signOut = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const updateCredits = React.useCallback((delta: number) => {
    setUser((u) => (u ? { ...u, credits: Math.max(0, u.credits + delta) } : u));
  }, []);

  const updateProfile = React.useCallback(
    async (data: {
      name?: string;
      avatar?: string;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Update failed");
      }
      setUser(result.user);
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refresh,
      updateCredits,
      updateProfile,
    }),
    [user, loading, signIn, signUp, signOut, refresh, updateCredits, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
