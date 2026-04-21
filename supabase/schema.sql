-- =============================================================================
-- CANVUS WHOLESALE E-COMMERCE SCHEMA
-- Complete database setup for hybrid B2B/B2C commerce platform
-- Ngundune, Meru - 2026
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- =============================================================================
-- AUTHENTICATION & PROFILES
-- =============================================================================

-- Extend auth.users metadata for customer profiles
-- Note: Auth users created via Supabase Auth automatically get an entry in auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT UNIQUE,
  
  -- Account Type
  account_type TEXT DEFAULT 'retail' CHECK (account_type IN ('retail', 'school', 'wholesaler', 'bulk_buyer')),
  
  -- School/Wholesale fields
  school_name TEXT,
  school_code TEXT UNIQUE, -- e.g., "MERU001"
  business_name TEXT,
  business_registration TEXT,
  tin_number TEXT,
  
  -- Address & Location
  county TEXT DEFAULT 'Meru',
  sub_county TEXT,
  location TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  
  -- Status & Verification
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_notes TEXT,
  
  -- Preferences
  preferred_delivery_method TEXT CHECK (preferred_delivery_method IN ('pickup', 'delivery', 'both')),
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('sms', 'whatsapp', 'email')),
  notification_opt_in BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- STAFF & ADMIN SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  
  -- Role-based access control
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'store_admin', 'cashier', 'rider')),
  
  -- Store assignment (for multi-store support)
  store_code TEXT DEFAULT 'main' CHECK (store_code IN ('main', 'volthub')),
  
  -- Permissions & Status
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}', -- Additional granular permissions
  
  -- Contact
  phone_number TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(user_id, store_code)
);

-- Indexes for staff lookup
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON public.staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_email ON public.staff_profiles(email);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON public.staff_profiles(role);

-- =============================================================================
-- PRODUCT CATALOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  brand TEXT,
  
  -- Categorization
  category_id UUID NOT NULL REFERENCES public.categories(id),
  sub_category TEXT,
  
  -- Pricing (Retail)
  retail_price NUMERIC(10, 2) NOT NULL,
  retail_unit TEXT DEFAULT '1 unit', -- e.g., "1kg", "Single", "Pack"
  
  -- Wholesale Pricing (linked table)
  -- See wholesale_prices table below
  
  -- Image & Media
  image_url TEXT,
  images JSONB DEFAULT '[]', -- Array of image URLs
  
  -- Inventory (retail)
  retail_stock INTEGER DEFAULT 0,
  
  -- Wholesale Inventory (linked table)
  -- See inventory_tracking table below
  
  -- SKU & Tracking
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  
  -- Cost & Margin
  cost_price NUMERIC(10, 2),
  supplier_id UUID,
  
  -- Stock Management
  reorder_level INTEGER DEFAULT 10,
  track_inventory BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  
  -- Store scope (multi-store)
  store_code TEXT DEFAULT 'main',
  
  -- Seller (for multi-vendor future)
  seller_id UUID REFERENCES auth.users(id),
  
  -- Reviews & Ratings
  avg_rating NUMERIC(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for product search
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);

-- =============================================================================
-- WHOLESALE PRICING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wholesale_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Bulk tier pricing
  tier_level TEXT NOT NULL CHECK (tier_level IN ('tier1', 'tier2', 'tier3', 'school', 'bulk_buyer')),
  
  -- Pricing
  unit_price NUMERIC(10, 2) NOT NULL,
  bulk_quantity_min INTEGER NOT NULL, -- Minimum units to get this price
  bulk_quantity_max INTEGER, -- NULL = unlimited
  bulk_unit TEXT NOT NULL, -- e.g., "50kg Sack", "Bale of 12", "Carton"
  weight_per_unit NUMERIC(8, 2), -- kg per bulk unit
  
  -- Margin & Cost
  cost_per_bulk_unit NUMERIC(10, 2),
  margin_percent NUMERIC(5, 2),
  
  -- Active period
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(product_id, tier_level, bulk_quantity_min)
);

