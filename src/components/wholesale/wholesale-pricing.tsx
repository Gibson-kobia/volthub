"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabase } from "@/lib/supabase";
import type { Product } from "@/lib/products";

export default function WholesalePricing({ product }: { product: Product }) {
  const { user } = useAuth();
  const [isWholesaleCustomer, setIsWholesaleCustomer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        if (active) {
          setIsWholesaleCustomer(false);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await getSupabase()
          .from("profiles")
          .select("account_type,is_verified_wholesale,application_status")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) return;
        if (!error && data) {
          setIsWholesaleCustomer(
            data.is_verified_wholesale === true &&
              data.application_status === "approved" &&
              data.account_type?.startsWith("wholesale")
          );
        } else {
          setIsWholesaleCustomer(false);
        }
      } catch (err) {
        setIsWholesaleCustomer(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const wholesalePrice = product.wholesale_price;
  const retailPrice = product.priceKes;
  const showWholesale = isWholesaleCustomer && typeof wholesalePrice === "number";

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 w-40 rounded-xl bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (showWholesale) {
    return (
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="text-2xl md:text-3xl font-semibold">KES {wholesalePrice.toLocaleString()}</div>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span className="line-through">KES {retailPrice.toLocaleString()}</span>
          <span className="rounded-full bg-emerald-600/10 px-2 py-1 text-emerald-700">Partner savings</span>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Wholesale pricing applied for verified Canvus partners.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="text-2xl md:text-3xl font-semibold">KES {retailPrice.toLocaleString()}</div>
      {typeof wholesalePrice === "number" ? (
        <div className="text-sm text-zinc-500">
          Wholesale pricing available for approved partners: KES {wholesalePrice.toLocaleString()}.
        </div>
      ) : null}
    </div>
  );
}
