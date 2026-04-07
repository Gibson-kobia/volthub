"use client";

import { useEffect, useMemo, useState } from "react";
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
  buildSalesTrend,
  buildTopSellingProducts,
  estimateGrossProfit,
  formatCompactDate,
  formatCurrency,
  formatNumber,
  getInventoryStatus,
  normalizeOrderItems,
} from "@/lib/admin";
import { resolveAccessForCurrentSession } from "@/lib/staff-session";
import { getSupabase } from "@/lib/supabase";
import type { DBProduct, InventoryMovement, Order } from "@/lib/types";

export default function AdminReportsPage() {
  const supabase = getSupabase();

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [viewerStoreCode, setViewerStoreCode] = useState("main");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setWarning(null);

      const access = await resolveAccessForCurrentSession(supabase);
      const storeCode = access.storeCode || "main";
      const isSuperAdmin = access.role === "super_admin";
      if (active) setViewerStoreCode(storeCode);

      const [productsResult, ordersResult, movementsResult] = await Promise.allSettled([
        (isSuperAdmin
          ? supabase.from("products").select("*").order("created_at", { ascending: false })
          : supabase.from("products").select("*").eq("store_code", storeCode).order("created_at", { ascending: false })),
        (isSuperAdmin
          ? supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1200)
          : supabase
              .from("orders")
              .select("*")
              .eq("store_code", storeCode)
              .order("created_at", { ascending: false })
              .limit(1200)),
        (isSuperAdmin
          ? supabase.from("inventory_movements").select("*").order("created_at", { ascending: false }).limit(600)
          : supabase
              .from("inventory_movements")
              .select("*")
              .eq("store_code", storeCode)
              .order("created_at", { ascending: false })
              .limit(600)),
      ]);

      if (!active) return;

      if (productsResult.status === "fulfilled") {
        if (!productsResult.value.error) {
          setProducts((productsResult.value.data || []) as DBProduct[]);
        } else {
          setWarning(`Products could not be loaded: ${productsResult.value.error.message}`);
        }
      }

      if (ordersResult.status === "fulfilled") {
        const ordersError = ordersResult.value.error;
        if (!ordersError) {
          setOrders((ordersResult.value.data || []) as Order[]);
        } else {
          setWarning((current) => current || `Orders could not be loaded: ${ordersError.message}`);
        }
      }

      if (movementsResult.status === "fulfilled") {
        const movementError = movementsResult.value.error;
        if (!movementError) {
          setMovements((movementsResult.value.data || []) as InventoryMovement[]);
        } else if (!movementError.message.includes("inventory_movements")) {
          setWarning((current) => current || `Inventory movements unavailable: ${movementError.message}`);
        }
      }

      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [reloadToken, supabase]);

  const normalizedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        items: normalizeOrderItems(order.items),
      })),
    [orders]
  );

  const salesTrend = useMemo(() => buildSalesTrend(normalizedOrders, 14), [normalizedOrders]);
  const topSelling = useMemo(() => buildTopSellingProducts(normalizedOrders, products, 8), [normalizedOrders, products]);
  const grossProfit = useMemo(() => estimateGrossProfit(normalizedOrders, products), [normalizedOrders, products]);

  const totals = useMemo(() => {
    const allRevenue = normalizedOrders.reduce((sum, order) => {
      if (order.status === "CANCELLED") return sum;
      return sum + Number(order.total || 0);
    }, 0);

    const last7DaysRevenue = salesTrend.slice(-7).reduce((sum, item) => sum + item.revenue, 0);
    const delivered = normalizedOrders.filter((order) => order.status === "DELIVERED").length;
    const cancelled = normalizedOrders.filter((order) => order.status === "CANCELLED").length;
    const lowStock = products.filter((product) => getInventoryStatus(product).label === "Low stock").length;
    const outOfStock = products.filter((product) => Number(product.stock || 0) <= 0).length;

    return {
      allRevenue,
      last7DaysRevenue,
      delivered,
      cancelled,
      lowStock,
      outOfStock,
    };
  }, [normalizedOrders, products, salesTrend]);

  const recentMovementSummary = useMemo(() => {
    const map = new Map<string, number>();
    movements.forEach((movement) => {
      map.set(movement.movement_type, (map.get(movement.movement_type) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [movements]);

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
        eyebrow="Reporting"
        title="Business performance and inventory pressure."
        description={`Revenue, estimated gross profit, order outcomes, and stock movement insights built from live store data. Scope: ${viewerStoreCode}.`}
        actions={<ActionButton variant="secondary" onClick={() => setReloadToken((current) => current + 1)}>Refresh data</ActionButton>}
      />

      {warning ? (
        <Surface className="border-amber-400/18 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50/90">
          {warning}
        </Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total revenue" value={formatCurrency(totals.allRevenue)} tone="sky" />
        <MetricCard label="Last 7 days" value={formatCurrency(totals.last7DaysRevenue)} tone="indigo" />
        <MetricCard label="Gross profit est." value={formatCurrency(grossProfit.grossProfit)} tone="emerald" />
        <MetricCard label="Delivered" value={formatNumber(totals.delivered)} tone="emerald" />
        <MetricCard label="Cancelled" value={formatNumber(totals.cancelled)} tone="zinc" />
        <MetricCard label="Low or out" value={formatNumber(totals.lowStock + totals.outOfStock)} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface>
          <SurfaceHeader title="14-day sales trend" description="Revenue and order count by day." />
          <div className="grid gap-3 px-5 py-6 sm:px-6">
            {salesTrend.length === 0 ? (
              <EmptyState title="No trend data" description="Orders will populate this trend once checkout or POS records are available." />
            ) : (
              salesTrend.map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-white">{item.label} · {formatCompactDate(item.key)}</div>
                    <div className="text-sm text-white/62">{formatNumber(item.orders)} orders</div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{formatCurrency(item.revenue)}</div>
                </div>
              ))
            )}
          </div>
        </Surface>

        <Surface>
          <SurfaceHeader title="Top-selling products" description="Best performers by sold quantity." />
          <div className="space-y-3 px-5 py-6 sm:px-6">
            {topSelling.length === 0 ? (
              <EmptyState title="No product sales yet" description="Top-selling list appears when orders include normalized line items." />
            ) : (
              topSelling.map((entry, index) => (
                <div key={entry.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-white/38">#{index + 1}</div>
                      <div className="mt-1 font-semibold text-white">{entry.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{formatNumber(entry.qty)} units</div>
                      <div className="text-xs text-white/55">{formatCurrency(entry.revenue)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface>
          <SurfaceHeader title="Inventory movement summary" description="Recent movement types across stock operations." />
          <div className="space-y-3 px-5 py-6 sm:px-6">
            {recentMovementSummary.length === 0 ? (
              <EmptyState title="No movement summary" description="Movement data appears after inventory adjustments are logged." />
            ) : (
              recentMovementSummary.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <Badge tone="indigo">{type.replaceAll("_", " ")}</Badge>
                  <div className="text-base font-semibold text-white">{formatNumber(count)}</div>
                </div>
              ))
            )}
          </div>
        </Surface>

        <Surface>
          <SurfaceHeader title="Gross profit coverage" description="How much of the estimate has known cost prices." />
          <div className="space-y-4 px-5 py-6 sm:px-6">
            <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/38">Covered item units</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatNumber(grossProfit.coveredLines)}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/38">Uncovered item units</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatNumber(grossProfit.uncoveredLines)}</div>
            </div>
            {grossProfit.uncoveredLines > 0 ? (
              <div className="rounded-2xl border border-amber-400/18 bg-amber-400/10 px-4 py-4 text-sm leading-6 text-amber-100/88">
                Some sold units do not have cost data yet. Add cost_price in products for stronger margin reporting.
              </div>
            ) : null}
          </div>
        </Surface>
      </div>
    </div>
  );
}
