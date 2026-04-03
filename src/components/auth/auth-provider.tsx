"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type AuthContextValue = {
  user: PublicUser | null;
  signup: (name: string, email: string, phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toPublicFromSupabase(u: User): PublicUser {
  return {
    id: u.id,
    name: (u.user_metadata?.name as string) || "",
    email: u.email || "",
    phone: (u.user_metadata?.phone as string) || "",
  };
}

const getAuthRedirectUrl = () => {
  const callbackPath = "/auth/callback";

  if (typeof window !== "undefined") {
    const localHost = /(localhost|127\.0\.0\.1)/i;
    if (localHost.test(window.location.hostname)) {
      return `${window.location.origin}${callbackPath}`;
    }
    return `${window.location.origin}${callbackPath}`; // for all non-production local host setups
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://volthub1.vercel.app";
  return `${baseUrl.replace(/\/*$/, "")}${callbackPath}`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    let mounted = true;
    let sub: { subscription: { unsubscribe: () => void } } | null = null;

    try {
      getSupabase().auth.getUser().then((res) => {
        const u = res.data.user;
        if (mounted) setUser(u ? toPublicFromSupabase(u) : null);
      });
      const { data } = getSupabase().auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user || null;
        if (mounted) setUser(u ? toPublicFromSupabase(u) : null);
      });
      sub = data;
    } catch (error) {
      console.error("Supabase client not initialized in AuthProvider:", error);
    }

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      signup: async (name, email, phone, password) => {
        try {
          const redirectTo = getAuthRedirectUrl();
          const { data, error } = await getSupabase().auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: { name, phone },
            },
          });
          if (error) return { ok: false, error: error.message };
          if (data.user) setUser(toPublicFromSupabase(data.user));
          return { ok: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Supabase not initialized";
          return { ok: false, error: message };
        }
      },
      login: async (email, password) => {
        try {
          const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
          if (error) return { ok: false, error: error.message };
          if (data.user) setUser(toPublicFromSupabase(data.user));
          return { ok: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Supabase not initialized";
          return { ok: false, error: message };
        }
      },
      logout: () => {
        try {
          getSupabase().auth.signOut();
          setUser(null);
        } catch (error) {
          console.error("Supabase not initialized", error);
        }
      },
      resetPassword: async (email) => {
        try {
          const redirectTo = getAuthRedirectUrl();
          const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
            redirectTo,
          });
          if (error) return { ok: false, error: error.message };
          return { ok: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Supabase not initialized";
          return { ok: false, error: message };
        }
      },
      refreshSession: async () => {
        try {
          const { data, error } = await getSupabase().auth.getSession();
          if (error || !data.session) {
            setUser(null);
            return;
          }
          setUser(toPublicFromSupabase(data.session.user));
        } catch (error) {
          console.error("Failed to refresh session:", error);
          setUser(null);
        }
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext missing");
  return ctx;
}
