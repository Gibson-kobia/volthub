"use client";
import Link from "next/link";
import { fetchProducts, type Product } from "../../lib/products";
import { useCart } from "../../components/cart/cart-provider";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../components/auth/auth-provider";
import { getSupabase } from "../../lib/supabase";

function buildWhatsAppOrderUrl(message: string) {
  return `https://wa.me/254798966238?text=${encodeURIComponent(message)}`;
}

export default function CartPage() {
  const { items: cart, setQty, removeItem } = useCart();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState<"meru" | "kenya">("meru");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWholesaleCustomer, setIsWholesaleCustomer] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadWholesaleStatus() {
      if (!user) {
        if (active) setIsWholesaleCustomer(false);
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
        if (active) setIsWholesaleCustomer(false);
      }
    }
    loadWholesaleStatus();
    return () => {
      active = false;
    };
  }, [user]);

  const items = cart
    .map((c) => ({ ...c, product: products.find((p) => p.id === c.productId) }))
    .filter((i) => i.product);

  const getItemPrice = (product: Product) =>
    isWholesaleCustomer && typeof product.wholesale_price === "number"
      ? product.wholesale_price
      : product.priceKes;

  const subtotal = items.reduce((sum, i) => sum + getItemPrice(i.product!) * i.qty, 0);
  const waMessage =
    items.length === 0
      ? ""
      : `Hello Canvus, I want to order: ${items
          .map((i) => `${i.product!.name} x${i.qty}`)
          .join(", ")} - Total: KES ${subtotal.toLocaleString()}${
          user?.name?.trim() ? ` - Name: ${user.name.trim()}` : ""
        }`;
  const waUrl = waMessage ? buildWhatsAppOrderUrl(waMessage) : "";
  const estimate = useMemo(() => {
    return delivery === "meru" ? "Same-day via bodaboda" : "1-3 days via courier";
  }, [delivery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0c]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0c] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Your Cart</h1>
          <p className="text-zinc-400 mt-1">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-zinc-400 mb-6">Your cart is empty</div>
            <Link
              href="/shop"
              className="inline-block rounded-full px-6 py-3 bg-[color:var(--accent)] text-white font-medium hover:opacity-90"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((i) => (
                <div
                  key={i.product?.id}
                  className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    <img
                      src={
                        i.product?.image && i.product?.image.startsWith("http")
                          ? i.product?.image
                          : "/product-placeholder.png"
                      }
                      alt={i.product?.name || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                      {i.product?.brand}
                    </div>
                    <div className="text-white font-medium leading-tight mb-2">
                      {i.product?.name}
                    </div>
                    <div className="text-white font-semibold mb-3">
                      KES {getItemPrice(i.product!).toLocaleString()}
                      {isWholesaleCustomer && i.product?.wholesale_price ? (
                        <span className="ml-3 text-xs text-zinc-400 line-through">
                          KES {i.product.priceKes.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          className="w-8 h-8 rounded-full border border-white/20 text-white hover:bg-white/10 flex items-center justify-center text-sm"
                          onClick={() => setQty(i.product!.id, i.qty - 1)}
                        >
                          −
                        </button>
                        <span className="text-white min-w-[24px] text-center">{i.qty}</span>
                        <button
                          className="w-8 h-8 rounded-full border border-white/20 text-white hover:bg-white/10 flex items-center justify-center text-sm"
                          onClick={() => setQty(i.product!.id, i.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-xs text-zinc-400 hover:text-red-400"
                        onClick={() => removeItem(i.product!.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold mb-4">Order Summary</div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-white">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Delivery</span>
                  <span className="text-zinc-400">{estimate}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-medium mb-3">Delivery area</div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      delivery === "meru"
                        ? "bg-[color:var(--accent)] text-white"
                        : "border border-white/20 text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setDelivery("meru")}
                  >
                    Meru
                  </button>
                  <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      delivery === "kenya"
                        ? "bg-[color:var(--accent)] text-white"
                        : "border border-white/20 text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setDelivery("kenya")}
                  >
                    Rest of Kenya
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/checkout"
                  className="block w-full rounded-full px-4 py-3 bg-[color:var(--accent)] text-white text-center font-medium hover:opacity-90"
                >
                  Checkout
                </Link>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full px-4 py-3 border border-white/20 text-white text-center text-sm hover:bg-white/10"
                >
                  Order via WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
