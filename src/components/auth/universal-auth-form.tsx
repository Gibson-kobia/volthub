"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { getSupabase } from "../../lib/supabase";
import { getActiveStaffByEmail } from "../../lib/access-control";

type AuthType = 'retail' | 'wholesale' | 'admin';

interface UniversalAuthFormProps {
  type: AuthType;
}

export default function UniversalAuthForm({ type }: UniversalAuthFormProps) {
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

  const getBranding = () => {
    switch (type) {
      case 'retail':
        return {
          title: "Canvus Retail",
          subtitle: "Shop electronics, groceries, and more.",
          bgClass: "bg-green-50",
          textClass: "text-green-900",
          buttonClass: "bg-green-600 hover:bg-green-700 text-white",
          linkHref: "/shop",
          linkText: "Browse our products"
        };
      case 'wholesale':
        return {
          title: "Canvus Bulk Portal",
          subtitle: "Access wholesale pricing for businesses and institutions.",
          bgClass: "bg-blue-50",
          textClass: "text-blue-900",
          buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
          linkHref: "/wholesale/apply",
          linkText: "Don't have a partner account? Apply for Wholesale Access"
        };
      case 'admin':
        return {
          title: "Staff Operations HQ",
          subtitle: "Secure Access Only - Authorized Personnel",
          bgClass: "bg-gray-100",
          textClass: "text-gray-900",
          buttonClass: "bg-gray-800 hover:bg-gray-900 text-white",
          linkHref: "/admin",
          linkText: "Return to main site"
        };
    }
  };

  const branding = getBranding();

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

    // Get user profile to determine redirect
    const { data: user } = await getSupabase().auth.getUser();
    const { data: profile } = await getSupabase()
      .from('profiles')
      .select('account_type')
      .eq('id', user.user?.id)
      .single();

    const staff = await getActiveStaffByEmail(getSupabase(), email.trim().toLowerCase());

    let redirectPath = '/';
    if (staff) {
      redirectPath = '/admin/dashboard';
    } else if (profile?.account_type === 'wholesaler' || profile?.account_type === 'bulk_buyer') {
      redirectPath = '/wholesale/dashboard';
    }

    window.location.href = redirectPath;
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
    <div className={`min-h-screen ${branding.bgClass} flex items-center justify-center px-6`}>
      <div className="w-full max-w-md">
        <h1 className={`font-serif text-3xl ${branding.textClass} mb-2 text-center`}>{branding.title}</h1>
        <p className={`text-sm mb-8 text-center ${type === 'admin' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
          {branding.subtitle}
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block mb-1 text-sm ${branding.textClass}`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border-b border-gray-300 bg-transparent px-0 py-2 ${branding.textClass} placeholder-gray-500 focus:border-gray-500 focus:outline-none transition-colors`}
            />
          </div>
          <div>
            <label className={`block mb-1 text-sm ${branding.textClass}`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border-b border-gray-300 bg-transparent px-0 py-2 ${branding.textClass} placeholder-gray-500 focus:border-gray-500 focus:outline-none transition-colors`}
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed rounded-none transition-colors ${branding.buttonClass}`}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link href={branding.linkHref} className={`${branding.textClass} underline hover:opacity-70 transition-colors text-sm`}>
            {branding.linkText}
          </Link>
        </div>
      </div>
    </div>
  );
}