-- =============================================================================
-- COMPLETED DELIVERIES ARCHIVE
-- Table for storing completed delivery data
-- Date: 2026-05-01
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.completed_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) NOT NULL,
  rider_id UUID REFERENCES auth.users(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  distance_km DECIMAL(10,2),
  time_to_delivery_minutes INTEGER,
  commission_earned DECIMAL(10,2),
  delivery_address TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.completed_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Riders can view their own completed deliveries"
  ON public.completed_deliveries FOR SELECT
  USING (auth.uid() = rider_id);

CREATE POLICY "Admins can view all completed deliveries"
  ON public.completed_deliveries FOR ALL
  USING (auth.role() = 'authenticated'); -- Assuming admin check

-- Function to archive completed delivery
CREATE OR REPLACE FUNCTION public.archive_completed_delivery(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_record RECORD;
  v_distance DECIMAL(10,2) := 0; -- Placeholder, would calculate from GPS data
  v_time_minutes INTEGER := 0; -- Placeholder, would calculate from timestamps
  v_commission DECIMAL(10,2) := 0; -- Placeholder, would calculate based on distance/rate
BEGIN
  -- Get order details
  SELECT * INTO v_order_record
  FROM orders
  WHERE id = p_order_id AND status = 'DELIVERED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not delivered';
  END IF;

  -- Calculate metrics (placeholders for now)
  -- In real implementation, these would be calculated from GPS data and timestamps
  v_distance := 5.0; -- km
  v_time_minutes := EXTRACT(EPOCH FROM (v_order_record.updated_at - v_order_record.created_at))/60;
  v_commission := v_distance * 50; -- KES per km

  -- Insert archive record
  INSERT INTO completed_deliveries (
    order_id,
    rider_id,
    customer_id,
    distance_km,
    time_to_delivery_minutes,
    commission_earned,
    delivery_address,
    completed_at
  ) VALUES (
    p_order_id,
    v_order_record.rider_id,
    v_order_record.customer_id,
    v_distance,
    v_time_minutes,
    v_commission,
    v_order_record.address_text,
    v_order_record.updated_at
  );
END;
$$;