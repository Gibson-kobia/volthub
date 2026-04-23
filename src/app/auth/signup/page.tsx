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
  const [accountType, setAccountType] = useState<"retail" | "wholesale">("retail");
  const [wholesaleType, setWholesaleType] = useState<"school" | "business" | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [repRole, setRepRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
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

    if (accountType === "wholesale") {
      if (!wholesaleType) {
        setError("Please select whether you are a school/institution or business/reseller.");
        return;
      }
      if (!institutionName.trim()) {
        setError("Institution/Business name is required for wholesale accounts.");
        return;
      }
      if (!repRole.trim()) {
        setError("Your role/position is required for wholesale accounts.");
        return;
      }
    }

    setLoading(true);
    const accountTypeValue = accountType === "retail" ? "retail" : wholesaleType === "school" ? "wholesale_school" : "wholesale_general";
    const res = await signup(name.trim(), email.trim(), phone.trim(), password, accountTypeValue, institutionName.trim(), repRole.trim());
    setLoading(false);

    if (!res.ok) {
      setState("error");
      if (res.code === "already_confirmed") {
        setError("This email is already registered. Please log in or reset your password.");
      } else if (res.error?.toLowerCase().includes("already")) {
        setError("An account with this email already exists. If unconfirmed, request a new confirmation email from login.");
      } else {
        setError(res.error || "Could not create account.");
      }
      return;
    }

    if (res.code === "confirmation_resent") {
      setInfoMessage("This email already has a pending account. We sent a fresh confirmation link.");
    } else if (res.code === "wholesale_pending") {
      setInfoMessage("Your wholesale application has been submitted. We'll review it within 24-48 hours.");
    }

    setState("sent");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-10 bg-slate-900 text-white rounded-lg shadow-lg">
      <h1 className="font-serif text-3xl mb-2">Create account</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Create a Canvus wholesale account for bulk ordering, institutional pricing, and WhatsApp integration.
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

        {/* Account Type Selection */}
        <div>
          <label className="block mb-3 font-medium text-slate-900">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType("retail")}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                accountType === "retail"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <div className="font-semibold">Retail</div>
              <div className="text-xs mt-1">Standard shopping</div>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("wholesale")}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                accountType === "wholesale"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <div className="font-semibold">Wholesale</div>
              <div className="text-xs mt-1">Bulk ordering & special pricing</div>
            </button>
          </div>
        </div>

        {/* Wholesale Type Selection */}
        {accountType === "wholesale" && (
          <div>
            <label className="block mb-2 font-medium">Wholesale Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="wholesaleType"
                  value="school"
                  checked={wholesaleType === "school"}
                  onChange={(e) => setWholesaleType(e.target.value as "school")}
                  className="mr-2"
                />
                School/Institution - LPO payments, credit terms
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="wholesaleType"
                  value="business"
                  checked={wholesaleType === "business"}
                  onChange={(e) => setWholesaleType(e.target.value as "business")}
                  className="mr-2"
                />
                Business/Reseller - M-Pesa payments, exclusive discounts
              </label>
            </div>
          </div>
        )}

        {/* Conditional Wholesale Fields */}
        {accountType === "wholesale" && wholesaleType && (
          <>
            <div>
              <label className="block mb-1">
                {wholesaleType === "school" ? "School/Institution Name" : "Business Name"}
              </label>
              <input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder={wholesaleType === "school" ? "e.g., Meru High School" : "e.g., ABC Traders Ltd"}
                className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
              />
            </div>
            <div>
              <label className="block mb-1">Your Role/Position</label>
              <input
                value={repRole}
                onChange={(e) => setRepRole(e.target.value)}
                placeholder={wholesaleType === "school" ? "e.g., School Bursar" : "e.g., Owner/Manager"}
                className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-white dark:bg-black"
              />
            </div>
          </>
        )}

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
            {infoMessage || "Check your email for a confirmation link. If you don’t see it in a few minutes, check spam."}
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