CREATE INDEX IF NOT EXISTS idx_wholesale_prices_product_id ON public.wholesale_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_prices_tier_level ON public.wholesale_prices(tier_level);

-- =============================================================================
-- INVENTORY TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  
  -- Location
  store_code TEXT DEFAULT 'main',
  warehouse_location TEXT,
  
  -- Stock Levels
  wholesale_stock INTEGER DEFAULT 0, -- Bulk units in stock
  retail_stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  
  -- Reorder
  reorder_level INTEGER DEFAULT 5,
  last_reorder_date TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(product_id, store_code)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory_tracking(product_id);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound', 'sale', 'return', 'adjustment', 'loss')),
  quantity_change INTEGER NOT NULL,
  quantity_unit TEXT, -- e.g., "units", "kg", "cartons"
  
  -- Reference
  reference_type TEXT CHECK (reference_type IN ('order', 'purchase', 'adjustment', 'note')),
  reference_id UUID,
  
  -- Notes
  notes TEXT,
  
  -- Actor
  created_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at);

-- =============================================================================
-- ORDERS & ORDER ITEMS
-- =============================================================================

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'with_rider',
  'delivered',
  'cancelled'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'partially_paid',
  'paid',
  'overpaid',
  'refunded',
  'failed'
);

CREATE TYPE public.payment_method AS ENUM (
  'mpesa',
  'cash',
  'card',
  'bank_transfer'
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Customer info
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  
  -- Customer type
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'school', 'wholesaler', 'bulk_buyer')),
  
  -- Order details
  order_number TEXT UNIQUE NOT NULL, -- e.g., "ORD-2026-04-001"
  order_source TEXT DEFAULT 'app' CHECK (order_source IN ('app', 'phone', 'walk_in', 'admin')),
  
  -- Status
  status public.order_status DEFAULT 'pending',
  payment_status public.payment_status DEFAULT 'pending',
  
  -- Totals
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  delivery_fee NUMERIC(12, 2) DEFAULT 0,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  
  -- Delivery
  delivery_method TEXT CHECK (delivery_method IN ('pickup', 'delivery')),
  delivery_location JSONB, -- { latitude, longitude, address }
  delivery_address_text TEXT,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  payment_method public.payment_method,
  payment_notes TEXT,
  
  -- Rider assignment
  rider_id UUID REFERENCES auth.users(id),
  
  -- Admin notes
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  
  -- Product snapshot (in case product is deleted)
  product_name TEXT NOT NULL,
  product_brand TEXT,
  product_sku TEXT,
  
  -- Quantity & pricing
  quantity INTEGER NOT NULL,
  quantity_unit TEXT, -- e.g., "50kg Sack", "Single", "Carton"
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,
  
  -- Discount
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- =============================================================================
-- PAYMENT TRACKING (M-Pesa & Till Number)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mpesa_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- M-Pesa transaction
  mpesa_reference TEXT UNIQUE, -- STK push reference / checkout request ID
  merchant_request_id TEXT,
  
  -- Order link
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Customer details
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  
  -- Payment info
  amount_requested NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  
  -- Status
  payment_status public.payment_status DEFAULT 'pending',
  mpesa_status_code TEXT, -- e.g., "0" for success, "1" for cancelled
  mpesa_status_message TEXT, -- e.g., "The service request has been accepted for processing"
  
  -- Till/Buy Goods (for POS)
  till_number TEXT,
  business_short_code TEXT,
  
  -- Callback details
  result_code TEXT,
  result_description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE, -- Time payment was made
  mpesa_receipt_number TEXT,
  
  -- Internal tracking
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mpesa_payments_order_id ON public.mpesa_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_customer_phone ON public.mpesa_payments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_status ON public.mpesa_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_created_at ON public.mpesa_payments(created_at);

