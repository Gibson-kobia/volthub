-- =============================================================================
-- RIDER DELIVERY CLAIM SYSTEM
-- Create RPC for first-to-accept delivery assignment
-- Date: 2026-05-01
-- =============================================================================

-- RPC to claim a delivery order (first-to-accept logic)
CREATE OR REPLACE FUNCTION public.claim_delivery_order(p_order_id UUID, p_rider_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_assigned_rider UUID;
BEGIN
  -- Check current status
  SELECT status, rider_id INTO v_current_status, v_assigned_rider
  FROM orders
  WHERE id = p_order_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_current_status != 'PREPARING' THEN
    RAISE EXCEPTION 'Order is not available for claiming';
  END IF;

  IF v_assigned_rider IS NOT NULL THEN
    RAISE EXCEPTION 'Order already claimed by another rider';
  END IF;

  -- Claim the order atomically
  UPDATE orders
  SET status = 'WITH_RIDER',
      rider_id = p_rider_id,
      updated_at = NOW()
  WHERE id = p_order_id AND status = 'PREPARING' AND rider_id IS NULL;

  -- Check if update succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to claim order - may have been taken by another rider';
  END IF;

  RETURN TRUE;
END;
$$;