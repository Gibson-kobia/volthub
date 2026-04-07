-- Account/access alignment migration
-- Purpose:
-- 1) Lock staff roles to: super_admin, store_admin, cashier, rider.
-- 2) Enforce known store scopes: main, volthub.
-- 3) Normalize staff email identity for reliable matching.
-- 4) Keep changes additive and safe for existing environments.

begin;

-- Normalize legacy role values first.
update public.staff_profiles
set role = 'store_admin'
where role = 'inventory_manager';

-- Normalize legacy store/email rows.
update public.staff_profiles
set store_code = coalesce(nullif(trim(store_code), ''), 'main');

update public.staff_profiles
set email = lower(trim(email));

-- Remove role/store check constraints so we can re-add canonical ones.
do $$
declare
  role_constraint record;
  store_constraint record;
begin
  for role_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.staff_profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.staff_profiles drop constraint %I', role_constraint.conname);
  end loop;

  for store_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.staff_profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%store_code%'
  loop
    execute format('alter table public.staff_profiles drop constraint %I', store_constraint.conname);
  end loop;
end $$;

alter table public.staff_profiles
  alter column role set not null,
  alter column store_code set default 'main',
  alter column store_code set not null;

alter table public.staff_profiles
  add constraint staff_profiles_role_chk
  check (role in ('super_admin', 'store_admin', 'cashier', 'rider'));

alter table public.staff_profiles
  add constraint staff_profiles_store_code_chk
  check (store_code in ('main', 'volthub'));

-- Case-insensitive unique identity for staff email matching.
create unique index if not exists ux_staff_profiles_email_ci
  on public.staff_profiles ((lower(email)));

create index if not exists idx_staff_profiles_store_code
  on public.staff_profiles (store_code);

create index if not exists idx_staff_profiles_role_store_active
  on public.staff_profiles (role, store_code, is_active);

commit;
