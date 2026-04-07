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
  formatDateTime,
  formatNumber,
  getInventoryStatus,
  getMovementMeta,
  getProductReorderLevel,
  INVENTORY_MOVEMENT_TYPES,
} from "@/lib/admin";
import { resolveAccessForCurrentSession } from "@/lib/staff-session";
import { getSupabase } from "@/lib/supabase";
import type { DBProduct, InventoryMovement, InventoryMovementType } from "@/lib/types";

type AdjustmentState = {
  movement_type: InventoryMovementType;
  quantity: string;
  reason: string;
  notes: string;
};

const DEFAULT_ADJUSTMENT: AdjustmentState = {
  movement_type: "ADJUSTMENT",
  quantity: "",
  reason: "",
  notes: "",
};

const MOVEMENT_FILTER_OPTIONS = [
  { value: "all", label: "All movements" },
  { value: "STOCK_IN", label: "Stock in" },
  { value: "STOCK_OUT", label: "Stock out" },
  { value: "ADJUSTMENT", label: "Adjustments" },
  { value: "SALE", label: "Sales" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "WASTAGE", label: "Wastage" },
  { value: "RETURN", label: "Returns" },
];

const STOCK_STATUS_FILTERS = [
  { value: "all", label: "All products" },
  { value: "out", label: "Out of stock" },
  { value: "low", label: "Low stock" },
  { value: "healthy", label: "Healthy" },
];

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsReady, setMovementsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [movementFilter, setMovementFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);
  const [adjustment, setAdjustment] = useState<AdjustmentState>(DEFAULT_ADJUSTMENT);
  const [activeTab, setActiveTab] = useState<"products" | "movements">("products");
  const [viewerStoreCode, setViewerStoreCode] = useState("main");
  const supabase = getSupabase();

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setWarning(null);

    const access = await resolveAccessForCurrentSession(supabase);
    const storeCode = access.storeCode || "main";
    const isSuperAdmin = access.role === "super_admin";
    setViewerStoreCode(storeCode);

    const [productsResult, movementsResult] = await Promise.allSettled([
      (isSuperAdmin
        ? supabase.from("products").select("*").order("name", { ascending: true })
        : supabase.from("products").select("*").eq("store_code", storeCode).order("name", { ascending: true })),
      (isSuperAdmin
        ? supabase
            .from("inventory_movements")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200)
        : supabase
            .from("inventory_movements")
            .select("*")
            .eq("store_code", storeCode)
            .order("created_at", { ascending: false })
            .limit(200)),
    ]);

    if (productsResult.status === "fulfilled" && !productsResult.value.error) {
      setProducts((productsResult.value.data || []) as DBProduct[]);
    } else if (productsResult.status === "fulfilled" && productsResult.value.error) {
      setWarning(`Products could not be loaded: ${productsResult.value.error.message}`);
    }

    if (movementsResult.status === "fulfilled") {
      if (!movementsResult.value.error) {
        setMovements((movementsResult.value.data || []) as InventoryMovement[]);
        setMovementsReady(true);
      } else if (movementsResult.value.error.message.includes("inventory_movements")) {
        setWarning(
          "Inventory movement history is not available yet. Apply the admin migration to enable stock audit trails."
        );
      }
    }

    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (q) {
        const searchText = [product.name, product.sku, product.barcode, product.brand, product.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchText.includes(q)) return false;
      }
      const status = getInventoryStatus(product);
      if (stockFilter === "out" && status.label !== "Out of stock") return false;
      if (stockFilter === "low" && status.label !== "Low stock") return false;
      if (stockFilter === "healthy" && status.label !== "Healthy") return false;
      return true;
    });
  }, [products, productQuery, stockFilter]);

  const filteredMovements = useMemo(() => {
    if (movementFilter === "all") return movements;
    return movements.filter((m) => m.movement_type === movementFilter);
  }, [movements, movementFilter]);

  const summary = useMemo(() => {
    const outOfStock = products.filter((p) => Number(p.stock || 0) <= 0).length;
    const lowStock = products.filter((p) => getInventoryStatus(p).label === "Low stock").length;
    const healthy = products.filter((p) => getInventoryStatus(p).label === "Healthy").length;
    const totalValue = products.reduce((sum, p) => {
      const cost = Number(p.cost_price ?? 0);
      const stock = Number(p.stock ?? 0);
      return sum + cost * stock;
    }, 0);
    const valueKnown = products.filter((p) => p.cost_price !== null && p.cost_price !== undefined).length;
    return { outOfStock, lowStock, healthy, totalValue, valueKnown };
  }, [products]);

  const productLookup = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  async function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;

    const quantity = Number(adjustment.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setWarning("Enter a valid positive quantity.");
      return;
    }
    if (!adjustment.reason.trim()) {
      setWarning("A reason is required for every stock movement.");
      return;
    }

    const beforeQty = Number(selectedProduct.stock || 0);
    let delta: number;
    if (adjustment.movement_type === "STOCK_IN" || adjustment.movement_type === "RETURN") {
      delta = quantity;
    } else if (adjustment.movement_type === "ADJUSTMENT") {
      delta = quantity - beforeQty;
    } else {
      delta = -quantity;
    }
    const afterQty = Math.max(0, beforeQty + delta);

    setSaving(true);
    setWarning(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const actorEmail = sessionData.session?.user.email ?? null;

      const { error: productError } = await supabase
        .from("products")
        .update({ stock: afterQty })
        .eq("id", selectedProduct.id);
      if (productError) throw productError;

      if (movementsReady) {
        const { error: movementError } = await supabase.from("inventory_movements").insert([
          {
            product_id: selectedProduct.id,
            movement_type: adjustment.movement_type,
            quantity_change: delta,
            quantity_before: beforeQty,
            quantity_after: afterQty,
            reason: adjustment.reason.trim(),
            notes: adjustment.notes.trim() || null,
            actor_email: actorEmail,
            store_code: viewerStoreCode,
          },
        ]);
        if (movementError) throw movementError;
      }

      await loadData();
      setSelectedProduct(null);
      setAdjustment(DEFAULT_ADJUSTMENT);
      setFeedback(`Stock updated for ${selectedProduct.name}. Now: ${afterQty} units.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setWarning(extractSupabaseErrorMessage(err));
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
        eyebrow="Inventory control"
        title="Stock truth lives here."
        description={`Manage every product's real stock position, log every movement, and catch low-stock before it becomes a missed sale. Movements build a durable audit trail automatically. Scope: ${viewerStoreCode}.`}
      />

      {warning ? (
        <Surface className="border-amber-400/18 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50/90">
          {warning}
        </Surface>
      ) : null}
      {feedback ? (
        <Surface className="border-emerald-400/18 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50/90">
          {feedback}
        </Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Out of stock"
          value={formatNumber(summary.outOfStock)}
          caption="Products with zero available units"
          tone="rose"
        />
        <MetricCard
          label="Low stock"
          value={formatNumber(summary.lowStock)}
          caption="Below reorder thresholds, action needed"
          tone="amber"
        />
        <MetricCard
          label="Healthy stock"
          value={formatNumber(summary.healthy)}
          caption="Above all current reorder levels"
          tone="emerald"
        />
        <MetricCard
          label="Stock value (estimate)"
          value={
            summary.valueKnown < products.length
              ? `KES ${formatNumber(summary.totalValue)}*`
              : `KES ${formatNumber(summary.totalValue)}`
          }
          caption={
            summary.valueKnown < products.length
              ? `* ${formatNumber(products.length - summary.valueKnown)} products missing cost price`
              : "Based on cost price × stock quantity"
          }
          tone="sky"
        />
      </div>

      <div className="flex gap-1 rounded-full border border-white/10 bg-white/4 p-1 w-fit">
        <button
          onClick={() => setActiveTab("products")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "products"
              ? "bg-[color:var(--accent)] text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          Stock positions
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "movements"
              ? "bg-[color:var(--accent)] text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          Movement history {movementsReady ? `(${formatNumber(movements.length)})` : ""}
        </button>
      </div>

      {activeTab === "products" ? (
        <Surface>
          <SurfaceHeader
            title="Product stock positions"
            description="Current stock, reorder thresholds, and movement controls for every product."
          />
          <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-5 sm:flex-row sm:px-6">
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search by name, SKU, barcode, brand..."
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
            >
              {STOCK_STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto px-2 py-2 sm:px-3">
            {filteredProducts.length === 0 ? (
              <div className="px-3 py-3">
                <EmptyState
                  title="No products match"
                  description="Adjust filters or add products in the Products section."
                />
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-white/42">
                  <tr>
                    <th className="px-4 py-2 font-medium">Product</th>
                    <th className="px-4 py-2 font-medium">SKU / Barcode</th>
                    <th className="px-4 py-2 font-medium">Stock</th>
                    <th className="px-4 py-2 font-medium">Reorder at</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Cost value</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const status = getInventoryStatus(product);
                    const reorderLevel = getProductReorderLevel(product);
                    const stockValue =
                      product.cost_price !== null && product.cost_price !== undefined
                        ? Number(product.cost_price) * Number(product.stock || 0)
                        : null;
                    return (
                      <tr key={product.id} className="rounded-[22px] bg-white/4">
                        <td className="rounded-l-[22px] px-4 py-4">
                          <div className="font-semibold text-white">{product.name}</div>
                          <div className="mt-1 text-xs text-white/45">
                            {product.brand || "No brand"} · {product.category}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-white/65">
                          <div>{product.sku || <span className="text-white/30">No SKU</span>}</div>
                          <div className="mt-1 text-xs">{product.barcode || <span className="text-white/30">No barcode</span>}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-2xl font-bold ${
                              Number(product.stock || 0) <= 0
                                ? "text-rose-300"
                                : Number(product.stock || 0) <= reorderLevel
                                ? "text-amber-300"
                                : "text-white"
                            }`}
                          >
                            {formatNumber(product.stock)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white/65">{formatNumber(reorderLevel)}</td>
                        <td className="px-4 py-4">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-4 text-white/65">
                          {stockValue !== null ? `KES ${formatNumber(stockValue)}` : <span className="text-white/30">Unknown</span>}
                        </td>
                        <td className="rounded-r-[22px] px-4 py-4 text-right">
                          <ActionButton
                            variant="secondary"
                            onClick={() => {
                              setSelectedProduct(product);
                              setAdjustment(DEFAULT_ADJUSTMENT);
                              setWarning(null);
                            }}
                          >
                            Adjust stock
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
      ) : (
        <Surface>
          <SurfaceHeader
            title="Inventory movement history"
            description={
              movementsReady
                ? "Every stock change logged with reason, actor, and timestamps."
                : "Apply the admin migration to enable movement audit trail logging."
            }
          />
          {movementsReady ? (
            <>
              <div className="border-b border-white/8 px-5 py-4 sm:px-6">
                <select
                  value={movementFilter}
                  onChange={(e) => setMovementFilter(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
                >
                  {MOVEMENT_FILTER_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto px-2 py-2 sm:px-3">
                {filteredMovements.length === 0 ? (
                  <div className="px-3 py-3">
                    <EmptyState
                      title="No movement records"
                      description="Stock movements will appear here after adjustments are made through the inventory or products interface."
                    />
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                    <thead className="text-white/42">
                      <tr>
                        <th className="px-4 py-2 font-medium">Date</th>
                        <th className="px-4 py-2 font-medium">Product</th>
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Before</th>
                        <th className="px-4 py-2 font-medium">Change</th>
                        <th className="px-4 py-2 font-medium">After</th>
                        <th className="px-4 py-2 font-medium">Reason</th>
                        <th className="px-4 py-2 font-medium">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.map((movement) => {
                        const meta = getMovementMeta(movement.movement_type);
                        const product = productLookup.get(movement.product_id);
                        return (
                          <tr key={movement.id} className="rounded-[22px] bg-white/4">
                            <td className="rounded-l-[22px] px-4 py-4 text-white/56 whitespace-nowrap">
                              {formatCompactDate(movement.created_at)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-semibold text-white">
                                {product?.name || `Product ${movement.product_id.slice(0, 8)}`}
                              </div>
                              {product?.sku ? (
                                <div className="mt-1 text-xs text-white/45">{product.sku}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-4">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                            </td>
                            <td className="px-4 py-4 text-white/65">{formatNumber(movement.quantity_before)}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`font-semibold ${
                                  movement.quantity_change > 0
                                    ? "text-emerald-300"
                                    : movement.quantity_change < 0
                                    ? "text-rose-300"
                                    : "text-white/60"
                                }`}
                              >
                                {movement.quantity_change > 0 ? "+" : ""}
                                {formatNumber(movement.quantity_change)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-white font-semibold">
                              {formatNumber(movement.quantity_after)}
                            </td>
                            <td className="px-4 py-4 text-white/65 max-w-[14rem] truncate">
                              {movement.reason || movement.notes || (
                                <span className="text-white/30">No reason</span>
                              )}
                            </td>
                            <td className="rounded-r-[22px] px-4 py-4 text-white/50 text-xs truncate max-w-[10rem]">
                              {movement.actor_email || "System"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="px-5 py-8 sm:px-6">
              <EmptyState
                title="Movement log not yet available"
                description="The inventory_movements table needs to be created. Run the admin migration (supabase/migrations/20260405_admin_upgrade_safe.sql) in your Supabase project, then stock adjustments will be logged here automatically."
              />
            </div>
          )}
        </Surface>
      )}

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0d1218] shadow-[0_40px_140px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between border-b border-white/8 px-6 py-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
                  Stock movement
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {selectedProduct.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/55">
                  <span>Current: <strong className="text-white">{formatNumber(selectedProduct.stock)}</strong></span>
                  {selectedProduct.sku ? <span>SKU: {selectedProduct.sku}</span> : null}
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-sm font-semibold text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitAdjustment} className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span>Movement type</span>
                  <select
                    value={adjustment.movement_type}
                    onChange={(e) =>
                      setAdjustment((prev) => ({
                        ...prev,
                        movement_type: e.target.value as InventoryMovementType,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-white outline-none"
                  >
                    {INVENTORY_MOVEMENT_TYPES.map((type) => {
                      const meta = getMovementMeta(type);
                      return (
                        <option key={type} value={type}>
                          {meta.label}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>
                    {adjustment.movement_type === "ADJUSTMENT"
                      ? "Target quantity (new stock level)"
                      : "Quantity"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={adjustment.quantity}
                    onChange={(e) =>
                      setAdjustment((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    placeholder={adjustment.movement_type === "ADJUSTMENT" ? `Current: ${formatNumber(selectedProduct.stock)}` : "e.g. 24"}
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                  <span>Reason (required)</span>
                  <input
                    value={adjustment.reason}
                    onChange={(e) =>
                      setAdjustment((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="e.g. supplier delivery note #1234, damaged on shelf, cycle count correction"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                  <span>Notes (optional)</span>
                  <textarea
                    rows={3}
                    value={adjustment.notes}
                    onChange={(e) =>
                      setAdjustment((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/68">
                {movementsReady
                  ? "This movement will be logged in the audit trail with timestamp and actor."
                  : "Stock will update. Movement logging is not yet available — apply the migration to enable audit trail."}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/8 pt-5">
                <ActionButton
                  variant="ghost"
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </ActionButton>
                <ActionButton type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Apply movement"}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
