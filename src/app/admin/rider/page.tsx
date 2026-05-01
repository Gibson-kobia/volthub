"use client";

import { motion, AnimatePresence } from "framer-motion";
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

const ACTIVE_STATUSES = ["PREPARING", "WITH_RIDER", "DISPATCHED"];

export default function AdminRiderPage() {
  const supabase = getSupabase();
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [staffStoreCode, setStaffStoreCode] = useState<string>("main");
  const [staff, setStaff] = useState<any>(null);

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
        if (active) {
          setStaffStoreCode(storeCode);
          setStaff(staff);
        }

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

  const claimOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('claim_delivery_order', {
        p_order_id: orderId,
        p_rider_id: staff?.id
      });
      if (error) throw error;
      // Refresh orders
      await loadData();
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      await loadData();
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    }
  };

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

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Available deliveries" value={formatNumber(summary.preparing)} tone="blue" />
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
            orders.map((order, index) => {
              const statusMeta = getOrderStatusMeta(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">Order {order.id.slice(0, 8)}</div>
                      <div className="mt-1 text-xs text-white/55">
                        {order.customer_name || "Customer"} · {order.customer_phone || "No phone"}
                      </div>
                      <div className="mt-2 text-xs text-white/55">
                        Created {formatDateTime(order.created_at)} · Updated {formatCompactDate(order.updated_at || order.created_at)}
                      </div>
                      {order.delivery_method && (
                        <div className="mt-1 text-xs text-white/55">
                          {order.delivery_method} to {order.address_text}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                      {order.status === "PREPARING" && (
                        <button
                          onClick={() => claimOrder(order.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        >
                          Accept Delivery
                        </button>
                      )}
                      {order.status === "WITH_RIDER" && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => updateOrderStatus(order.id, 'DISPATCHED')}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          >
                            I Have Arrived
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            Order Handed Over
                          </button>
                          <a
                            href={`https://wa.me/${order.customer_phone}`}
                            target="_blank"
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded text-center"
                          >
                            WhatsApp
                          </a>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(order.address_text || '')}`}
                            target="_blank"
                            className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded text-center"
                          >
                            Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Surface>
    </div>
  );
}
