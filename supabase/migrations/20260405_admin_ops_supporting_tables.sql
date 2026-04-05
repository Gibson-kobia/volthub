-- Admin operations supporting tables (safe/additive)
-- Adds persistence for staff, settings, and POS sales modules.

begin;

create extension if not exists pgcrypto;

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text not null,
  full_name text,
  role text not null check (role in ('super_admin', 'store_admin', 'inventory_manager', 'cashier')),
  store_code text default 'main',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_code text not null default 'main',
  store_name text,
  public_brand_name text,
  support_phone text,
  support_email text,
  physical_address text,
  business_hours jsonb,
  delivery_defaults jsonb,
  admin_preferences jsonb,
  low_stock_default integer,
  currency_code text,
  timezone_name text,
  updated_at timestamptz not null default now(),
  unique (store_code)
);

create table if not exists public.store_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text,
  customer_name text,
  operator_email text,
  payment_method text,
  payment_status text,
  subtotal numeric(12,2),
  total numeric(12,2) not null default 0,
  gross_profit_estimate numeric(12,2),
  notes text,
  store_code text default 'main',
  created_at timestamptz not null default now()
);

create table if not exists public.store_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.store_sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  sku text,
  barcode text,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  cost_price numeric(12,2),
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_profiles_email on public.staff_profiles(email);
create index if not exists idx_store_sales_created on public.store_sales(created_at desc);
create index if not exists idx_store_sales_store_code on public.store_sales(store_code, created_at desc);
create index if not exists idx_store_sale_items_sale_id on public.store_sale_items(sale_id);
create index if not exists idx_store_sale_items_product_id on public.store_sale_items(product_id);

alter table public.staff_profiles enable row level security;
alter table public.store_settings enable row level security;
alter table public.store_sales enable row level security;
alter table public.store_sale_items enable row level security;

drop policy if exists "Admins can manage staff profiles" on public.staff_profiles;
create policy "Admins can manage staff profiles"
  on public.staff_profiles
  for all
  using (public.is_admin_email())
  with check (public.is_admin_email());

drop policy if exists "Admins can manage store settings" on public.store_settings;
create policy "Admins can manage store settings"
  on public.store_settings
  for all
  using (public.is_admin_email())
  with check (public.is_admin_email());

drop policy if exists "Admins can manage store sales" on public.store_sales;
create policy "Admins can manage store sales"
  on public.store_sales
  for all
  using (public.is_admin_email())
  with check (public.is_admin_email());

drop policy if exists "Admins can manage store sale items" on public.store_sale_items;
create policy "Admins can manage store sale items"
  on public.store_sale_items
  for all
  using (public.is_admin_email())
  with check (public.is_admin_email());

commit;
