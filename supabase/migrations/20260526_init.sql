create extension if not exists "uuid-ossp";

create table if not exists public.deliveries (
  id uuid primary key default uuid_generate_v4(),
  tracking_id text unique not null,
  sender_name text not null,
  receiver_name text not null,
  pickup_location text not null,
  destination text not null,
  phone text not null,
  sender_phone text,
  receiver_phone text,
  package_type text not null,
  item_description text,
  currency text,
  price numeric,
  status text default 'processing',
  package_image text,
  sender_email text,
  pickup_country text,
  destination_country text,
  delivery_language text,
  delivery_notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_tracking_id on public.deliveries(tracking_id);

alter table public.deliveries enable row level security;

create table if not exists public.address_book (
  id uuid primary key default uuid_generate_v4(),
  owner_email text not null,
  label text not null,
  location text not null,
  country text,
  created_at timestamp default now()
);

alter table public.address_book enable row level security;

create table if not exists public.app_settings (
  key text primary key,
  value text
);

alter table public.app_settings enable row level security;

insert into public.app_settings(key, value)
values ('admin_email', 'admin@gmail.com')
on conflict (key) do nothing;

create table if not exists public.email_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  tracking_id text,
  recipient text not null,
  resend_id text,
  status text not null default 'sent',
  error_message text,
  created_at timestamp default now()
);

alter table public.email_events enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce(
      (auth.jwt() ->> 'email') =
        (select value from public.app_settings where key = 'admin_email' limit 1),
      false
    )
$$;

drop policy if exists "Allow public delivery read" on public.deliveries;
create policy "Allow public delivery read"
on public.deliveries
for select
using (true);

drop policy if exists "Allow public delivery insert" on public.deliveries;
create policy "Allow public delivery insert"
on public.deliveries
for insert
with check (true);

drop policy if exists "Allow admin delivery update" on public.deliveries;
create policy "Allow admin delivery update"
on public.deliveries
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Allow admin delivery delete" on public.deliveries;
create policy "Allow admin delivery delete"
on public.deliveries
for delete
using (public.is_admin());

drop policy if exists "Allow address book owner access" on public.address_book;
create policy "Allow address book owner access"
on public.address_book
for all
using ((auth.jwt() ->> 'email') = owner_email)
with check ((auth.jwt() ->> 'email') = owner_email);

drop policy if exists "Allow app settings read" on public.app_settings;
create policy "Allow app settings read"
on public.app_settings
for select
using (true);

drop policy if exists "Allow app settings admin write" on public.app_settings;
create policy "Allow app settings admin write"
on public.app_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Allow email events read" on public.email_events;
create policy "Allow email events read"
on public.email_events
for select
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

GRANT ALL ON TABLE public.deliveries TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.address_book TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.email_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_signups TO anon, authenticated, service_role;
