-- Admin audit logs for tracking admin actions
-- Adds permanent record of admin operations for compliance and debugging

begin;

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id),
  admin_email text not null,
  action_type text not null, -- 'create_staff', 'deactivate_staff', etc.
  target_user_id uuid references auth.users(id),
  target_email text,
  details jsonb, -- Additional context like role, store_code, etc.
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_admin_user_id on public.admin_logs(admin_user_id);
create index if not exists idx_admin_logs_created_at on public.admin_logs(created_at desc);
create index if not exists idx_admin_logs_action_type on public.admin_logs(action_type);

alter table public.admin_logs enable row level security;

-- Only admins can view logs
create policy "Admins can view admin logs"
  on public.admin_logs
  for select
  using (public.is_admin_email());

-- Only system/service can insert logs (via service role)
create policy "Service role can insert admin logs"
  on public.admin_logs
  for insert
  with check (auth.role() = 'service_role');

commit;