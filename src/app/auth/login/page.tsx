"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../components/auth/auth-provider";
import { getSupabase } from "../../../lib/supabase";
import { getActiveStaffByEmail, getPostLoginPath } from "../../../lib/access-control";

export default function LoginPage() {
  const { login, refreshSession, resendConfirmation } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      if (res.code === "unconfirmed" || res.error?.toLowerCase().includes("confirm")) {
        setError("Please check your email and click the verification link before logging in.");
      } else {
        setError(res.error || "Invalid credentials");
      }
      return;
    }
    await refreshSession();
    const staff = await getActiveStaffByEmail(getSupabase(), email.trim().toLowerCase());
    window.location.href = getPostLoginPath(staff);
  };

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    setResendStatus(null);
    if (!resendEmail.trim()) {
      setResendStatus("Enter your email address.");
      return;
    }
    setResendLoading(true);
    const res = await resendConfirmation(resendEmail.trim());
    setResendLoading(false);
    if (res.ok) {
      setResendStatus("Verification email sent. Check your inbox.");
    } else if (res.code === "already_confirmed") {
      setResendStatus("This email is already confirmed. Please log in or reset your password.");
    } else {
      setResendStatus(res.error || "Failed to send email.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="font-serif text-3xl mb-2">Log in</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Welcome back to Zora.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full px-4 py-2 bg-[color:var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
        <Link href="/auth/reset" className="underline">
          Forgot password?
        </Link>
      </div>
      <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        New to Zora?{" "}
        <Link href="/auth/signup" className="underline">
          Create account
        </Link>
      </div>
      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          Didn’t receive verification email?
        </p>
        <form onSubmit={handleResend} className="space-y-3">
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black text-sm"
          />
          {resendStatus && (
            <div className={`text-sm ${resendStatus.includes("sent") ? "text-emerald-600" : "text-red-600"}`}>
              {resendStatus}
            </div>
          )}
          <button
            type="submit"
            disabled={resendLoading}
            className="w-full rounded-full px-4 py-2 border border-black/10 dark:border-white/10 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {resendLoading ? "Sending..." : "Resend verification email"}
          </button>
        </form>
      </div>
    </div>
  );
}