-- =============================================================================
-- RETURNS & REFUNDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.order_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  
  -- Return details
  return_number TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  reason_details TEXT,
  
  -- Items
  items JSONB NOT NULL, -- Array of { product_id, quantity, unit_price, reason }
  
  -- Refund
  refund_amount NUMERIC(12, 2) NOT NULL,
  refund_method TEXT CHECK (refund_method IN ('mpesa', 'cash', 'credit')),
  refund_status TEXT DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processed', 'failed')),
  refund_reference TEXT,
  
  -- Status
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'processed')),
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_returns_order_id ON public.order_returns(order_id);

-- =============================================================================
-- CUSTOMER REVIEWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Review content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Meta
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read/write their own profile
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_self_write" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CATEGORIES: Anyone can read active categories
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (is_active = TRUE);

-- PRODUCTS: Anyone can read active products
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = TRUE);

-- STAFF_PROFILES: Only super_admin can read/write
CREATE POLICY "staff_profiles_super_admin_read" ON public.staff_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "staff_profiles_super_admin_write" ON public.staff_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ORDERS: Users can read their own orders, admins can read all
CREATE POLICY "orders_user_read" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_admin_read" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.user_id = auth.uid() AND role IN ('super_admin', 'store_admin', 'cashier')
    )
  );

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (true); -- Anyone can create orders

CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.user_id = auth.uid() AND role IN ('super_admin', 'store_admin', 'cashier')
    )
  );

-- ORDER_ITEMS: Inherit from orders
CREATE POLICY "order_items_read" ON public.order_items
  FOR SELECT USING (
    (auth.uid() IN (SELECT user_id FROM public.orders WHERE id = order_id))
    OR
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.user_id = auth.uid() AND role IN ('super_admin', 'store_admin', 'cashier')
    )
  );

-- MPESA_PAYMENTS: Users can read their own, admins can read all
CREATE POLICY "mpesa_payments_user_read" ON public.mpesa_payments
  FOR SELECT USING (
    (auth.uid() IN (SELECT user_id FROM public.orders WHERE id = order_id))
    OR
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.user_id = auth.uid() AND role IN ('super_admin', 'store_admin', 'cashier')
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Auto-generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_order_number TEXT;
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.orders
  WHERE created_at >= CURRENT_DATE;
  
  v_order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') || '-' || 
                    LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- Update product ratings based on reviews
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET 
    avg_rating = (
      SELECT AVG(rating)::NUMERIC(3, 2)
      FROM public.product_reviews
      WHERE product_id = NEW.product_id AND is_approved = TRUE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = NEW.product_id AND is_approved = TRUE
    ),
    updated_at = timezone('utc'::text, now())
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating();

-- Auto update product.updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER trigger_update_orders_timestamp
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER trigger_update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- SAMPLE DATA (Optional - Remove in production)
-- =============================================================================

-- Insert sample categories
INSERT INTO public.categories (name, slug, description, is_active, display_order)
VALUES 
  ('Staples', 'staples', 'Grains, flour, sugar and essential pantry items', true, 1),
  ('Oils & Fats', 'oils-fats', 'Cooking oils, butter, ghee', true, 2),
  ('Beverages', 'beverages', 'Drinks, water, juices', true, 3),
  ('Household', 'household', 'Cleaning supplies, detergents', true, 4),
  ('Personal Care', 'personal-care', 'Soaps, shampoos, toiletries', true, 5),
  ('Grains', 'grains', 'Rice, beans, maize', true, 6)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PRODUCTION NOTES
-- =============================================================================
-- 1. Before production, remove SAMPLE DATA section above
-- 2. Set up automated backups in Supabase settings
-- 3. Configure RLS policies based on your business requirements
-- 4. Create database roles for different applications (web app, mobile, admin)
-- 5. Enable Point-in-Time Recovery (PITR) for disaster recovery
-- 6. Monitor query performance and add indexes as needed
-- 7. Set up audit logging for sensitive operations
-- 8. Test all policies thoroughly with different user roles
