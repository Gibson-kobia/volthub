"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../components/auth/auth-provider";
import { getSupabase } from "../../../lib/supabase";
import { getActiveStaffByEmail, getPostLoginPath } from "../../../lib/access-control";

export default function LoginPage() {
  const { login, refreshSession, resendConfirmation } = useAuth();
  const urlParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [confirmed] = useState(() => urlParams?.get("confirmed") === "1");
  const [confirmError] = useState<string | null>(() => urlParams?.get("confirm_error") || null);

  const confirmErrorText = (() => {
    if (!confirmError) return null;
    if (confirmError === "invalid_link") return "This confirmation link is invalid. Request a new verification email.";
    if (confirmError === "verification_failed") return "We could not verify that link. Request a new verification email and try again.";
    if (confirmError === "session_missing") return "Email confirmed, but automatic sign-in did not complete. Please log in.";
    return "Could not complete email confirmation. Please request a new verification email.";
  })();

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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-white mb-2 text-center">Partner Access</h1>
        <p className="text-zinc-500 text-sm mb-8 text-center">
          Enter your credentials to access the Canvus Bulk Portal.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-zinc-400 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-zinc-800 bg-transparent px-0 py-2 text-white placeholder-zinc-600 focus:border-white focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block mb-1 text-zinc-400 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-zinc-800 bg-transparent px-0 py-2 text-white placeholder-zinc-600 focus:border-white focus:outline-none transition-colors"
            />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 text-sm font-medium hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed rounded-none transition-colors"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link href="/wholesale/apply" className="text-white underline hover:text-zinc-200 transition-colors text-sm z-10 relative">
            Don't have a partner account? Apply for Wholesale Access
          </Link>
        </div>
      </div>
    </div>
  );
}
