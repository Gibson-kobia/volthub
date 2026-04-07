import {
  DBProduct,
  InventoryMovement,
  InventoryMovementType,
  Order,
  OrderItem,
  OrderPaymentStatus,
  OrderStatus,
  StaffRole,
} from "./types";

export const CATEGORY_OPTIONS = [
  "electronics",
  "audio",
  "smartwatches",
  "chargers-cables",
  "power-banks",
  "phone-accessories",
  "speakers",
  "groceries",
  "beverages",
  "household",
  "snacks",
  "personal-care",
] as const;

export const ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "WITH_RIDER",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
];

export const PAYMENT_STATUSES: OrderPaymentStatus[] = [
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "REFUNDED",
  "FAILED",
];

export const INVENTORY_MOVEMENT_TYPES: InventoryMovementType[] = [
  "STOCK_IN",
  "STOCK_OUT",
  "ADJUSTMENT",
  "SALE",
  "RETURN",
  "DAMAGED",
  "EXPIRED",
  "WASTAGE",
];

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super admin",
  store_admin: "Store admin",
  cashier: "Cashier",
  rider: "Rider",
};

export function formatCurrency(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(
    Number.isFinite(numeric) ? numeric : 0
  );
}

export function formatCompactDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function extractSupabaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }
  return "Unknown Supabase error.";
}

export function normalizeOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const qty = Number(row.qty ?? row.quantity ?? 0);
      const productId = String(row.productId ?? row.product_id ?? "").trim();
      const name = typeof row.name === "string" ? row.name : undefined;
      const price = row.price === undefined ? undefined : Number(row.price);
      const costPrice = row.cost_price === undefined ? undefined : Number(row.cost_price);
      const sku = typeof row.sku === "string" ? row.sku : undefined;
      const barcode = typeof row.barcode === "string" ? row.barcode : undefined;

      if (!qty || qty < 0) return null;

      return {
        productId: productId || undefined,
        product_id: productId || undefined,
        qty,
        name,
        price: Number.isFinite(price) ? price : undefined,
        cost_price: Number.isFinite(costPrice) ? costPrice : undefined,
        sku,
        barcode,
      } satisfies OrderItem;
    })
    .filter(Boolean) as OrderItem[];
}

export function getProductReorderLevel(product: Partial<DBProduct>) {
  const threshold = Number(product.reorder_level ?? 8);
  return Number.isFinite(threshold) && threshold >= 0 ? threshold : 8;
}

export function getProductStockValue(product: Partial<DBProduct>) {
  const stock = Number(product.stock ?? 0);
  return Number.isFinite(stock) ? stock : 0;
}

export function getInventoryStatus(product: Partial<DBProduct>) {
  const stock = getProductStockValue(product);
  const reorderLevel = getProductReorderLevel(product);

  if (stock <= 0) {
    return {
      tone: "critical",
      label: "Out of stock",
      description: "Not available for sale until replenished.",
    };
  }

  if (stock <= reorderLevel) {
    return {
      tone: "warning",
      label: "Low stock",
      description: `Below reorder level of ${formatNumber(reorderLevel)}.`,
    };
  }

  return {
    tone: "ok",
    label: "Healthy",
    description: "Stock is above reorder threshold.",
  };
}

export function getMissingProductFields(product: Partial<DBProduct>) {
  const missing: string[] = [];
  if (!product.image_url) missing.push("image");
  if (!product.brand) missing.push("brand");
  if (!product.sku && !product.barcode) missing.push("SKU/barcode");
  if (product.cost_price === null || product.cost_price === undefined) missing.push("cost price");
  if (product.reorder_level === null || product.reorder_level === undefined) missing.push("reorder level");
  return missing;
}

export function getOrderStatusMeta(status?: string | null) {
  const value = (status || "NEW").toUpperCase();

  const map: Record<string, { label: string; tone: string }> = {
    NEW: { label: "New", tone: "sky" },
    CONFIRMED: { label: "Confirmed", tone: "indigo" },
    PREPARING: { label: "Preparing", tone: "amber" },
    WITH_RIDER: { label: "With rider", tone: "violet" },
    DISPATCHED: { label: "Dispatched", tone: "violet" },
    DELIVERED: { label: "Delivered", tone: "emerald" },
    CANCELLED: { label: "Cancelled", tone: "zinc" },
  };

  return map[value] || { label: value.replaceAll("_", " "), tone: "zinc" };
}

