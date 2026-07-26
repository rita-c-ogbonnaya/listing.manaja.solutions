-- Add columns to roadmap_subscribers (idempotent)
alter table public.roadmap_subscribers
  add column if not exists name text,
  add column if not exists source text default 'website',
  add column if not exists status text not null default 'received',
  add column if not exists user_agent text;

-- Support requests log
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  name text not null,
  email text not null,
  company text,
  subject text not null,
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  user_agent text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'support_requests_email_format'
  ) then
    alter table public.support_requests
      add constraint support_requests_email_format
      check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  end if;
end $$;

alter table public.support_requests enable row level security;

drop policy if exists "Anyone can submit support request" on public.support_requests;
create policy "Anyone can submit support request"
on public.support_requests
for insert
to anon, authenticated
with check (true);

create index if not exists support_requests_created_at_idx
  on public.support_requests (created_at desc);

create index if not exists roadmap_subscribers_created_at_idx
  on public.roadmap_subscribers (created_at desc);
