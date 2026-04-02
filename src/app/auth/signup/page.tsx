"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../components/auth/auth-provider";

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [state, setState] = useState<"idle" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("idle");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await signup(name.trim(), email.trim(), phone.trim(), password);
    setLoading(false);

    if (!res.ok) {
      setState("error");
      setError(res.error || "Could not create account.");
      return;
    }

    setState("sent");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="font-serif text-3xl mb-2">Create account</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Create a VoltHub account for faster checkout, order tracking, and wishlist sync.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block mb-1">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
          />
        </div>
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
          <label className="block mb-1">Phone number (optional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
            />
          </div>
          <div>
            <label className="block mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
            />
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {state === "sent" && (
          <div className="text-sm text-emerald-500">
            Check your email for a confirmation link. If you don’t see it in a few minutes, check spam.
          </div>
        )}
        <button
          type="submit"
          disabled={loading || state === "sent"}
          className="w-full rounded-full px-4 py-2 bg-[color:var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : state === "sent" ? "Email Sent" : "Sign up"}
        </button>
      </form>
      <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
