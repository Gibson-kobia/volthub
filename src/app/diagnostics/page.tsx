"use client";

import { useEffect, useState } from "react";
import { diagnoseSupabaseConfig } from "@/lib/supabase";
import { fetchProducts } from "@/lib/products";

type DiagnosticStatus = "loading" | "success" | "error";

interface Diagnostic {
  name: string;
  status: DiagnosticStatus;
  message: string;
  timestamp: string;
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: Diagnostic[] = [];
      const timestamp = new Date().toISOString();

      // Check 1: Supabase Configuration
      const config = diagnoseSupabaseConfig();
      results.push({
        name: "Supabase Configuration",
        status: config.configured ? "success" : "error",
        message: config.configured
          ? `✅ Configured for ${config.environment}`
          : `❌ Missing env vars. URL: ${config.url}, Key present: ${config.keyPresent}`,
        timestamp,
      });

      // Check 2: Product Fetch
      try {
        const startTime = performance.now();
        const products = await fetchProducts();
        const endTime = performance.now();

        results.push({
          name: "Product Fetch API",
          status: products.length > 0 ? "success" : "error",
          message:
            products.length > 0
              ? `✅ Fetched ${products.length} products in ${Math.round(endTime - startTime)}ms`
              : "❌ No products returned (check database)",
          timestamp,
        });
      } catch (error) {
        results.push({
          name: "Product Fetch API",
          status: "error",
          message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp,
        });
      }

      // Check 3: Network Connectivity
      try {
        const response = await fetch(
          "https://api.github.com/zen",
          { method: "HEAD" }
        );
        results.push({
          name: "Network Connectivity",
          status: response.ok ? "success" : "error",
          message: response.ok
            ? "✅ Internet connection working"
            : `❌ HTTP ${response.status}`,
          timestamp,
        });
      } catch (error) {
        results.push({
          name: "Network Connectivity",
          status: "error",
          message: `❌ Network error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp,
        });
      }

      // Check 4: Browser Environment
      results.push({
        name: "Browser Environment",
        status: typeof window !== "undefined" ? "success" : "error",
        message: `✅ Browser: ${typeof window !== "undefined" ? "Yes" : "No"}, Environment: ${process.env.NODE_ENV}`,
        timestamp,
      });

      setDiagnostics(results);
      setIsRunning(false);
    };

    runDiagnostics();
  }, []);

  const getStatusColor = (status: DiagnosticStatus) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "loading":
        return "text-yellow-600";
    }
  };

  const getStatusBg = (status: DiagnosticStatus) => {
    switch (status) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "loading":
        return "bg-yellow-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Supabase Connectivity Diagnostics
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Use this page to debug Supabase connectivity issues on production
          </p>
        </div>

        <div className="space-y-4">
          {isRunning && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Running diagnostics...
              </p>
            </div>
          )}

          {diagnostics.map((diag, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-4 ${getStatusBg(diag.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {diag.name}
                  </h3>
                  <p className={`mt-1 text-sm ${getStatusColor(diag.status)}`}>
                    {diag.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(diag.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`text-2xl ${getStatusColor(diag.status)}`}>
                  {diag.status === "success" && "✓"}
                  {diag.status === "error" && "✗"}
                  {diag.status === "loading" && "⋯"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-900">Troubleshooting Steps</h2>
          <ul className="mt-3 space-y-2 text-sm text-blue-800">
            <li>
              1. Check Vercel Project Settings → Environment Variables
            </li>
            <li>
              2. Verify <code>NEXT_PUBLIC_SUPABASE_URL</code> is set
            </li>
            <li>
              3. Verify <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> is set
            </li>
            <li>
              4. Add your Vercel domain to Supabase CORS allowlist
            </li>
            <li>
              5. Check browser DevTools Console for [Supabase] logs
            </li>
            <li>
              6. Review VERCEL_DEPLOYMENT_GUIDE.md for detailed setup
            </li>
          </ul>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => {
              setIsRunning(true);
              setDiagnostics([]);
              window.location.reload();
            }}
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Re-run Diagnostics
          </button>

          <div className="text-sm text-gray-600">
            <p>
              📋 <strong>Note:</strong> This page is for debugging only. It
              should be removed or protected in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
