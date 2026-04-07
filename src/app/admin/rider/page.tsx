"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader, Badge, EmptyState, MetricCard, Surface, SurfaceHeader } from "@/components/admin/admin-ui";
import {
  extractSupabaseErrorMessage,
  formatCompactDate,
  formatDateTime,
  formatNumber,
  getOrderStatusMeta,
  normalizeOrderItems,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { getActiveStaffByEmail } from "@/lib/access-control";
import type { Order } from "@/lib/types";

type RiderOrder = Order & {
  items: ReturnType<typeof normalizeOrderItems>;
};

const ACTIVE_STATUSES = ["WITH_RIDER", "DISPATCHED"];

export default function AdminRiderPage() {
  const supabase = getSupabase();
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [staffStoreCode, setStaffStoreCode] = useState<string>("main");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setWarning(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const staff = await getActiveStaffByEmail(supabase, session?.user.email || null);
        const storeCode = staff?.store_code || "main";
        if (active) setStaffStoreCode(storeCode);

        const query = supabase
          .from("orders")
          .select("*")
          .in("status", ACTIVE_STATUSES)
          .order("created_at", { ascending: false })
          .limit(200);

        const scopedQuery = staff?.role === "super_admin" ? query : query.eq("store_code", storeCode);
        const { data, error } = await scopedQuery;
        if (error) throw error;

        if (!active) return;
        const mapped = ((data || []) as Order[]).map((order) => ({
          ...order,
          items: normalizeOrderItems(order.items),
        }));
        setOrders(mapped);
      } catch (error) {
        if (!active) return;
        setWarning(extractSupabaseErrorMessage(error));
        setOrders([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [supabase]);

  const summary = useMemo(() => {
    const withRider = orders.filter((order) => order.status === "WITH_RIDER").length;
    const dispatched = orders.filter((order) => order.status === "DISPATCHED").length;
    return {
      active: orders.length,
      withRider,
      dispatched,
    };
  }, [orders]);

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
        eyebrow="Rider operations"
        title="Assigned delivery queue"
        description="Track orders that are with riders or already dispatched. Scope is limited by the rider/store assignment."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active deliveries" value={formatNumber(summary.active)} tone="sky" />
        <MetricCard label="With rider" value={formatNumber(summary.withRider)} tone="indigo" />
        <MetricCard label="Dispatched" value={formatNumber(summary.dispatched)} tone="emerald" />
      </div>

      <Surface>
        <SurfaceHeader
          title="Current queue"
          description={`Store scope: ${staffStoreCode}`}
          action={<Badge tone="sky">Rider view</Badge>}
        />
        {warning ? (
          <div className="px-5 py-5 text-sm text-amber-100/90 sm:px-6">{warning}</div>
        ) : null}
        <div className="space-y-3 px-5 py-5 sm:px-6">
          {orders.length === 0 ? (
            <EmptyState title="No active delivery orders" description="Orders in WITH_RIDER or DISPATCHED state appear here." />
          ) : (
            orders.map((order) => {
              const statusMeta = getOrderStatusMeta(order.status);
              return (
                <div key={order.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">Order {order.id.slice(0, 8)}</div>
                      <div className="mt-1 text-xs text-white/55">
                        {order.customer_name || "Customer"} · {order.customer_phone || "No phone"}
                      </div>
                      <div className="mt-2 text-xs text-white/55">
                        Created {formatDateTime(order.created_at)} · Updated {formatCompactDate(order.updated_at || order.created_at)}
                      </div>
                    </div>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Surface>
    </div>
  );
}
