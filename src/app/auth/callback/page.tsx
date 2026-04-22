import { Suspense } from "react";
import AuthCallbackContent from "./callback-content";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 bg-zinc-950 text-white">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-black/75 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-lg animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-[color:var(--accent)] animate-spin" />
            <h1 className="text-2xl font-semibold">Verifying your Canvus account…</h1>
            <p className="text-sm text-zinc-300">
              Please wait while we confirm your email and set up your session.
            </p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
