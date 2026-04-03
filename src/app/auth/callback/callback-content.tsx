"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";

type AuthCallbackStatus = "loading" | "success" | "error" | "reset";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<AuthCallbackStatus>("loading");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const query = useMemo(() => searchParams.toString(), [searchParams]);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  useEffect(() => {
    let active = true;
    let timeoutId: NodeJS.Timeout;

    const finalize = async () => {
      try {
        // Exchange code for session (required for all callback types)
        if (!code) {
          throw new Error("No authorization code provided. The link may be invalid.");
        }

        const { data: sessionData, error: sessionError } = await getSupabase().auth.exchangeCodeForSession(code);

        if (sessionError) {
          let errorMsg = "Verification link is invalid or expired.";
          if (sessionError.message?.includes("expired")) {
            errorMsg = "This verification link has expired. Please request a new one.";
          } else if (sessionError.message?.includes("invalid")) {
            errorMsg = "This verification link is invalid. Please check your email for the correct link.";
          }
          throw new Error(errorMsg);
        }

        // After successful code exchange, handle based on type
        if (type === "recovery") {
          // Session is now established, show password reset form
          if (!active) return;
          setStatus("reset");
          return;
        }

        // For email verification, check if user is confirmed
        if (sessionData?.session?.user?.email_confirmed_at) {
          if (!active) return;
          setStatus("success");
          timeoutId = setTimeout(() => router.push("/account"), 2600);
          return;
        }

        throw new Error("Unable to verify your account. The link may be expired or invalid.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        if (!active) return;
        setErrorText(message);
        setStatus("error");
      }
    };

    finalize();

    // Timeout after 10 seconds if still loading
    timeoutId = setTimeout(() => {
      if (active && status === "loading") {
        setErrorText("Verification is taking longer than expected. Please try again or contact support.");
        setStatus("error");
      }
    }, 10000);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [query, router, type, code, status]);

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorText("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await getSupabase().auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStatus("success");
      setTimeout(() => router.push("/account"), 2600);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password.";
      setErrorText(message);
      setStatus("error");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 bg-zinc-950 text-white">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-black/75 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-lg animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4 text-center">
          {status === "loading" && (
            <>
              <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-[color:var(--accent)] animate-spin" />
              <h1 className="text-2xl font-semibold">Verifying your VoltHub account…</h1>
              <p className="text-sm text-zinc-300">
                Please wait while we confirm your email and set up your session.
              </p>
            </>
          )}

          {status === "reset" && (
            <>
              <div className="h-12 w-12 rounded-full bg-amber-400/20 flex items-center justify-center">
                <span className="text-2xl">🔑</span>
              </div>
              <h1 className="text-2xl font-semibold">Reset your password</h1>
              <p className="text-sm text-zinc-300 mb-4">
                Enter your new password below.
              </p>
              <form onSubmit={handlePasswordReset} className="w-full space-y-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full rounded-lg border border-white/10 px-3 py-2 bg-white/5 text-white placeholder-zinc-400 focus:border-[color:var(--accent)] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
                >
                  {resetLoading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-12 w-12 rounded-full bg-emerald-400/20 flex items-center justify-center animate-in zoom-in duration-300">
                <span className="text-2xl">✓</span>
              </div>
              <h1 className="text-2xl font-semibold">Welcome to VoltHub</h1>
              <p className="text-sm text-zinc-300">
                Your account is verified and ready. Taking you to your dashboard.
              </p>
              <button
                onClick={() => router.push("/account")}
                className="mt-3 rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Go to account
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-2xl">✕</span>
              </div>
              <h1 className="text-2xl font-semibold">Verification failed</h1>
              <p className="text-sm text-zinc-300 mb-4">{errorText}</p>
              <div className="grid grid-cols-1 gap-2 w-full">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white hover:bg-white/10"
                >
                  Sign in
                </button>
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="rounded-full bg-amber-500/80 px-5 py-2 text-sm font-medium text-black hover:bg-amber-500"
                >
                  Sign up again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
