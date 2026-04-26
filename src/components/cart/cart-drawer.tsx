"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts, type Product } from "../../lib/products";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, setQty, removeItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const p = await fetchProducts();
      setProducts(p);
    }
    if (isDrawerOpen) {
      load();
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  const lines = items
    .map((i) => ({
      ...i,
      product: products.find((p) => p.id === i.productId),
    }))
    .filter((l) => l.product);

  const total = lines.reduce(
    (sum, l) => sum + (l.product?.priceKes || 0) * l.qty,
    0
  );

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isDrawerOpen ? "" : "pointer-events-none"
      }`}
      aria-hidden={!isDrawerOpen}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
          isDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeDrawer}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white border-l border-light-border shadow-lg transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-deep-ink">Cart</div>
              <div className="text-sm text-muted">
                {lines.length} item{lines.length === 1 ? "" : "s"}
              </div>
            </div>
            <button
              className="rounded-lg p-2 text-muted hover:text-deep-ink hover:bg-off-white"
              onClick={closeDrawer}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {lines.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted">Your cart is empty</div>
              <Link
                href="/shop"
                onClick={closeDrawer}
                className="mt-4 inline-block text-sm text-primary underline"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map((l) => (
                <div
                  key={l.product!.id}
                  className="flex gap-4 p-4 rounded-lg border border-light-border bg-off-white"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-light-border">
                    <Image
                      src={l.product!.image || "/product-placeholder.png"}
                      alt={l.product!.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted uppercase tracking-wide">
                      {l.product!.brand}
                    </div>
                    <div className="text-sm font-medium text-deep-ink leading-tight mt-1">
                      {l.product!.name}
                    </div>
                    <div className="text-sm font-semibold text-deep-ink mt-2">
                      KES {l.product!.priceKes.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="w-8 h-8 rounded-lg border border-light-border text-deep-ink hover:bg-light-border flex items-center justify-center text-sm"
                          onClick={() => setQty(l.product!.id, l.qty - 1)}
                        >
                          −
                        </button>
                        <span className="text-sm text-deep-ink min-w-[20px] text-center">{l.qty}</span>
                        <button
                          className="w-8 h-8 rounded-lg border border-light-border text-deep-ink hover:bg-light-border flex items-center justify-center text-sm"
                          onClick={() => setQty(l.product!.id, l.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-xs text-muted hover:text-primary"
                        onClick={() => removeItem(l.product!.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="p-6 border-t border-light-border">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted">Total</div>
              <div className="text-lg font-semibold text-deep-ink">
                KES {total.toLocaleString()}
              </div>
            </div>
            <div className="space-y-3">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block w-full rounded-lg px-4 py-3 border border-light-border text-deep-ink text-center text-sm font-medium hover:bg-off-white"
              >
                View full cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="block w-full rounded-lg px-4 py-3 bg-primary text-white text-center text-sm font-medium hover:bg-primary/90"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
