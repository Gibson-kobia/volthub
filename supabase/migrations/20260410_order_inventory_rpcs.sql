-- RPC functions for order operations with inventory management
-- Purpose:
-- 1) place_order_with_inventory: Atomically create order and manage stock deductions
-- 2) cancel_order_with_inventory: Atomically cancel order, fix payment_status, and restore inventory
-- 3) Ensures stock integrity and audit trail via inventory_movements table

begin;

-- ============================================================================
-- PLACE_ORDER_WITH_INVENTORY RPC
-- ============================================================================
-- Creates a new order and deducts stock for each item.
-- Returns success + order details or structured error.
-- 
-- Parameters:
--   p_customer_name: Customer name or null for guest
--   p_customer_phone: Customer phone number
--   p_customer_email: Customer email
--   p_items: JSONB array of {product_id, name, qty, price}
--   p_total: Order total in currency
--   p_delivery_method: e.g., 'delivery', 'pickup'
--   p_delivery_location: Optional JSONB with lat/long
--   p_address_text: Optional delivery address text
--   p_payment_method: e.g., 'mpesa', 'cash', 'card'
--   p_mpesa_phone: M-Pesa phone for payment tracking (optional)
--
-- Returns:
--   {
--     success: boolean,
--     order_id?: string,
--     error?: string (error code if failed)
--   }

create or replace function public.place_order_with_inventory(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_items jsonb,
  p_total numeric,
  p_delivery_method text,
  p_delivery_location jsonb,
  p_address_text text,
  p_payment_method text,
  p_mpesa_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item record;
  v_product record;
  v_stock_before integer;
  v_stock_after integer;
  v_total_price numeric;
begin
  -- Validate items array is not empty
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'no_items'
    );
  end if;

  -- Validate total amount
  if p_total <= 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'invalid_total'
    );
  end if;

  -- Validate delivery destination if delivery method specified
  if p_delivery_method = 'delivery' then
    if p_address_text is null and p_delivery_location is null then
      return jsonb_build_object(
        'success', false,
        'error', 'missing_delivery_destination'
      );
    end if;
  end if;

  -- Validate M-Pesa phone if payment method is mpesa
  if p_payment_method = 'mpesa' and (p_mpesa_phone is null or length(trim(p_mpesa_phone)) = 0) then
    return jsonb_build_object(
      'success', false,
      'error', 'missing_mpesa_phone'
    );
  end if;

  -- Check stock availability for all items first (fail-fast)
  for v_item in select jsonb_array_elements(p_items) as item loop
    v_product := null;
    
    select id, stock
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if v_product is null then
      return jsonb_build_object(
        'success', false,
        'error', 'product_not_found',
        'product_id', v_item->>'product_id'
      );
    end if;

    if (v_item->>'qty')::integer > v_product.stock then
      return jsonb_build_object(
        'success', false,
        'error', 'insufficient_stock'
      );
    end if;
  end loop;

  -- Create order record
  insert into public.orders (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    items,
    total,
    delivery_method,
    delivery_location,
    address_text,
    payment_method,
    payment_status,
    status,
    order_source
  ) values (
    auth.uid(),
    coalesce(trim(p_customer_name), 'Guest'),
    p_customer_phone,
    p_customer_email,
    p_items,
    p_total,
    p_delivery_method,
    p_delivery_location,
    p_address_text,
    p_payment_method,
    'PENDING',  -- All new orders start as PENDING payment
    'NEW',      -- All new orders start in NEW status
    'online'    -- RPC is used by online checkout; POS uses different flow
  )
  returning id into v_order_id;

  -- Deduct stock and create SALE inventory movements
  for v_item in select jsonb_array_elements(p_items) as item loop
    select id, stock, cost_price
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    v_stock_before := v_product.stock;
    v_stock_after := v_stock_before - (v_item->>'qty')::integer;

    -- Update product stock
    update public.products
    set stock = v_stock_after
    where id = v_product.id;

    -- Create inventory movement record (audit trail)
    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reason,
      reference_type,
      reference_id,
      actor_email,
      created_at
    ) values (
      v_product.id,
      'SALE',
      -(v_item->>'qty')::integer,
      v_stock_before,
      v_stock_after,
      'Order placed',
      'order',
      v_order_id::text,
      p_customer_email,
      now()
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id
  );

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlstate || ': ' || sqlerrm
  );
