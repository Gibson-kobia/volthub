-- =============================================================================
-- BALE LOGIC MIGRATION - KENYAN WHOLESALE PACKAGING
-- Adds packet_size and units_per_bale columns to products table
-- Supports the "24kg Rule": 1kg packets (24 per bale), 2kg packets (12 per bale)
-- Migration date: 2026-04-22
-- =============================================================================

-- Add columns to products table for wholesale bale packaging
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS packet_size TEXT DEFAULT '1kg' COMMENT 'Packet/unit size, e.g., "1kg", "2kg", "500g"',
ADD COLUMN IF NOT EXISTS units_per_bale INTEGER DEFAULT 24 COMMENT 'Number of units per bale following Kenyan market rules',
ADD COLUMN IF NOT EXISTS stock_bales INTEGER DEFAULT 0 COMMENT 'Wholesale inventory tracked in bales, not individual units',
ADD COLUMN IF NOT EXISTS wholesale_price_per_bale NUMERIC(10, 2) COMMENT 'Price per complete bale in KES',
ADD COLUMN IF NOT EXISTS is_bale_product BOOLEAN DEFAULT FALSE COMMENT 'Flag to indicate if product uses bale-based wholesale pricing';

-- Add index for bale-based queries
CREATE INDEX IF NOT EXISTS idx_products_is_bale_product ON public.products(is_bale_product);
CREATE INDEX IF NOT EXISTS idx_products_packet_size ON public.products(packet_size);

-- Update existing retail products to have default bale settings
-- This ensures backward compatibility
UPDATE public.products 
SET 
  packet_size = '1kg',
  units_per_bale = 24,
  is_bale_product = TRUE
WHERE 
  category_id IN (
    SELECT id FROM public.categories 
    WHERE slug IN ('flour', 'rice', 'staples', 'condiments', 'essentials')
  )
  AND is_bale_product IS FALSE;

-- Add helper comment documenting the bale logic
COMMENT ON TABLE public.products IS 
'Canvus Wholesale Catalog - All products can be retail or wholesale. Wholesale uses bale-based packaging per Kenyan market standards. 
Formula: Total Weight per Bale = packet_size * units_per_bale
Examples: 1kg × 24 = 24kg bale, 2kg × 12 = 24kg bale, 500g × 40 = 20kg bale';

-- Create a view for wholesale inventory summary
CREATE OR REPLACE VIEW public.wholesale_inventory_summary AS
SELECT 
  p.id,
  p.name,
  p.brand,
  p.packet_size,
  p.units_per_bale,
  p.stock_bales,
  (p.stock_bales * p.units_per_bale) as total_packets,
  (p.stock_bales * (CAST(p.packet_size as NUMERIC) / 1)) as total_weight_kg,
  p.wholesale_price_per_bale,
  CASE 
    WHEN p.stock_bales > 10 THEN 'high_stock'
    WHEN p.stock_bales > 3 THEN 'medium_stock'
    WHEN p.stock_bales > 0 THEN 'low_stock'
    ELSE 'out_of_stock'
  END as stock_status,
  p.retail_price,
  (p.wholesale_price_per_bale / NULLIF(p.units_per_bale, 0)) as price_per_packet,
  c.name as category_name
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE p.is_bale_product = TRUE
  AND p.is_active = TRUE
ORDER BY c.name, p.brand, p.name;

-- Create audit log for bale inventory changes
CREATE TABLE IF NOT EXISTS public.bale_inventory_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  bales_quantity_before INTEGER,
  bales_quantity_after INTEGER,
  bales_change INTEGER,
  operation_type TEXT CHECK (operation_type IN ('inbound', 'sale', 'adjustment', 'return')),
  order_id UUID REFERENCES public.orders(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bale_inventory_audit_product_id ON public.bale_inventory_audit(product_id);
CREATE INDEX IF NOT EXISTS idx_bale_inventory_audit_created_at ON public.bale_inventory_audit(created_at);

-- Insert initial bale inventory audit trigger function
CREATE OR REPLACE FUNCTION update_bale_inventory_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_bales IS DISTINCT FROM NEW.stock_bales THEN
    INSERT INTO public.bale_inventory_audit (
      product_id,
      bales_quantity_before,
      bales_quantity_after,
      bales_change,
      operation_type,
      notes
    ) VALUES (
      NEW.id,
      OLD.stock_bales,
      NEW.stock_bales,
      NEW.stock_bales - OLD.stock_bales,
      'adjustment',
      'Bale count adjustment'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to audit bale changes
DROP TRIGGER IF EXISTS trigger_bale_inventory_audit ON public.products;
CREATE TRIGGER trigger_bale_inventory_audit
AFTER UPDATE OF stock_bales ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_bale_inventory_audit();
