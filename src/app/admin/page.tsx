"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  extractSupabaseErrorMessage,
  formatCurrency,
  formatDateTime,
  formatNumber,
  getInventoryStatus,
  getMovementMeta,
  getOrderStatusMeta,
  isToday,
  normalizeOrderItems,
  sortMovementsByNewest,
  sumOrderRevenue,
} from "@/lib/admin";
import { resolveAccessForCurrentSession } from "@/lib/staff-session";
import { getSupabase } from "@/lib/supabase";
import type { DBProduct, InventoryMovement, Order } from "@/lib/types";

type RecentPartnerAction = {
  id: string;
  business_info: {
    business_name: string;
    contact_name: string | null;
  };
  status: string;
  updated_at: string | null;
};

type DashboardState = {
  products: DBProduct[];
  orders: Order[];
  movements: InventoryMovement[];
  warnings: string[];
  recentPartnerActions: RecentPartnerAction[];
};

export default function AdminDashboard() {
  const [state, setState] = useState<DashboardState>({
    products: [],
    orders: [],
    movements: [],
    warnings: [],
    recentPartnerActions: [],
  });
  const [loading, setLoading] = useState(true);
  const [viewerStoreCode, setViewerStoreCode] = useState("main");
  const supabase = getSupabase();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const warnings: string[] = [];

      const access = await resolveAccessForCurrentSession(supabase);
      const storeCode = access.storeCode || "main";
      const isSuperAdmin = access.role === "super_admin";
      setViewerStoreCode(storeCode);

      const [productsResult, ordersResult, movementsResult, recentPartnerActionsResult] = await Promise.allSettled([
        (isSuperAdmin
          ? supabase.from("products").select("*").order("created_at", { ascending: false })
          : supabase.from("products").select("*").eq("store_code", storeCode).order("created_at", { ascending: false })),
        (isSuperAdmin
          ? supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300)
          : supabase
              .from("orders")
              .select("*")
              .eq("store_code", storeCode)
              .order("created_at", { ascending: false })
              .limit(300)),
        (isSuperAdmin
          ? supabase
              .from("inventory_movements")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(12)
          : supabase
              .from("inventory_movements")
              .select("*")
              .eq("store_code", storeCode)
              .order("created_at", { ascending: false })
              .limit(12)),
        (isSuperAdmin
          ? supabase
              .from("wholesale_applications")
              .select("id,business_info,status,updated_at")
              .in("status", ["approved", "rejected"])
              .order("updated_at", { ascending: false })
              .limit(5)
          : supabase
              .from("wholesale_applications")
              .select("id,business_info,status,updated_at")
              .in("status", ["approved", "rejected"])
              .order("updated_at", { ascending: false })
              .limit(5)),
      ]);

      const products =
        productsResult.status === "fulfilled" && !productsResult.value.error
          ? ((productsResult.value.data || []) as DBProduct[])
          : [];
      if (productsResult.status === "fulfilled" && productsResult.value.error) {
        warnings.push(`Products could not be loaded: ${productsResult.value.error.message}`);
      }
      if (productsResult.status === "rejected") {
        warnings.push(`Products could not be loaded: ${extractSupabaseErrorMessage(productsResult.reason)}`);
      }

      const orders =
        ordersResult.status === "fulfilled" && !ordersResult.value.error
          ? (((ordersResult.value.data || []) as Order[]).map((order) => ({
              ...order,
              items: normalizeOrderItems(order.items),
            })) as Order[])
          : [];
      if (ordersResult.status === "fulfilled" && ordersResult.value.error) {
        warnings.push(`Orders could not be loaded: ${ordersResult.value.error.message}`);
      }
      if (ordersResult.status === "rejected") {
        warnings.push(`Orders could not be loaded: ${extractSupabaseErrorMessage(ordersResult.reason)}`);
      }

      const movements =
        movementsResult.status === "fulfilled" && !movementsResult.value.error
          ? ((movementsResult.value.data || []) as InventoryMovement[])
          : [];
      if (movementsResult.status === "fulfilled" && movementsResult.value.error) {
        warnings.push(
          movementsResult.value.error.message.includes("inventory_movements")
            ? "Inventory movement history is not available yet. Apply the admin migration to enable stock audit trails."
            : `Inventory activity could not be loaded: ${movementsResult.value.error.message}`
        );
      }
      if (movementsResult.status === "rejected") {
        warnings.push(`Inventory activity could not be loaded: ${extractSupabaseErrorMessage(movementsResult.reason)}`);
      }

      const recentPartnerActions =
        recentPartnerActionsResult.status === "fulfilled" && !recentPartnerActionsResult.value.error
          ? ((recentPartnerActionsResult.value.data || []) as RecentPartnerAction[])
          : [];
      if (recentPartnerActionsResult.status === "fulfilled" && recentPartnerActionsResult.value.error) {
        warnings.push(`Partner history could not be loaded: ${recentPartnerActionsResult.value.error.message}`);
      }
      if (recentPartnerActionsResult.status === "rejected") {
        warnings.push(`Partner history could not be loaded: ${extractSupabaseErrorMessage(recentPartnerActionsResult.reason)}`);
      }

      if (!active) return;

      setState({
        products,
        orders,
        movements: sortMovementsByNewest(movements),
        warnings,
        recentPartnerActions,
      });
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [supabase]);

  const metrics = useMemo(() => {
    const activeProducts = state.products.filter((product) => product.is_active !== false && !product.is_archived);
    const lowStockProducts = state.products.filter((product) => {
      const status = getInventoryStatus(product);
      return status.label === "Low stock";
    });
    const outOfStockProducts = state.products.filter((product) => Number(product.stock || 0) <= 0);
    const todayOrders = state.orders.filter((order) => isToday(order.created_at) && order.status !== "CANCELLED");
    const trend = buildSalesTrend(state.orders, 7);
    const topSelling = buildTopSellingProducts(state.orders, state.products, 5);
    const grossProfit = estimateGrossProfit(state.orders, state.products);
    return {
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      todayOrders,
      todayRevenue: sumOrderRevenue(todayOrders),
      trend,
      topSelling,
      grossProfit,
    };
  }, [state.orders, state.products]);

  const statusSummary = useMemo(() => {
    const summary = new Map<string, number>();
    state.orders.forEach((order) => {
      summary.set(order.status, (summary.get(order.status) || 0) + 1);
    });
    return Array.from(summary.entries()).sort((left, right) => right[1] - left[1]);
  }, [state.orders]);

  const recentOrders = state.orders.slice(0, 6);
  const recentMovements = state.movements.slice(0, 6);
  const recentPartnerActions = state.recentPartnerActions;
  const productLookup = useMemo(
    () => new Map(state.products.map((product) => [product.id, product])),
    [state.products]
  );
  const highestRevenue = Math.max(...metrics.trend.map((entry) => entry.revenue), 1);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations dashboard"
        title="The store should be runnable from here."
        description={`Live operational visibility for revenue, order pressure, product readiness, and stock movement. Metrics only use available store data and fall back cleanly when schema upgrades have not been applied yet. Scope: ${viewerStoreCode}.`}
        actions={
          <>
            <Link href="/admin/inventory">
              <ActionButton variant="secondary">Open inventory control</ActionButton>
            </Link>
            <Link href="/admin/pos">
              <ActionButton>Open sales desk</ActionButton>
            </Link>
          </>
        }
      />

      {state.warnings.length > 0 ? (
        <Surface className="border-amber-200 bg-amber-50 p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-800">Operational notes</div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-amber-700">
            {state.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today revenue"
          value={formatCurrency(metrics.todayRevenue)}
          caption={`${formatNumber(metrics.todayOrders.length)} live orders recorded today`}
          tone="sky"
        />
        <MetricCard
          label="Active products"
          value={formatNumber(metrics.activeProducts.length)}
          caption="Sellable products currently visible to operations"
          tone="indigo"
        />
        <MetricCard
          label="Low stock"
          value={formatNumber(metrics.lowStockProducts.length)}
          caption={`${formatNumber(metrics.outOfStockProducts.length)} fully out of stock`}
          tone="amber"
        />
        <MetricCard
          label="Estimated gross profit"
          value={formatCurrency(metrics.grossProfit.grossProfit)}
          caption={
            metrics.grossProfit.uncoveredLines > 0
              ? `${formatNumber(metrics.grossProfit.uncoveredLines)} item units missing cost data`
              : "Based on available cost prices"
          }
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface>
          <SurfaceHeader
            title="Sales trend"
            description="Last 7 days of recorded revenue and order count."
            action={<Badge tone="emerald">Live data</Badge>}
          />
          <div className="px-5 py-6 sm:px-6">
            {metrics.trend.every((entry) => entry.revenue === 0) ? (
              <EmptyState
                title="No trend data yet"
                description="Revenue bars appear automatically once orders are recorded in Supabase."
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="flex h-72 items-end gap-3 rounded-[24px] border border-white/8 bg-white/3 px-4 py-5">
                  {metrics.trend.map((entry) => (
                    <div key={entry.key} className="flex flex-1 flex-col items-center gap-3">
                      <div className="text-xs text-white/50">{formatNumber(entry.orders)}</div>
                      <div className="flex h-48 w-full items-end rounded-full bg-white/6 p-1">
                        <div
                          className="w-full rounded-full bg-[linear-gradient(180deg,rgba(33,212,253,0.95),rgba(47,107,255,0.95))]"
                          style={{ height: `${Math.max((entry.revenue / highestRevenue) * 100, 8)}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                        {entry.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {metrics.trend.map((entry) => (
                    <div key={entry.key} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                      <div className="flex items-center justify-between gap-3 text-sm text-white/70">
                        <span>{entry.label}</span>
                        <span>{formatCurrency(entry.revenue)}</span>
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/38">
                        {formatNumber(entry.orders)} orders
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Surface>

        <Surface>
          <SurfaceHeader
            title="Order pressure"
            description="Current status mix across recorded orders."
            action={<Link href="/admin/orders"><ActionButton variant="ghost">Manage orders</ActionButton></Link>}
          />
          <div className="space-y-3 px-5 py-6 sm:px-6">
            {statusSummary.length === 0 ? (
              <EmptyState
                title="No order records yet"
                description="Once checkouts start landing, status distribution will show where fulfilment is getting blocked."
              />
            ) : (
              statusSummary.map(([status, count]) => {
                const meta = getOrderStatusMeta(status);
                return (
                  <div key={status} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <div className="text-lg font-semibold text-white">{formatNumber(count)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface>
          <SurfaceHeader
            title="Recent orders"
            description="Most recent customer orders, with totals and current fulfilment state."
            action={<Link href="/admin/orders"><ActionButton variant="secondary">See all orders</ActionButton></Link>}
          />
          <div className="overflow-x-auto px-2 py-2 sm:px-3">
            {recentOrders.length === 0 ? (
              <div className="px-3 py-3">
                <EmptyState
                  title="No recent orders"
                  description="Customer orders will appear here once checkout activity starts writing to the orders table."
                />
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-white/42">
                  <tr>
                    <th className="px-4 py-2 font-medium">Order</th>
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-4 py-2 font-medium">Items</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const meta = getOrderStatusMeta(order.status);
                    return (
                      <tr key={order.id} className="rounded-2xl bg-white/4">
                        <td className="rounded-l-2xl px-4 py-4 font-semibold text-white">#{order.id.slice(0, 8)}</td>
                        <td className="px-4 py-4 text-white/76">{order.customer_name || "Walk-in / guest"}</td>
                        <td className="px-4 py-4 text-white/56">{formatNumber(normalizeOrderItems(order.items).length)} lines</td>
                        <td className="px-4 py-4 text-white">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-4"><Badge tone={meta.tone}>{meta.label}</Badge></td>
                        <td className="rounded-r-2xl px-4 py-4 text-white/56">{formatDateTime(order.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface>
            <SurfaceHeader
              title="Top-selling products"
              description="Demand ranked from recorded order line quantities."
              action={<Link href="/admin/reports"><ActionButton variant="ghost">Open reports</ActionButton></Link>}
            />
            <div className="space-y-3 px-5 py-6 sm:px-6">
              {metrics.topSelling.length === 0 ? (
                <EmptyState
                  title="No top sellers yet"
                  description="Product rankings appear once orders include line items tied to products."
                />
              ) : (
                metrics.topSelling.map((entry, index) => (
                  <div key={entry.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-white/34">#{index + 1}</div>
                        <div className="mt-2 font-semibold text-white">{entry.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-white">{formatNumber(entry.qty)} units</div>
                        <div className="text-sm text-white/52">{formatCurrency(entry.revenue)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader
              title="Stock pressure"
              description="Products needing replenishment or immediate action."
              action={<Link href="/admin/inventory"><ActionButton variant="ghost">Inventory actions</ActionButton></Link>}
            />
            <div className="space-y-3 px-5 py-6 sm:px-6">
              {metrics.lowStockProducts.length === 0 && metrics.outOfStockProducts.length === 0 ? (
                <EmptyState
                  title="No critical stock alerts"
                  description="Low-stock and out-of-stock products will surface here automatically."
                />
              ) : (
                [...metrics.outOfStockProducts, ...metrics.lowStockProducts.filter((product) => Number(product.stock || 0) > 0)]
                  .slice(0, 6)
                  .map((product) => {
                    const status = getInventoryStatus(product);
                    return (
                      <div key={product.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-white">{product.name}</div>
                            <div className="mt-1 text-sm text-white/52">{product.category} · {product.brand || "Brand pending"}</div>
                          </div>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </div>
                        <div className="mt-3 text-sm text-white/68">
                          {formatNumber(product.stock)} on hand · reorder level {formatNumber(product.reorder_level ?? 8)}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader
              title="Recent actions"
              description="Last partner approvals and rejections, with a traceable time stamp."
            />
            <div className="space-y-3 px-5 py-6 sm:px-6">
              {recentPartnerActions.length === 0 ? (
                <EmptyState
                  title="No partner audit events"
                  description="Partner decisions will appear here as they are processed."
                />
              ) : (
                recentPartnerActions.map((action) => {
                  const isApproved = action.status === "approved";
                  return (
                    <div key={action.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-white">{action.business_info.contact_name || action.business_info.business_name}</div>
                          <div className="mt-1 text-sm text-white/52">{action.business_info.business_name}</div>
                        </div>
                        <Badge tone={isApproved ? "emerald" : "rose"}>{isApproved ? "Approved" : "Rejected"}</Badge>
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/40">
                        {action.updated_at ? formatDateTime(action.updated_at) : "Timestamp unavailable"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Surface>
        </div>
      </div>

      <Surface>
        <SurfaceHeader
          title="Recent stock changes"
          description="Inventory movements and manual adjustments, when the movement table is available."
        />
        <div className="overflow-x-auto px-2 py-2 sm:px-3">
          {recentMovements.length === 0 ? (
            <div className="px-3 py-3">
              <EmptyState
                title="No stock movement records"
                description="Apply the migration, then use product or inventory adjustments to create a durable movement history."
              />
            </div>
          ) : (
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-white/42">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Movement</th>
                  <th className="px-4 py-2 font-medium">Before</th>
                  <th className="px-4 py-2 font-medium">After</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((movement) => {
                  const meta = getMovementMeta(movement.movement_type);
                  const product = productLookup.get(movement.product_id);
                  return (
                    <tr key={movement.id} className="rounded-2xl bg-white/4">
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-white">
                        {product?.name || `Product ${movement.product_id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-4"><Badge tone={meta.tone}>{meta.label}</Badge></td>
                      <td className="px-4 py-4 text-white/62">{formatNumber(movement.quantity_before)}</td>
                      <td className="px-4 py-4 text-white">{formatNumber(movement.quantity_after)}</td>
                      <td className="px-4 py-4 text-white/62">{movement.reason || movement.notes || "No reason recorded"}</td>
                      <td className="rounded-r-2xl px-4 py-4 text-white/56">{formatDateTime(movement.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Surface>
    </div>
  );
}
