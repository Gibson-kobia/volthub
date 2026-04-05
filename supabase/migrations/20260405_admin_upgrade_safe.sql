-- Admin upgrade migration (safe/additive)
-- Purpose:
-- 1) Add missing admin-oriented columns to existing tables.
-- 2) Create inventory movement audit table.
-- 3) Align allowed order status/payment values with app usage.
-- 4) Apply explicit RLS policies for admin operations.

begin;

create extension if not exists pgcrypto;

-- Helper used by RLS policies.
-- Keep allowlist small and explicit here; rotate in a follow-up migration when needed.
create or replace function public.is_admin_email()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = any (
      array[
        'virginiagatwiri7@gmail.com',
        'gibsonkobia@gmail.com'
      ]
    ),
    false
  );
$$;

-- Ensure products table has admin/inventory fields.
do $$
begin
  if to_regclass('public.products') is not null then
    alter table public.products add column if not exists seller_id uuid references auth.users(id);
    alter table public.products add column if not exists sku text;
    alter table public.products add column if not exists barcode text;
    alter table public.products add column if not exists cost_price numeric(12,2);
    alter table public.products add column if not exists reorder_level integer;
    alter table public.products add column if not exists supplier_name text;
    alter table public.products add column if not exists is_archived boolean not null default false;
    alter table public.products add column if not exists archived_at timestamptz;
    alter table public.products add column if not exists track_inventory boolean not null default true;
    alter table public.products add column if not exists store_code text;
    alter table public.products add column if not exists updated_at timestamptz not null default now();
  end if;
end $$;

-- Ensure orders table has fields used by admin + checkout experiences.
do $$
begin
  if to_regclass('public.orders') is not null then
    alter table public.orders add column if not exists address_text text;
    alter table public.orders add column if not exists delivery_location jsonb;
    alter table public.orders add column if not exists payment_method text;
    alter table public.orders add column if not exists payment_status text;
    alter table public.orders add column if not exists order_source text;
    alter table public.orders add column if not exists admin_note text;
    alter table public.orders add column if not exists fulfilled_at timestamptz;
    alter table public.orders add column if not exists store_code text;
    alter table public.orders add column if not exists updated_at timestamptz not null default now();
  end if;
end $$;

-- Keep status/payment values aligned with app constants.
do $$
begin
  if to_regclass('public.orders') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'orders_status_allowed_chk'
        and conrelid = 'public.orders'::regclass
    ) then
      alter table public.orders
        add constraint orders_status_allowed_chk
        check (
          status in ('NEW', 'CONFIRMED', 'PREPARING', 'WITH_RIDER', 'DISPATCHED', 'DELIVERED', 'CANCELLED')
        ) not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'orders_payment_status_allowed_chk'
        and conrelid = 'public.orders'::regclass
    ) then
      alter table public.orders
        add constraint orders_payment_status_allowed_chk
        check (
          payment_status is null
          or payment_status in ('PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'FAILED')
        ) not valid;
    end if;
  end if;
end $$;

-- Inventory movement audit trail table used by admin product operations.
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (
    movement_type in ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SALE', 'RETURN', 'DAMAGED', 'EXPIRED', 'WASTAGE')
  ),
  quantity_change integer not null,
  quantity_before integer not null,
  quantity_after integer not null,
  reason text,
  notes text,
  actor_user_id uuid references auth.users(id),
  actor_email text,
  reference_type text,
  reference_id text,
  store_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_movements_product_created
  on public.inventory_movements (product_id, created_at desc);

create index if not exists idx_inventory_movements_created
  on public.inventory_movements (created_at desc);

-- Row-level security posture.
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.inventory_movements enable row level security;

-- PRODUCTS policies
drop policy if exists "Public products are viewable by everyone" on public.products;
drop policy if exists "Sellers can manage their own products" on public.products;
drop policy if exists "Admins can manage all products" on public.products;

create policy "Public products are viewable by everyone"
  on public.products
  for select
  using (true);

create policy "Sellers can manage their own products"
  on public.products
  for all
  using (auth.uid() = seller_id or public.is_admin_email())
  with check (auth.uid() = seller_id or public.is_admin_email());

-- ORDERS policies
drop policy if exists "Enable insert for authenticated users and anon" on public.orders;
drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;

create policy "Enable insert for authenticated users and anon"
  on public.orders
  for insert
  with check (true);

create policy "Users can view their own orders"
  on public.orders
  for select
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders
  for select
  using (public.is_admin_email());

create policy "Admins can update orders"
  on public.orders
  for update
  using (public.is_admin_email())
  with check (public.is_admin_email());

-- INVENTORY MOVEMENTS policies
drop policy if exists "Admins can view inventory movements" on public.inventory_movements;
drop policy if exists "Admins can insert inventory movements" on public.inventory_movements;
drop policy if exists "Admins can update inventory movements" on public.inventory_movements;
drop policy if exists "Admins can delete inventory movements" on public.inventory_movements;

create policy "Admins can view inventory movements"
  on public.inventory_movements
  for select
  using (public.is_admin_email());

create policy "Admins can insert inventory movements"
  on public.inventory_movements
  for insert
  with check (public.is_admin_email());

create policy "Admins can update inventory movements"
  on public.inventory_movements
  for update
  using (public.is_admin_email())
  with check (public.is_admin_email());

create policy "Admins can delete inventory movements"
  on public.inventory_movements
  for delete
  using (public.is_admin_email());

commit;