"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  AdminPageHeader,
  Badge,
  EmptyState,
  MetricCard,
  Surface,
  SurfaceHeader,
} from "@/components/admin/admin-ui";
import {
  extractSupabaseErrorMessage,
  formatCompactDate,
  formatCurrency,
  formatNumber,
  getInventoryStatus,
  getProductSearchText,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import type { DBProduct, StoreSale, StoreSaleItem } from "@/lib/types";

type CartLine = {
  product: DBProduct;
  qty: number;
};

export default function AdminPosPage() {
  const supabase = getSupabase();

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [sales, setSales] = useState<StoreSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salesReady, setSalesReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setWarning(null);

    const [productsResult, salesResult] = await Promise.allSettled([
      supabase.from("products").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("store_sales").select("*").order("created_at", { ascending: false }).limit(40),
    ]);

    if (productsResult.status === "fulfilled") {
      if (!productsResult.value.error) {
        setProducts((productsResult.value.data || []) as DBProduct[]);
      } else {
        setWarning(`Products could not be loaded: ${productsResult.value.error.message}`);
      }
    }

    if (salesResult.status === "fulfilled") {
      const salesError = salesResult.value.error;
      if (!salesError) {
        setSales((salesResult.value.data || []) as StoreSale[]);
        setSalesReady(true);
      } else if (salesError.message.includes("store_sales")) {
        setSalesReady(false);
        setWarning((current) => current || "POS sales tables are not ready yet. Apply the admin operations migration.");
      } else {
        setWarning((current) => current || `Sales history could not be loaded: ${salesError.message}`);
      }
    }

    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      if (!normalizedQuery) return true;
      return getProductSearchText(product).includes(normalizedQuery);
    });
  }, [products, query]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + Number(line.product.price || 0) * line.qty, 0),
    [cart]
  );

  const estimatedProfit = useMemo(
    () =>
      cart.reduce(
        (sum, line) =>
          sum + (Number(line.product.price || 0) - Number(line.product.cost_price || 0)) * Number(line.qty || 0),
        0
      ),
    [cart]
  );

  const todaySales = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return sales.filter((sale) => sale.created_at.slice(0, 10) === todayKey);
  }, [sales]);

  function addToCart(product: DBProduct) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, qty: Math.min(line.qty + 1, Number(product.stock || 0)) } : line
        );
      }
      return [...current, { product, qty: 1 }];
    });
  }

  function updateLineQty(productId: string, nextQty: number) {
    if (nextQty <= 0) {
      setCart((current) => current.filter((line) => line.product.id !== productId));
      return;
    }
    setCart((current) =>
      current.map((line) =>
        line.product.id === productId
          ? { ...line, qty: Math.min(nextQty, Number(line.product.stock || nextQty)) }
          : line
      )
    );
  }

  async function completeSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!salesReady) {
      setWarning("Cannot complete sale until store_sales tables exist.");
      return;
    }
    if (cart.length === 0) {
      setWarning("Add at least one product to complete a sale.");
      return;
    }

    const outOfStockLine = cart.find((line) => line.qty > Number(line.product.stock || 0));
    if (outOfStockLine) {
      setWarning(`Insufficient stock for ${outOfStockLine.product.name}.`);
      return;
    }

    setSaving(true);
    setWarning(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const operatorEmail = sessionData.session?.user.email || null;

      const salePayload: Omit<StoreSale, "id" | "created_at"> = {
        customer_name: customerName.trim() || null,
        operator_email: operatorEmail,
        payment_method: paymentMethod,
        payment_status: "PAID",
        subtotal,
        total: subtotal,
        gross_profit_estimate: estimatedProfit,
        notes: notes.trim() || null,
        store_code: "main",
      };

      const { data: saleData, error: saleError } = await supabase
        .from("store_sales")
        .insert([salePayload])
        .select("*")
        .single();
      if (saleError) throw saleError;

      const saleId = (saleData as StoreSale).id;

      const itemRows: Omit<StoreSaleItem, "id" | "created_at">[] = cart.map((line) => ({
        sale_id: saleId,
        product_id: line.product.id,
        product_name: line.product.name,
        sku: line.product.sku || null,
        barcode: line.product.barcode || null,
        quantity: line.qty,
        unit_price: Number(line.product.price || 0),
        cost_price: line.product.cost_price ?? null,
        line_total: Number(line.product.price || 0) * line.qty,
      }));

      const { error: itemError } = await supabase.from("store_sale_items").insert(itemRows);
      if (itemError) throw itemError;

      for (const line of cart) {
        const beforeQty = Number(line.product.stock || 0);
        const afterQty = Math.max(0, beforeQty - line.qty);

        const { error: productError } = await supabase
          .from("products")
          .update({ stock: afterQty })
          .eq("id", line.product.id);
        if (productError) throw productError;

        const { error: movementError } = await supabase.from("inventory_movements").insert([
          {
            product_id: line.product.id,
            movement_type: "SALE",
            quantity_change: -line.qty,
            quantity_before: beforeQty,
            quantity_after: afterQty,
            reason: `POS sale ${saleId.slice(0, 8)}`,
            actor_email: operatorEmail,
            reference_type: "store_sale",
            reference_id: saleId,
          },
        ]);

        if (movementError && !movementError.message.includes("inventory_movements")) {
          throw movementError;
        }
      }

      setCart([]);
      setCustomerName("");
      setNotes("");
      setFeedback(`Sale ${saleId.slice(0, 8)} completed.`);
      await loadData();
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-[color:var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Sales desk"
        title="POS-ready sales operations"
        description="Fast product lookup, cashier-ready sale capture, payment tagging, and stock deduction with movement logging."
      />

      {warning ? (
        <Surface className="border-amber-400/18 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50/90">{warning}</Surface>
      ) : null}
      {feedback ? (
        <Surface className="border-emerald-400/18 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50/90">{feedback}</Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Today sales" value={formatNumber(todaySales.length)} tone="sky" />
        <MetricCard
          label="Today revenue"
          value={formatCurrency(todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0))}
          tone="emerald"
        />
        <MetricCard label="Cart total" value={formatCurrency(subtotal)} tone="indigo" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface>
          <SurfaceHeader title="Product lookup" description="Search by product name, SKU, barcode, brand, or slug." />
          <div className="border-b border-white/8 px-5 py-5 sm:px-6">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, barcode"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
          <div className="max-h-[36rem] overflow-auto px-2 py-2 sm:px-3">
            {filteredProducts.length === 0 ? (
              <div className="px-3 py-3">
                <EmptyState title="No products found" description="Try a different search term." />
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-white/42">
                  <tr>
                    <th className="px-4 py-2 font-medium">Product</th>
                    <th className="px-4 py-2 font-medium">Price</th>
                    <th className="px-4 py-2 font-medium">Stock</th>
                    <th className="px-4 py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const status = getInventoryStatus(product);
                    const disabled = Number(product.stock || 0) <= 0;
                    return (
                      <tr key={product.id} className="rounded-2xl bg-white/4">
                        <td className="rounded-l-2xl px-4 py-4">
                          <div className="font-semibold text-white">{product.name}</div>
                          <div className="mt-1 text-xs text-white/45">{product.sku || product.barcode || "No identifier"}</div>
                        </td>
                        <td className="px-4 py-4 text-white font-semibold">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-4"><Badge tone={status.tone}>{formatNumber(product.stock)} in stock</Badge></td>
                        <td className="rounded-r-2xl px-4 py-4 text-right">
                          <ActionButton variant="secondary" disabled={disabled} onClick={() => addToCart(product)}>
                            {disabled ? "Out" : "Add"}
                          </ActionButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Surface>

        <form onSubmit={completeSale} className="space-y-6">
          <Surface>
            <SurfaceHeader title="Current sale" description="Build cart and complete sale." />
            <div className="space-y-4 px-5 py-5 sm:px-6">
              {cart.length === 0 ? (
                <EmptyState title="Cart is empty" description="Add products from the lookup table." />
              ) : (
                cart.map((line) => (
                  <div key={line.product.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{line.product.name}</div>
                        <div className="mt-1 text-xs text-white/50">{formatCurrency(line.product.price)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded-full border border-white/14 px-3 py-1 text-white" onClick={() => updateLineQty(line.product.id, line.qty - 1)}>-</button>
                        <span className="min-w-8 text-center text-white">{formatNumber(line.qty)}</span>
                        <button type="button" className="rounded-full border border-white/14 px-3 py-1 text-white" onClick={() => updateLineQty(line.product.id, line.qty + 1)}>+</button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-white/70">Line total: {formatCurrency(line.qty * Number(line.product.price || 0))}</div>
                  </div>
                ))
              )}

              <label className="space-y-2 text-sm text-white/70 block">
                <span>Customer name</span>
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Optional" />
              </label>
              <label className="space-y-2 text-sm text-white/70 block">
                <span>Payment method</span>
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-white outline-none">
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/70 block">
                <span>Notes</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Optional receipt or shift note" />
              </label>

              <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/68">
                <div>Subtotal: <span className="font-semibold text-white">{formatCurrency(subtotal)}</span></div>
                <div className="mt-1">Estimated gross profit: <span className="font-semibold text-white">{formatCurrency(estimatedProfit)}</span></div>
              </div>

              <ActionButton type="submit" disabled={saving || cart.length === 0 || !salesReady}>
                {saving ? "Completing..." : salesReady ? "Complete sale" : "Sales tables missing"}
              </ActionButton>
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Recent transactions" />
            <div className="space-y-3 px-5 py-5 sm:px-6">
              {sales.length === 0 ? (
                <EmptyState title="No sale records" description="Completed sales will appear here." />
              ) : (
                sales.slice(0, 12).map((sale) => (
                  <div key={sale.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">#{sale.id.slice(0, 8)}</div>
                        <div className="mt-1 text-xs text-white/50">{formatCompactDate(sale.created_at)} · {sale.payment_method || "unknown"}</div>
                      </div>
                      <div className="text-sm font-semibold text-white">{formatCurrency(sale.total)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>
        </form>
      </div>
    </div>
  );
}
