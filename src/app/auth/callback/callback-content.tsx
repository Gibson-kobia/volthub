"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";
import { getActiveStaffByEmail, getPostLoginPath } from "../../../lib/access-control";

type AuthCallbackStatus = "loading" | "success" | "error" | "reset";
type EmailOtpType = "email" | "magiclink" | "recovery" | "email_change";

function isValidEmailOtpType(value: unknown): value is EmailOtpType {
  return (
    typeof value === "string" &&
    ["email", "magiclink", "recovery", "email_change"].includes(value)
  );
}

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<AuthCallbackStatus>("loading");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/account");

  const query = useMemo(() => searchParams.toString(), [searchParams]);
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  useEffect(() => {
    if (status !== "loading") {
      return;
    }
    let active = true;
    let timeoutId: NodeJS.Timeout;

    const handleSuccess = async () => {
      if (!active) return;
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      const staff = await getActiveStaffByEmail(getSupabase(), session?.user.email || null);
      const nextPath = getPostLoginPath(staff);
      setRedirectPath(nextPath);
      setStatus("success");
      timeoutId = setTimeout(() => router.push(nextPath), 1800);
    };

    const handleRecovery = () => {
      if (!active) return;
      setStatus("reset");
    };

    const exchangeCode = async () => {
      const { data, error } = await getSupabase().auth.exchangeCodeForSession(code!);
      if (error) throw error;
      return data;
    };

    const verifyToken = async () => {
      if (!isValidEmailOtpType(type)) {
        throw new Error(`Invalid OTP type for token verification: "${type}". Expected one of: email, magiclink, recovery, email_change.`);
      }
      const { data, error } = await getSupabase().auth.verifyOtp({
        token_hash: token!,
        type,
      });
      if (error) throw error;
      return data;
    };

    const finalize = async () => {
      let lastError: Error | null = null;
      let result: unknown = null;

      if (code) {
        try {
          result = await exchangeCode();
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Email verification failed via code.");
        }
      }

      if ((!code || lastError) && token && type) {
        try {
          result = await verifyToken();
          lastError = null;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Email verification failed via token.");
        }
      }

      if (!result) {
        if (lastError) throw lastError;
        throw new Error("No authorization code or token/type provided. The link may be invalid.");
      }

      if (type === "recovery") {
        handleRecovery();
        return;
      }

      // existing profile verification + magic links
      await handleSuccess();
    };

    finalize().catch((error) => {
      if (!active) return;
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorText(message);
      setStatus("error");
    });

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
  }, [query, router, type, code, token, status]);

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
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      const staff = await getActiveStaffByEmail(getSupabase(), session?.user.email || null);
      const nextPath = getPostLoginPath(staff);
      setRedirectPath(nextPath);
      setTimeout(() => router.push(nextPath), 2600);
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
                Your account is verified and ready. Taking you to your interface.
              </p>
              <button
                onClick={() => router.push(redirectPath)}
                className="mt-3 rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Continue
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
