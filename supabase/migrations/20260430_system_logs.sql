-- System audit logs for staff and system-level events
-- Adds a lightweight, append-only audit trail for security and compliance

begin;

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  actor text not null,
  target text,
  details text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_logs_created_at on public.system_logs(created_at desc);
create index if not exists idx_system_logs_event on public.system_logs(event);

alter table public.system_logs enable row level security;

create policy "Service role can insert system logs"
  on public.system_logs
  for insert
  with check (auth.role() = 'service_role');

create policy "Service role can select system logs"
  on public.system_logs
  for select
  using (auth.role() = 'service_role');

commit;
