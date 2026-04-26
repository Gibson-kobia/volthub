"use client";
import { useEffect, useState } from "react";
import { useCart } from "./cart/cart-provider";

export function AddToCartButton({
  productId,
  className,
  label = "Add to Cart",
  addedLabel = "Added",
  compact = false,
  ariaLabel,
}: {
  productId: string;
  className?: string;
  label?: string;
  addedLabel?: string;
  compact?: boolean;
  ariaLabel?: string;
}) {
  const { addItem, openDrawer } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1200);
    return () => window.clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      aria-label={ariaLabel || label}
      onClick={() => {
        addItem(productId, 1);
        setAdded(true);
        window.setTimeout(() => openDrawer(), 120);
      }}
      className={
        className ||
        (compact
          ? "relative rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-all hover:border-white/16 hover:bg-white/12 active:scale-[0.98]"
          : "relative rounded-full px-4 py-2 bg-[color:var(--accent)] text-white hover:opacity-90 transition-transform active:scale-[0.98]")
      }
    >
      <span className={`inline-flex items-center gap-1.5 transition-opacity ${added ? "opacity-0" : "opacity-100"}`}>
        {compact ? (
          <span className="grid h-4 w-4 place-items-center rounded-full bg-white/12 text-[11px] leading-none text-white">
            +
          </span>
        ) : null}
        {label}
      </span>
      <span
        className={`absolute inset-0 grid place-items-center transition-all ${
          added ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-white" />
          {addedLabel}
        </span>
      </span>
    </button>
  );
}
