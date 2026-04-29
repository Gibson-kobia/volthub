import { createBrowserClient, createServerClient as createServerClientSSR } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Get or create a Supabase client instance
 * Works in both client and server components (via Server Actions)
 * 
 * Important: This uses the ANON key, which is safe to expose in the browser.
 * For server-only operations, use createServerClient() instead.
 * 
 * Usage:
 *   const supabase = getSupabase();
 *   const { data } = await supabase.from('products').select('*');
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // During build time, warn but allow creation of dummy client to prevent build crashes.
      // At runtime, this dummy client will fail any network request, which is expected behavior
      // when env vars are missing. The developer must provide them.
      if (typeof window === "undefined") {
        console.warn(
          "[Supabase] Environment variables missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
        );
      } else {
        console.error(
          "[Supabase] Missing browser environment variables. Requests will fail. Check .env.local"
        );
      }
      client = createClient("https://placeholder.supabase.co", "placeholder-key");
    } else {
      client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return client;
}

/**
 * Create a Supabase client for server-side operations
 * Use this in Server Components or API routes that need service role access
 * 
 * Usage:
 *   const supabase = createServerClient();
 *   const { data } = await supabase.from('products').select('*');
 */
export function createServerClient(cookies?: {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) => void;
}): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  const key = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing Supabase authentication key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (cookies) {
    return createServerClientSSR(supabaseUrl, key, { cookies });
  }

  return createClient(supabaseUrl, key);
}