export function getPaymentStatusMeta(status?: string | null) {
  const value = (status || "PENDING").toUpperCase();

  const map: Record<string, { label: string; tone: string }> = {
    PENDING: { label: "Pending", tone: "amber" },
    PARTIALLY_PAID: { label: "Partially paid", tone: "sky" },
    PAID: { label: "Paid", tone: "emerald" },
    REFUNDED: { label: "Refunded", tone: "violet" },
    FAILED: { label: "Failed", tone: "rose" },
  };

  return map[value] || { label: value.replaceAll("_", " "), tone: "zinc" };
}

export function getMovementMeta(type?: string | null) {
  const value = (type || "ADJUSTMENT").toUpperCase();
  const map: Record<string, { label: string; tone: string }> = {
    STOCK_IN: { label: "Stock in", tone: "emerald" },
    STOCK_OUT: { label: "Stock out", tone: "rose" },
    ADJUSTMENT: { label: "Adjustment", tone: "sky" },
    SALE: { label: "Sale", tone: "indigo" },
    RETURN: { label: "Return", tone: "violet" },
    DAMAGED: { label: "Damaged", tone: "amber" },
    EXPIRED: { label: "Expired", tone: "amber" },
    WASTAGE: { label: "Wastage", tone: "rose" },
  };
  return map[value] || { label: value.replaceAll("_", " "), tone: "zinc" };
}

export function getProductSearchText(product: Partial<DBProduct>) {
  return [product.name, product.slug, product.brand, product.category, product.sku, product.barcode]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function sumOrderRevenue(orders: Order[], predicate?: (order: Order) => boolean) {
  return orders.reduce((total, order) => {
    if (predicate && !predicate(order)) return total;
    if (order.status === "CANCELLED") return total;
    return total + Number(order.total || 0);
  }, 0);
}

export function buildSalesTrend(orders: Order[], days = 7) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-KE", { weekday: "short" }).format(date),
      revenue: 0,
      orders: 0,
    };
  });

  const lookup = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  orders.forEach((order) => {
    if (order.status === "CANCELLED") return;
    const key = new Date(order.created_at).toISOString().slice(0, 10);
    const target = lookup.get(key);
    if (!target) return;
    target.revenue += Number(order.total || 0);
    target.orders += 1;
  });

  return buckets;
}

export function buildTopSellingProducts(orders: Order[], products: DBProduct[], limit = 5) {
  const totals = new Map<string, { qty: number; revenue: number; name: string; id: string }>();
  const lookup = new Map(products.map((product) => [product.id, product]));

  orders.forEach((order) => {
    if (order.status === "CANCELLED") return;

    normalizeOrderItems(order.items).forEach((item) => {
      const productId = item.productId || item.product_id;
      if (!productId) return;
      const product = lookup.get(productId);
      const current = totals.get(productId) || {
        id: productId,
        name: item.name || product?.name || "Unknown product",
        qty: 0,
        revenue: 0,
      };
      current.qty += Number(item.qty || 0);
      current.revenue += Number(item.price || product?.price || 0) * Number(item.qty || 0);
      totals.set(productId, current);
    });
  });

  return Array.from(totals.values())
    .sort((left, right) => right.qty - left.qty)
    .slice(0, limit);
}

export function estimateGrossProfit(orders: Order[], products: DBProduct[]) {
  const productCosts = new Map(products.map((product) => [product.id, Number(product.cost_price ?? 0)]));
  let grossProfit = 0;
  let coveredLines = 0;
  let uncoveredLines = 0;

  orders.forEach((order) => {
    if (order.status === "CANCELLED") return;
    normalizeOrderItems(order.items).forEach((item) => {
      const productId = item.productId || item.product_id;
      const price = Number(item.price ?? 0);
      const qty = Number(item.qty ?? 0);
      const cost = item.cost_price ?? (productId ? productCosts.get(productId) : undefined);
      if (cost === undefined || cost === null || Number.isNaN(Number(cost))) {
        uncoveredLines += qty;
        return;
      }
      coveredLines += qty;
      grossProfit += (price - Number(cost)) * qty;
    });
  });

  return {
    grossProfit,
    coveredLines,
    uncoveredLines,
  };
}

export function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function sortMovementsByNewest(movements: InventoryMovement[]) {
  return [...movements].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}