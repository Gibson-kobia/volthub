"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProducts, type Product } from "../../lib/products";
import { MapDeliverySelector } from "../../components/map-delivery-selector";
import { useAuth } from "../../components/auth/auth-provider";
import { getSupabase } from "../../lib/supabase";

type CartItem = { productId: string; qty: number };
type DeliveryLocation = {
  latitude: number;
  longitude: number;
  addressLabel?: string;
  deliveryMethod: "bodaboda" | "courier";
};

function buildWhatsAppOrderUrl(message: string) {
  return `https://wa.me/254798966238?text=${encodeURIComponent(message)}`;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const cartRaw = typeof window !== "undefined" ? localStorage.getItem("cart") : null;
    return cartRaw ? (JSON.parse(cartRaw) as CartItem[]) : [];
  });
  const [products, setProducts] = useState<Product[]>([]);

  const [addressText, setAddressText] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<"nairobi" | "kenya">("nairobi");
  const [paymentMode, setPaymentMode] = useState<"mpesa" | "delivery">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? "");
  const [mapSelected, setMapSelected] = useState<DeliveryLocation | null>(() => {
    const dlRaw = typeof window !== "undefined" ? localStorage.getItem("deliveryLocation") : null;
    if (dlRaw) {
      try {
        return JSON.parse(dlRaw) as DeliveryLocation;
      } catch {}
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    customerName?: string;
    itemsLabel: string;
    total: number;
  } | null>(null);
  const savedAddresses = useMemo<{ id: string; label: string; addressText: string }[]>(() => {
    if (!user) return [];
    const raw = typeof window !== "undefined" ? localStorage.getItem("volthubAddresses") : null;
    const all = raw ? (JSON.parse(raw) as { id: string; userId: string; label: string; addressText: string }[]) : [];
    return all
      .filter((a) => a.userId === user.id)
      .map(({ id, label, addressText }) => ({ id, label, addressText }));
  }, [user]);

  useEffect(() => {
    async function load() {
      const p = await fetchProducts();
      setProducts(p);
    }
    load();
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cart") {
        const parsed = e.newValue ? (JSON.parse(e.newValue) as CartItem[]) : [];
        setCart(parsed);
      }
      if (e.key === "deliveryLocation" && e.newValue) {
        try {
          setMapSelected(JSON.parse(e.newValue) as DeliveryLocation);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const items = useMemo(() => {
    return cart
      .map((c) => {
        const product = products.find((p) => p.id === c.productId);
        return product ? { product, qty: c.qty } : null;
      })
      .filter(Boolean) as { product: (typeof products)[number]; qty: number }[];
  }, [cart, products]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + i.product.priceKes * i.qty, 0);
  }, [items]);

  const deliveryMethod = deliveryArea === "nairobi" ? "bodaboda" : "courier";
  const deliveryEstimate = deliveryArea === "nairobi" ? "Same-day via bodaboda" : "1-3 days via courier";

  const confirmLocation = (loc: DeliveryLocation) => {
    setMapSelected(loc);
    setShowMap(false);
  };

  const normalizeKenyanPhone = (input: string) => {
    const digits = input.replace(/\D/g, "");
    if (digits.startsWith("254") && digits.length >= 12) return digits.slice(3, 12);
    if (digits.startsWith("0") && digits.length >= 10) return digits.slice(1, 10);
    if (digits.length === 9) return digits;
    return digits.slice(-9);
  };

  const placeOrder = async () => {
    setError(null);
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    const hasAddress = addressText.trim().length > 0;
    const hasMap = !!mapSelected;
    if (!hasAddress && !hasMap) {
      setError("Add a text address or select a map location.");
      return;
    }

    const name = customerName.trim();
    const email = customerEmail.trim();
    const phone = normalizeKenyanPhone(customerPhone);
    if (!name) {
      setError("Enter your full name.");
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!phone || phone.length !== 9) {
      setError("Enter a valid phone number (e.g. 712345678).");
      return;
    }

    const mpesa = normalizeKenyanPhone(mpesaPhone);
    if (paymentMode === "mpesa" && mpesa.length !== 9) {
      setError("Enter a valid M‑Pesa phone number (e.g. 712345678).");
      return;
    }

    const orderItems = items.map((i) => ({
      product_id: i.product.id,
      name: i.product.name,
      qty: i.qty,
      price: i.product.priceKes,
    }));

    const { data: rpcData, error: rpcError } = await getSupabase().rpc("place_order_with_inventory", {
      p_customer_name: name,
      p_customer_phone: phone,
      p_customer_email: email,
      p_items: orderItems,
      p_total: subtotal,
      p_delivery_method: deliveryMethod,
      p_delivery_location: hasMap ? mapSelected : null,
      p_address_text: hasAddress ? addressText.trim() : null,
      p_payment_method: paymentMode,
      p_mpesa_phone: paymentMode === "mpesa" ? mpesa : null,
    });

    if (rpcError) {
      setError(rpcError.message || "Order could not be placed. Check your Supabase connection.");
      return;
    }

    if (!rpcData?.success) {
      if (rpcData?.error === "insufficient_stock") {
        setError("Some items are out of stock. Please refresh your cart and try again.");
      } else if (rpcData?.error === "total_mismatch") {
        setError("Cart total changed. Please refresh and try again.");
      } else if (rpcData?.error === "missing_delivery_destination") {
        setError("Add a text address or select a map location.");
      } else if (rpcData?.error === "missing_mpesa_phone") {
        setError("Enter a valid M-Pesa phone number.");
      } else {
        setError(rpcData?.error || "Order could not be placed.");
      }
      return;
    }
    setLastOrder({
      customerName: name,
      itemsLabel: items.map((i) => `${i.product.name} x${i.qty}`).join(", "),
      total: subtotal,
    });
    localStorage.setItem("cart", JSON.stringify([]));
    setPlaced(true);
  };

  if (placed) {
    const waMessage = lastOrder
      ? `Hello VoltHub, I want to order: ${lastOrder.itemsLabel} - Total: KES ${lastOrder.total.toLocaleString()}${
          lastOrder.customerName?.trim() ? ` - Name: ${lastOrder.customerName.trim()}` : ""
        }`
      : "Hello VoltHub, I just placed an order and need help confirming it.";
    const waUrl = buildWhatsAppOrderUrl(waMessage);
    return (
      <div className="min-h-screen bg-[#0a0b0c] text-white">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="text-2xl font-semibold mb-4">Order placed successfully</div>
          <div className="text-zinc-400 mb-8">
            We'll send payment and delivery details shortly.
          </div>
          <div className="space-y-4">
            <Link href="/" className="block w-full rounded-full px-6 py-3 bg-[color:var(--accent)] text-white font-medium hover:opacity-90">
              Continue shopping
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full px-6 py-3 border border-white/20 text-white hover:bg-white/10"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0c] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="text-zinc-400 mt-1">Complete your order</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form Sections */}
          <div className="space-y-6">
            {/* Delivery Method */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold mb-4">Delivery method</div>
              <div className="space-y-4">
                <div className="text-sm text-zinc-400 mb-3">
                  Choose your delivery area
                </div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition-colors ${
                      deliveryArea === "nairobi"
                        ? "bg-[color:var(--accent)] text-white"
                        : "border border-white/20 text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setDeliveryArea("nairobi")}
                  >
                    Nairobi
                  </button>
                  <button
                    className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition-colors ${
                      deliveryArea === "kenya"
                        ? "bg-[color:var(--accent)] text-white"
                        : "border border-white/20 text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setDeliveryArea("kenya")}
                  >
                    Rest of Kenya
                  </button>
                </div>
                <div className="text-sm text-zinc-400">
                  {deliveryEstimate}
                </div>
              </div>
            </div>

            {/* Delivery Location */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold mb-4">Delivery location</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="e.g. Apartment, street, estate, landmarks"
                    className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </div>
                {savedAddresses.length > 0 && (
                  <div>
                    <div className="text-xs text-zinc-500 mb-2">Saved addresses</div>
                    <select
                      onChange={(e) => {
                        const id = e.target.value;
                        const found = savedAddresses.find((a) => a.id === id);
                        if (found) setAddressText(found.addressText);
                      }}
                      className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white focus:border-[color:var(--accent)] focus:outline-none"
                    >
                      <option value="" className="bg-[#0a0b0c]">Select saved address</option>
                      {savedAddresses.map((a) => (
                        <option key={a.id} value={a.id} className="bg-[#0a0b0c]">
                          {a.label} — {a.addressText.slice(0, 40)}
                          {a.addressText.length > 40 ? "…" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <button
                    onClick={() => setShowMap((v) => !v)}
                    className="w-full rounded-full px-4 py-3 border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    {mapSelected ? "Change location on map" : "Choose location on map"}
                  </button>
                  {mapSelected && (
                    <div className="mt-3 text-sm text-emerald-400">
                      ✓ Location selected
                    </div>
                  )}
                </div>
                {showMap && (
                  <div className="mt-4">
                    <MapDeliverySelector
                      deliveryMethod={deliveryMethod}
                      value={mapSelected}
                      onChange={(loc) => setMapSelected(loc)}
                      onConfirm={confirmLocation}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold mb-4">Contact details</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full name</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Wanjiru"
                    className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. alex@email.com"
                    className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-4 border border-white/20 rounded-lg bg-white/10 text-zinc-400 text-sm">
                      +254
                    </span>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="712345678"
                      className="flex-1 rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[color:var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold mb-4">Payment method</div>
              <div className="space-y-3">
                <label className="flex items-center gap-4 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMode === "mpesa"}
                    onChange={() => setPaymentMode("mpesa")}
                    className="accent-[color:var(--accent)]"
                  />
                  <div className="flex-1">
                    <div className="font-medium">M-Pesa Express</div>
                    <div className="text-sm text-zinc-400">
                      Pay instantly with your M-Pesa account
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-4 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMode === "delivery"}
                    onChange={() => setPaymentMode("delivery")}
                    className="accent-[color:var(--accent)]"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Pay on delivery</div>
                    <div className="text-sm text-zinc-400">
                      Pay cash when your order arrives
                    </div>
                  </div>
                </label>
              </div>

              {paymentMode === "mpesa" && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <label className="block text-sm font-medium mb-2">
                    M-Pesa phone number
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-4 border border-white/20 rounded-lg bg-white/10 text-zinc-400 text-sm">
                      +254
                    </span>
                    <input
                      value={mpesaPhone}
                      onChange={(e) =>
                        setMpesaPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 9)
                        )
                      }
                      placeholder="712345678"
                      className="flex-1 rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[color:var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Use a Safaricom number in 7XXXXXXXX format
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                {error}
              </div>
            )}

            <button
              onClick={placeOrder}
              disabled={
                items.length === 0 ||
                !customerName.trim() ||
                !customerEmail.trim() ||
                !customerPhone.trim() ||
                (paymentMode === "mpesa" && !mpesaPhone.trim()) ||
                !(addressText.trim().length > 0 || !!mapSelected)
              }
              className="w-full rounded-full px-6 py-4 bg-[color:var(--accent)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Place order
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold mb-4">Order summary</div>
              <div className="space-y-3 mb-6">
                {items.length === 0 && (
                  <div className="text-sm text-zinc-400">
                    Your cart is empty.
                  </div>
                )}
                {items.map((i) => (
                  <div key={i.product.id} className="flex items-center justify-between">
                    <div className="text-sm text-zinc-400">{i.product.name}</div>
                    <div className="text-sm text-zinc-400">x{i.qty}</div>
                    <div className="text-sm text-white">KES {i.product.priceKes.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-white">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Delivery</span>
                  <span className="text-zinc-400">{deliveryEstimate}</span>
                </div>
              </div>
              <div className="border-t border-white/10 mt-4 pt-4 flex items-center justify-between">
                <div className="font-semibold">Total</div>
                <div className="font-semibold text-white">KES {subtotal.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
