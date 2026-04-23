"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  authReady: boolean;
  signup: (
    name: string,
    email: string,
    phone: string,
    password: string,
    accountType?: 'retail' | 'wholesale_general' | 'wholesale_school',
    institutionName?: string,
    repRole?: string
  ) => Promise<{ ok: boolean; error?: string; code?: "confirmation_sent" | "confirmation_resent" | "already_confirmed" | "wholesale_pending" }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; code?: "unconfirmed" }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resendConfirmation: (email: string) => Promise<{ ok: boolean; error?: string; code?: "resent" | "already_confirmed" }>;
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

function isEmailConfirmed(user: User | null | undefined) {
  return Boolean(user?.email_confirmed_at);
}

function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  try {
    const storage = window.localStorage;
    const keysToRemove: string[] = [];

    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key) continue;
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.push("supabase.auth.token");

    keysToRemove.forEach((key) => {
      storage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear persisted Supabase auth storage:", error);
  }
}

const getAuthRedirectUrl = (path = "/auth/callback") => {

  if (typeof window !== "undefined") {
    const localHost = /(localhost|127\.0\.0\.1)/i;
    if (localHost.test(window.location.hostname)) {
      return `${window.location.origin}${path}`;
    }
    return `${window.location.origin}${path}`; // for all non-production local host setups
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://canvus.vercel.app";
  return `${baseUrl.replace(/\/*$/, "")}${path}`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await getSupabase().auth.getSession();
      if (error || !data.session?.user) {
        setUser(null);
        return;
      }
      setUser(isEmailConfirmed(data.session.user) ? toPublicFromSupabase(data.session.user) : null);
    } catch (error) {
      console.error("Failed to refresh session:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let sub: { subscription: { unsubscribe: () => void } } | null = null;

    try {
      refreshSession().finally(() => {
        if (mounted) setAuthReady(true);
      });

      const { data } = getSupabase().auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user || null;
        if (mounted) {
          setUser(u && isEmailConfirmed(u) ? toPublicFromSupabase(u) : null);
          setAuthReady(true);
        }
      });
      sub = data;
    } catch (error) {
      console.error("Supabase client not initialized in AuthProvider:", error);
      if (mounted) setAuthReady(true);
    }

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      authReady,
      signup: async (name, email, phone, password, accountType = 'retail', institutionName, repRole) => {
        try {
          const normalizedEmail = email.trim().toLowerCase();
          const redirectTo = getAuthRedirectUrl("/auth/confirm");
          const { data, error } = await getSupabase().auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: { name, phone },
            },
          });
          if (error) {
            if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered")) {
              const resend = await getSupabase().auth.resend({
                type: "signup",
                email: normalizedEmail,
                options: { emailRedirectTo: redirectTo },
              });
              if (!resend.error) {
                return { ok: true, code: "confirmation_resent" };
              }
              if (resend.error.message.toLowerCase().includes("confirmed")) {
                return {
                  ok: false,
                  code: "already_confirmed",
                  error: "This email is already registered. Please log in or reset your password.",
                };
              }
            }
            return { ok: false, error: error.message };
          }

          const existingUserReplay = Array.isArray(data.user?.identities) && data.user.identities.length === 0;
          if (existingUserReplay) {
            // Existing-user replay is intentionally treated as already-registered.
            // Do not auto-resend here because it can mislabel confirmed accounts as pending.
            return {
              ok: false,
              code: "already_confirmed",
              error: "This email is already registered. Please log in or reset your password.",
            };
          }

          // Insert profile data
          if (data.user) {
            const profileData = {
              id: data.user.id,
              email: normalizedEmail,
              full_name: name.trim(),
              phone_number: phone.trim() || null,
              account_type: accountType,
              institution_name: institutionName || null,
              rep_role: repRole || null,
              application_status: accountType.startsWith('wholesale') ? 'pending' : 'none',
              is_verified_wholesale: false,
            };

            const { error: profileError } = await getSupabase()
              .from('profiles')
              .insert(profileData);

            if (profileError) {
              console.error('Profile creation error:', profileError);
              // Don't fail signup if profile insert fails, but log it
            }
          }

          if (data.user && data.session && isEmailConfirmed(data.user)) {
            setUser(toPublicFromSupabase(data.user));
          }

          if (accountType && accountType.startsWith('wholesale')) {
            return { ok: true, code: "wholesale_pending" };
          }

          return { ok: true, code: "confirmation_sent" };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Supabase not initialized";
          return { ok: false, error: message };
        }
      },
      login: async (email, password) => {
        try {
          const normalizedEmail = email.trim().toLowerCase();
          const { data, error } = await getSupabase().auth.signInWithPassword({ email: normalizedEmail, password });
          if (error) {
            if (error.message.toLowerCase().includes("not confirmed")) {
              return { ok: false, code: "unconfirmed", error: "Please confirm your email before logging in." };
            }
            return { ok: false, error: error.message };
          }

          if (!isEmailConfirmed(data.user)) {
            await getSupabase().auth.signOut();
            setUser(null);
            return { ok: false, code: "unconfirmed", error: "Please confirm your email before logging in." };
          }

          if (data.user) setUser(toPublicFromSupabase(data.user));

          // Ensure provider state reflects the persisted browser session before redirecting.
          await refreshSession();

          return { ok: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Supabase not initialized";
          return { ok: false, error: message };
        }
      },
      logout: async () => {
        const supabase = getSupabase();
        try {
          const { error } = await supabase.auth.signOut({ scope: "local" });
          if (error) {
            console.error("Supabase signOut returned an error:", error);
          }
        } catch (error) {
          console.error("Supabase signOut threw an exception:", error);
        } finally {
          clearSupabaseAuthStorage();
          setUser(null);
        }
      },
      resetPassword: async (email) => {
        try {
          const redirectTo = getAuthRedirectUrl("/auth/callback");
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
      resendConfirmation: async (email) => {
        try {
          const redirectTo = getAuthRedirectUrl("/auth/confirm");
          const { error } = await getSupabase().auth.resend({
            type: "signup",
            email: email.trim().toLowerCase(),
            options: { emailRedirectTo: redirectTo },
          });

          if (error) {
            if (error.message.toLowerCase().includes("confirmed")) {
              return {
                ok: false,
                code: "already_confirmed",
                error: "This email is already confirmed. Log in or reset your password.",
              };
            }
            return { ok: false, error: error.message };
          }

          return { ok: true, code: "resent" };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Supabase not initialized";
          return { ok: false, error: message };
        }
      },
      refreshSession,
    };
  }, [user, authReady, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext missing");
  return ctx;
}
