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
  extractSupabaseErrorMessage,
  formatCompactDate,
  formatCurrency,
  formatDateTime,
  formatNumber,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  normalizeOrderItems,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/admin";
import { resolveAccessForCurrentSession } from "@/lib/staff-session";
import { getSupabase } from "@/lib/supabase";
import type { Order, OrderPaymentStatus, OrderStatus } from "@/lib/types";

type OrderWithNormalizedItems = Order & {
  items: ReturnType<typeof normalizeOrderItems>;
};

export default function AdminOrdersPage() {
  const supabase = getSupabase();
  const [orders, setOrders] = useState<OrderWithNormalizedItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<OrderPaymentStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "online" | "pos">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithNormalizedItems | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [viewerStoreCode, setViewerStoreCode] = useState("main");

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setWarning(null);

    try {
      const access = await resolveAccessForCurrentSession(supabase);
      if (!access.isStaff || !access.role || !access.storeCode) {
        setWarning("No active staff profile found for this account.");
        setOrders([]);
        return;
      }

      setViewerRole(access.role);
      setViewerStoreCode(access.storeCode);

      let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (access.role !== "super_admin") {
        query = query.eq("store_code", access.storeCode);
      }

      const { data, error } = await query;

      if (error) throw error;

      const normalized = ((data || []) as Order[]).map((order) => ({
        ...order,
        items: normalizeOrderItems(order.items),
      }));

      setOrders(normalized);
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (paymentFilter !== "ALL" && (order.payment_status || "PENDING") !== paymentFilter) return false;

      const source = ((order.order_source || "").toLowerCase().includes("pos") ? "pos" : "online") as
        | "pos"
        | "online";
      if (sourceFilter !== "ALL" && sourceFilter !== source) return false;

      if (!normalizedQuery) return true;

      const searchText = [
        order.id,
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.payment_method,
        order.delivery_method,
        order.address_text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(normalizedQuery);
    });
  }, [orders, paymentFilter, query, sourceFilter, statusFilter]);

  const summary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      if (order.status === "CANCELLED") return sum;
      return sum + Number(order.total || 0);
    }, 0);

    const pending = filteredOrders.filter((order) => order.status === "NEW" || order.status === "CONFIRMED").length;
    const inProgress = filteredOrders.filter(
      (order) => order.status === "PREPARING" || order.status === "WITH_RIDER" || order.status === "DISPATCHED"
    ).length;
    const delivered = filteredOrders.filter((order) => order.status === "DELIVERED").length;
    const cancelled = filteredOrders.filter((order) => order.status === "CANCELLED").length;

    return {
      totalRevenue,
      pending,
      inProgress,
      delivered,
      cancelled,
      count: filteredOrders.length,
    };
  }, [filteredOrders]);

  async function updateOrder(
    order: OrderWithNormalizedItems,
    patch: Partial<Pick<Order, "status" | "payment_status" | "admin_note">>
  ) {
    setSavingOrderId(order.id);
    setWarning(null);

    try {
      const nextPatch: Record<string, string> = {
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.payment_status ? { payment_status: patch.payment_status } : {}),
        ...(patch.admin_note !== undefined ? { admin_note: patch.admin_note || "" } : {}),
        updated_at: new Date().toISOString(),
      };

      if (patch.status === "DELIVERED") {
        nextPatch.fulfilled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("orders")
        .update(nextPatch)
        .eq("id", order.id)
        .select("*")
        .single();

      if (error) throw error;

      const updated = {
        ...(data as Order),
        items: normalizeOrderItems((data as Order).items),
      };

      setOrders((current) => current.map((entry) => (entry.id === order.id ? updated : entry)));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(updated);
      }
      setFeedback("Order updated.");
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    } finally {
      setSavingOrderId(null);
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
        eyebrow="Order operations"
        title="Fulfilment, payment, and customer flow control."
        description={`Track every order from NEW to DELIVERED, monitor payment states, and keep customer detail visibility centralized for operations teams. Scope: ${viewerStoreCode}.`}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Visible orders" value={formatNumber(summary.count)} tone="sky" />
        <MetricCard label="Pending" value={formatNumber(summary.pending)} tone="amber" />
        <MetricCard label="In progress" value={formatNumber(summary.inProgress)} tone="indigo" />
        <MetricCard label="Delivered" value={formatNumber(summary.delivered)} tone="emerald" />
        <MetricCard label="Revenue" value={formatCurrency(summary.totalRevenue)} tone="slate" />
      </div>

      <Surface>
        <SurfaceHeader
          title="Order queue"
          description="Filter, inspect, and update orders without losing compatibility with legacy order row shapes."
          action={<ActionButton variant="secondary" onClick={() => void loadOrders()}>Refresh</ActionButton>}
        />

        <div className="grid gap-3 border-b border-white/8 px-5 py-5 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] sm:px-6">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, phone, order id, address"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "ALL")}
            className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="ALL">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value as OrderPaymentStatus | "ALL")}
            className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="ALL">All payment states</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as "ALL" | "online" | "pos")}
            className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="ALL">All sources</option>
            <option value="online">Online checkout</option>
            <option value="pos">POS / counter</option>
          </select>
        </div>

        <div className="overflow-x-auto px-2 py-2 sm:px-3">
          {filteredOrders.length === 0 ? (
            <div className="px-3 py-3">
              <EmptyState
                title="No orders match"
                description="Adjust filters or wait for new checkout / POS activity to land in Supabase."
              />
            </div>
          ) : (
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-white/42">
                <tr>
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Payment</th>
                  <th className="px-4 py-2 font-medium">Placed</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusMeta = getOrderStatusMeta(order.status);
                  const paymentMeta = getPaymentStatusMeta(order.payment_status || "PENDING");
                  return (
                    <tr key={order.id} className="rounded-2xl bg-white/4">
                      <td className="rounded-l-2xl px-4 py-4 text-white">
                        <div className="font-semibold">#{order.id.slice(0, 8)}</div>
                        <div className="mt-1 text-xs text-white/45">
                          {order.order_source || "online"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white/75">
                        <div>{order.customer_name || "Guest"}</div>
                        <div className="mt-1 text-xs text-white/45">{order.customer_phone || "No phone"}</div>
                      </td>
                      <td className="px-4 py-4 text-white font-semibold">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-4">
                        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={paymentMeta.tone}>{paymentMeta.label}</Badge>
                      </td>
                      <td className="px-4 py-4 text-white/52">{formatCompactDate(order.created_at)}</td>
                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        <ActionButton variant="ghost" onClick={() => setSelectedOrder(order)}>
                          Details
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

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#0d1218] shadow-[0_40px_140px_rgba(0,0,0,0.45)]">
            <div className="sticky top-0 border-b border-white/8 bg-[#0d1218]/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">Order details</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Order #{selectedOrder.id.slice(0, 8)}</div>
                  <div className="mt-1 text-sm text-white/55">Placed {formatDateTime(selectedOrder.created_at)}</div>
                </div>
                <button className="text-sm font-semibold text-white/60 hover:text-white" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/42">Total</div>
                  <div className="mt-2 text-xl font-semibold text-white">{formatCurrency(selectedOrder.total)}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/42">Delivery</div>
                  <div className="mt-2 text-sm font-semibold text-white">{selectedOrder.delivery_method || "Not set"}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/42">Items</div>
                  <div className="mt-2 text-xl font-semibold text-white">{formatNumber(selectedOrder.items.length)}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span>Status</span>
                  <select
                    value={selectedOrder.status}
                    disabled={savingOrderId === selectedOrder.id || viewerRole === "cashier"}
                    onChange={(event) =>
                      void updateOrder(selectedOrder, { status: event.target.value as OrderStatus })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-white outline-none"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Payment status</span>
                  <select
                    value={selectedOrder.payment_status || "PENDING"}
                    disabled={savingOrderId === selectedOrder.id || viewerRole === "cashier"}
                    onChange={(event) =>
                      void updateOrder(selectedOrder, {
                        payment_status: event.target.value as OrderPaymentStatus,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-white outline-none"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-2 text-sm text-white/70 block">
                <span>Admin note</span>
                <textarea
                  rows={3}
                  defaultValue={selectedOrder.admin_note || ""}
                  disabled={viewerRole === "cashier"}
                  onBlur={(event) =>
                    void updateOrder(selectedOrder, {
                      admin_note: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  placeholder="Internal note for fulfilment, rider coordination, payment follow-up"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/72">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/42">Customer</div>
                  <div className="mt-2">{selectedOrder.customer_name || "No name"}</div>
                  <div className="mt-1">{selectedOrder.customer_phone || "No phone"}</div>
                  <div className="mt-1">{selectedOrder.customer_email || "No email"}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/72">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/42">Delivery and payment</div>
                  <div className="mt-2">Method: {selectedOrder.delivery_method || "Not set"}</div>
                  <div className="mt-1">Payment: {selectedOrder.payment_method || "Not set"}</div>
                  <div className="mt-1">Address: {selectedOrder.address_text || "Not set"}</div>
                </div>
              </div>

              <Surface>
                <SurfaceHeader title="Order items" />
                <div className="overflow-x-auto px-2 py-2 sm:px-3">
                  {selectedOrder.items.length === 0 ? (
                    <div className="px-3 py-3">
                      <EmptyState
                        title="No item lines"
                        description="This row has no normalized line items. It may be a legacy shape."
                      />
                    </div>
                  ) : (
                    <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                      <thead className="text-white/42">
                        <tr>
                          <th className="px-4 py-2 font-medium">Product</th>
                          <th className="px-4 py-2 font-medium">Qty</th>
                          <th className="px-4 py-2 font-medium">Price</th>
                          <th className="px-4 py-2 font-medium">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => {
                          const qty = Number(item.qty || 0);
                          const price = Number(item.price || 0);
                          return (
                            <tr key={`${item.productId || item.product_id || "line"}-${index}`} className="rounded-2xl bg-white/4">
                              <td className="rounded-l-2xl px-4 py-4 text-white/75">
                                {item.name || item.productId || item.product_id || "Unknown item"}
                              </td>
                              <td className="px-4 py-4 text-white">{formatNumber(qty)}</td>
                              <td className="px-4 py-4 text-white/75">{price ? formatCurrency(price) : "N/A"}</td>
                              <td className="rounded-r-2xl px-4 py-4 text-white font-semibold">
                                {price ? formatCurrency(price * qty) : "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </Surface>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
