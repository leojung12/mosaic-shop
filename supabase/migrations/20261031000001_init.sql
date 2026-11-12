-- 오브제 숍 초기 스키마
-- 손님(anon): 노출 상품 읽기, 오픈 알림·문의·방문기록 "쓰기"만.
-- 관리자(admin_emails에 등록된 이메일로 로그인한 사용자): 전부 읽기·쓰기.

-- 관리자 ------------------------------------------------------------
create table public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins read admin list" on public.admin_emails
  for select to authenticated using ((select public.is_admin()));

-- 상품 --------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 60),
  color text not null check (char_length(color) between 1 and 30),
  price integer not null check (price >= 0),
  tint text not null check (tint ~ '^#[0-9a-fA-F]{6}$'),
  tint_is_dark boolean not null default false,
  cutout text not null,
  cutout_w integer not null check (cutout_w > 0),
  cutout_h integer not null check (cutout_h > 0),
  images text[] not null default '{}',
  curator_note text not null default '',
  size_w numeric(6,1) not null check (size_w > 0),
  size_d numeric(6,1) not null check (size_d > 0),
  size_h numeric(6,1) not null check (size_h > 0),
  weight_g integer not null default 0 check (weight_g >= 0),
  material text not null default '',
  lead_min integer not null default 2 check (lead_min >= 0),
  lead_max integer not null default 5 check (lead_max >= lead_min),
  external_url text check (external_url is null or external_url ~ '^https://'),
  notice jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  sold_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create policy "anyone reads visible products" on public.products
  for select to anon, authenticated
  using (is_visible or (select public.is_admin()));
create policy "admins insert products" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins update products" on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete products" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- 오픈 알림 신청 -----------------------------------------------------
create table public.waitlist (
  id bigint generated always as identity primary key,
  product_id uuid references public.products(id) on delete set null,
  contact text not null check (char_length(contact) between 5 and 120),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique nulls not distinct (product_id, contact)
);
create index waitlist_product_idx on public.waitlist(product_id);
alter table public.waitlist enable row level security;

create policy "anyone joins waitlist" on public.waitlist
  for insert to anon, authenticated with check (notified_at is null);
create policy "admins read waitlist" on public.waitlist
  for select to authenticated using ((select public.is_admin()));
create policy "admins update waitlist" on public.waitlist
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete waitlist" on public.waitlist
  for delete to authenticated using ((select public.is_admin()));

-- 1:1 문의 -----------------------------------------------------------
create table public.inquiries (
  id bigint generated always as identity primary key,
  product_id uuid references public.products(id) on delete set null,
  name text not null check (char_length(name) between 1 and 40),
  contact text not null check (char_length(contact) between 5 and 120),
  body text not null check (char_length(body) between 5 and 2000),
  answer text check (answer is null or char_length(answer) <= 4000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index inquiries_status_idx on public.inquiries(status, created_at desc);
create index inquiries_product_idx on public.inquiries(product_id);
alter table public.inquiries enable row level security;

create policy "anyone sends inquiry" on public.inquiries
  for insert to anon, authenticated
  with check (status = 'open' and answer is null and answered_at is null);
create policy "admins read inquiries" on public.inquiries
  for select to authenticated using ((select public.is_admin()));
create policy "admins update inquiries" on public.inquiries
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete inquiries" on public.inquiries
  for delete to authenticated using ((select public.is_admin()));

-- 방문·호버·클릭 기록 ---------------------------------------------------
create table public.events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('view', 'hover', 'click')),
  product_id uuid references public.products(id) on delete cascade,
  visitor text check (visitor is null or char_length(visitor) <= 64),
  created_at timestamptz not null default now()
);
create index events_created_idx on public.events(created_at);
create index events_product_idx on public.events(product_id, type);
alter table public.events enable row level security;

create policy "anyone records events" on public.events
  for insert to anon, authenticated with check (true);
create policy "admins read events" on public.events
  for select to authenticated using ((select public.is_admin()));
create policy "admins delete events" on public.events
  for delete to authenticated using ((select public.is_admin()));

-- 관리자 대시보드용 집계 (RLS 적용: 관리자만 결과가 나온다)
create or replace function public.product_stats(since timestamptz)
returns table (product_id uuid, views bigint, hovers bigint, clicks bigint, visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.product_id,
         count(*) filter (where e.type = 'view'),
         count(*) filter (where e.type = 'hover'),
         count(*) filter (where e.type = 'click'),
         count(distinct e.visitor)
  from public.events e
  where e.created_at >= since
  group by e.product_id;
$$;

-- 상품 이미지 저장소 (공개 읽기, 관리자만 업로드) ------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 10485760, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "admins upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'products' and (select public.is_admin()));
create policy "admins update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));
create policy "admins delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));
