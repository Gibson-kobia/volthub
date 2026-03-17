"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../components/auth/auth-provider";

export default function ResetPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setLoading(true);
    const res = await resetPassword(email.trim());
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to reset password.");
      return;
    }
    setStatus("Reset email sent. Check your inbox for the link.");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="font-serif text-3xl mb-2">Reset password</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Enter your email and we’ll send you a reset link.
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
        {error && <div className="text-sm text-red-600">{error}</div>}
        {status && <div className="text-sm text-emerald-600">{status}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full px-4 py-2 bg-[color:var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send reset email"}
        </button>
      </form>
      <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
        <Link href="/auth/login" className="underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
