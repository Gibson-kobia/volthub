export type CategorySlug =
  | "audio"
  | "smartwatches"
  | "chargers-cables"
  | "power-banks"
  | "phone-accessories"
  | "speakers"
  | "groceries"
  | "beverages"
  | "household"
  | "snacks"
  | "personal-care"
  | "electronics";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  priceKes: number; // Frontend uses this
  image: string;    // Frontend uses this
  description: string;
  stock: number;
  rating: number;
  reviewsCount: number; // Frontend uses this
  is_active?: boolean;
};

// Database representation of a Product
export type DBProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image_url: string;
  description: string;
  stock: number;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  sku?: string | null;
  barcode?: string | null;
  cost_price?: number | null;
  reorder_level?: number | null;
  supplier_name?: string | null;
  is_archived?: boolean | null;
  archived_at?: string | null;
  track_inventory?: boolean | null;
  store_code?: string | null;
  seller_id?: string; // Added for RLS
  created_at?: string;
  updated_at?: string;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'WITH_RIDER' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export type OrderItem = {
  productId?: string;
  product_id?: string;
  qty: number;
  name?: string;
  price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
};

export type OrderPaymentMethod = 'mpesa' | 'cash' | 'card' | 'bank_transfer' | 'delivery' | 'mixed';

export type OrderPaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | 'FAILED';

export type Order = {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  items: OrderItem[]; // Stored as JSONB in DB
  total: number;
  delivery_method: string;
  status: OrderStatus;
  payment_method?: OrderPaymentMethod | string | null;
  payment_status?: OrderPaymentStatus | string | null;
  order_source?: string | null;
  address_text?: string | null;
  delivery_location?: {
    latitude: number;
    longitude: number;
    addressLabel?: string;
    deliveryMethod?: string;
  } | null;
  admin_note?: string | null;
  created_at: string;
  updated_at?: string;
  fulfilled_at?: string | null;
  store_code?: string | null;
};

export type InventoryMovementType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'SALE'
  | 'RETURN'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'WASTAGE';

export type InventoryMovement = {
  id: string;
  product_id: string;
  movement_type: InventoryMovementType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string | null;
  notes?: string | null;
  actor_user_id?: string | null;
  actor_email?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  store_code?: string | null;
  created_at: string;
};

export type StaffRole = 'super_admin' | 'store_admin' | 'inventory_manager' | 'cashier';

export type StaffProfile = {
  id: string;
  user_id?: string | null;
  email: string;
  full_name?: string | null;
  role: StaffRole;
  store_code?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StoreSettings = {
  id?: string;
  store_code?: string | null;
  store_name?: string | null;
  public_brand_name?: string | null;
  support_phone?: string | null;
  support_email?: string | null;
  physical_address?: string | null;
  business_hours?: Record<string, string> | null;
  delivery_defaults?: Record<string, string | number | boolean> | null;
  admin_preferences?: Record<string, string | number | boolean> | null;
  low_stock_default?: number | null;
  currency_code?: string | null;
  timezone_name?: string | null;
  updated_at?: string;
};

export type StoreSale = {
  id: string;
  sale_number?: string | null;
  customer_name?: string | null;
  operator_email?: string | null;
  payment_method?: OrderPaymentMethod | string | null;
  payment_status?: OrderPaymentStatus | string | null;
  subtotal?: number | null;
  total: number;
  gross_profit_estimate?: number | null;
  notes?: string | null;
  store_code?: string | null;
  created_at: string;
};

export type StoreSaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku?: string | null;
  barcode?: string | null;
  quantity: number;
  unit_price: number;
  cost_price?: number | null;
  line_total: number;
  created_at?: string;
};