end $$;

-- ============================================================================
-- CANCEL_ORDER_WITH_INVENTORY RPC
-- ============================================================================
-- Cancels an order and restores its inventory.
-- FIXES payment_status based on current value (KEY FIX FOR THIS AUDIT).
-- Returns success or structured error.
--
-- Parameters:
--   p_order_id: UUID of order to cancel
--   p_admin_note: Admin note explaining cancellation
--
-- Returns:
--   {
--     success?: boolean,
--     status?: string ('CANCELLED' if successful),
--     error?: string (error code if failed)
--   }
--
-- Payment Status Transitions:
--   PENDING → FAILED (unpaid order was cancelled)
--   PARTIALLY_PAID → REFUNDED (partial payment, order cancelled)
--   PAID → REFUNDED (full payment, order cancelled, refund needed)
--   FAILED → FAILED (no change, already failed)
--   REFUNDED → REFUNDED (no change, already refunded)

create or replace function public.cancel_order_with_inventory(
  p_order_id uuid,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_product record;
  v_stock_before integer;
  v_stock_after integer;
  v_new_payment_status text;
begin
  -- Validate admin is authorized
  if not public.is_admin_email() then
    return jsonb_build_object(
      'success', false,
      'error', 'auth_required'
    );
  end if;

  -- Fetch order
  select * into v_order from public.orders where id = p_order_id;

  if v_order is null then
    return jsonb_build_object(
      'success', false,
      'error', 'order_not_found'
    );
  end if;

  -- Validate order is in cancellable status
  if v_order.status not in ('NEW', 'CONFIRMED') then
    return jsonb_build_object(
      'success', false,
      'error', 'order_not_cancellable'
    );
  end if;

  -- Validate order has items for restoration
  if v_order.items is null or jsonb_array_length(v_order.items) = 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'order_items_missing_for_cancellation'
    );
  end if;

  -- ========================================================================
  -- KEY FIX: Determine new payment_status based on current value
  -- ========================================================================
  v_new_payment_status := 'PENDING';  -- fallback default
  
  case v_order.payment_status
    when 'PENDING' then
      v_new_payment_status := 'FAILED';  -- Cancelled unpaid order
    when 'PARTIALLY_PAID' then
      v_new_payment_status := 'REFUNDED';  -- Partial payment + cancellation = refund needed
    when 'PAID' then
      v_new_payment_status := 'REFUNDED';  -- Full payment + cancellation = full refund needed
    when 'FAILED' then
      v_new_payment_status := 'FAILED';  -- Already failed, no change
    when 'REFUNDED' then
      v_new_payment_status := 'REFUNDED';  -- Already refunded, no change
    else
      v_new_payment_status := coalesce(v_order.payment_status, 'PENDING');  -- Unknown, keep current
  end case;

  -- Update order status and payment_status atomically
  update public.orders
  set
    status = 'CANCELLED',
    payment_status = v_new_payment_status,
    admin_note = coalesce(p_admin_note, admin_note),
    updated_at = now()
  where id = p_order_id;

  -- Restore stock and create RETURN inventory movements
  for v_item in select jsonb_array_elements(v_order.items) as item loop
    select id, stock
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if v_product is not null then
      v_stock_before := v_product.stock;
      v_stock_after := v_stock_before + (v_item->>'qty')::integer;

      -- Update product stock
      update public.products
      set stock = v_stock_after
      where id = v_product.id;

      -- Create RETURN inventory movement (audit trail of cancellation)
      insert into public.inventory_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reason,
        reference_type,
        reference_id,
        actor_email,
        created_at
      ) values (
        v_product.id,
        'RETURN',
        (v_item->>'qty')::integer,
        v_stock_before,
        v_stock_after,
        'Order cancelled',
        'order',
        p_order_id::text,
        coalesce(
          (select email from auth.users where id = auth.uid()),
          auth.jwt() ->> 'email',
          'admin@volthub'
        ),
        now()
      );
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'status', 'CANCELLED',
    'payment_status', v_new_payment_status
  );

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', sqlstate || ': ' || sqlerrm
  );
end $$;

commit;
