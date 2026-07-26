-- Roadmap email subscribers
create table if not exists public.roadmap_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.roadmap_subscribers
  add constraint roadmap_subscribers_email_format
  check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

alter table public.roadmap_subscribers enable row level security;

create policy "Anyone can subscribe to roadmap"
on public.roadmap_subscribers
for insert
to anon, authenticated
with check (true);
