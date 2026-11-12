-- 주문·결제 (2026-11-02)
-- 흐름: 주문서 제출 → create_order (가격은 DB 기준으로 다시 계산, 결제 대기 주문 생성)
--      → 토스페이먼츠 결제창 → 서버가 토스 승인 API 호출 → mark_order_paid (서버 비밀값 필요)
-- 손님은 주문을 직접 쓰거나 고칠 수 없다. 결제 확정·취소는 서버만(ORDER_SECRET), 배송 처리는 관리자만.

-- 배송비 설정 (한 줄짜리 표. 관리자 화면에서 바꾼다)
create table public.shop_settings (
  id int primary key default 1 check (id = 1),
  shipping_fee int not null default 3000 check (shipping_fee >= 0),
  free_shipping_over int not null default 50000 check (free_shipping_over >= 0),
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id) values (1);
alter table public.shop_settings enable row level security;
create policy "anyone reads settings" on public.shop_settings for select using (true);
create policy "admins update settings" on public.shop_settings for update
  using ((select private.is_admin())) with check ((select private.is_admin()));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_token text not null default encode(extensions.gen_random_bytes(18), 'hex'), -- 비회원 주문 조회 링크용
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'canceled', 'refunded')),
  items_amount int not null check (items_amount >= 0),
  shipping_fee int not null check (shipping_fee >= 0),
  total_amount int not null check (total_amount > 0),
  order_name text not null, -- 'STEM VASE 외 1건' (결제창 표시)
  orderer_name text not null,
  orderer_phone text not null,
  orderer_email text not null,
  recipient_name text not null,
  recipient_phone text not null,
  zipcode text not null,
  address1 text not null,
  address2 text not null default '',
  delivery_memo text not null default '',
  marketing_agreed boolean not null default false,
  payment_key text,
  payment_method text,
  receipt_url text,
  paid_at timestamptz,
  courier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  canceled_at timestamptz,
  cancel_reason text,
  admin_memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  slug text not null,
  name text not null,
  color text not null,
  cutout text not null,
  unit_price int not null check (unit_price >= 0),
  quantity int not null check (quantity between 1 and 20)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
-- 회원은 자기 주문만 읽는다. 쓰기는 아래 함수(서버)와 관리자만.
create policy "members read own orders" on public.orders for select
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "admins update orders" on public.orders for update
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "members read own order items" on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))
  ));

-- 서버 비밀값 (해시만 저장. 값은 서버 .env 의 ORDER_SECRET)
create table private.app_secret (
  id int primary key default 1 check (id = 1),
  order_secret_sha256 text not null
);
revoke all on private.app_secret from anon, authenticated;

create or replace function private.check_secret(p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or not exists (
    select 1 from private.app_secret
    where order_secret_sha256 = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;
revoke execute on function private.check_secret(text) from public;

-- 주문 생성: 손님이 보낸 가격은 믿지 않고 DB 가격·배송비로 다시 계산한다
create or replace function public.create_order(p_secret text, p_items jsonb, p_info jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_settings public.shop_settings;
  v_order public.orders;
  v_item jsonb;
  v_p public.products;
  v_qty int;
  v_items_amount int := 0;
  v_count int := 0;
  v_first text;
  v_fee int;
  v_number text;
begin
  perform private.check_secret(p_secret);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'empty cart';
  end if;
  select * into v_settings from public.shop_settings where id = 1;

  -- 주문번호: MS + 서울 날짜 + 6자리 (예: MS261102-4F9A1C)
  loop
    v_number := 'MS' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-'
      || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = v_number);
  end loop;

  insert into public.orders (
    order_number, user_id, items_amount, shipping_fee, total_amount, order_name,
    orderer_name, orderer_phone, orderer_email, recipient_name, recipient_phone,
    zipcode, address1, address2, delivery_memo, marketing_agreed
  ) values (
    v_number, auth.uid(), 0, 0, 1, '',
    left(trim(p_info ->> 'ordererName'), 40), left(trim(p_info ->> 'ordererPhone'), 20),
    left(trim(p_info ->> 'ordererEmail'), 120), left(trim(p_info ->> 'recipientName'), 40),
    left(trim(p_info ->> 'recipientPhone'), 20), left(trim(p_info ->> 'zipcode'), 10),
    left(trim(p_info ->> 'address1'), 200), left(trim(coalesce(p_info ->> 'address2', '')), 200),
    left(trim(coalesce(p_info ->> 'deliveryMemo', '')), 200),
    coalesce((p_info ->> 'marketingAgreed')::boolean, false)
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(20, coalesce((v_item ->> 'quantity')::int, 1)));
    select * into v_p from public.products
      where id = (v_item ->> 'productId')::uuid and is_visible and not sold_out;
    if not found then
      raise exception 'unavailable:%', coalesce(v_item ->> 'productId', '');
    end if;
    insert into public.order_items (order_id, product_id, slug, name, color, cutout, unit_price, quantity)
      values (v_order.id, v_p.id, v_p.slug, v_p.name, v_p.color, v_p.cutout, v_p.price, v_qty);
    v_items_amount := v_items_amount + v_p.price * v_qty;
    v_count := v_count + 1;
    if v_first is null then v_first := v_p.name; end if;
  end loop;

  v_fee := case when v_items_amount >= v_settings.free_shipping_over then 0 else v_settings.shipping_fee end;
  update public.orders set
    items_amount = v_items_amount,
    shipping_fee = v_fee,
    total_amount = v_items_amount + v_fee,
    order_name = case when v_count > 1 then v_first || ' 외 ' || (v_count - 1) || '건' else v_first end
  where id = v_order.id
  returning * into v_order;

  return jsonb_build_object(
    'orderNumber', v_order.order_number,
    'accessToken', v_order.access_token,
    'amount', v_order.total_amount,
    'orderName', v_order.order_name
  );
end $$;

-- 결제 승인 전 금액 확인용 (서버만)
create or replace function public.order_for_payment(p_secret text, p_order_number text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.orders;
begin
  perform private.check_secret(p_secret);
  select * into v from public.orders where order_number = p_order_number;
  if not found then return null; end if;
  return jsonb_build_object('status', v.status, 'amount', v.total_amount, 'accessToken', v.access_token,
    'paymentKey', v.payment_key, 'userId', v.user_id, 'phone', v.orderer_phone);
end $$;

-- 토스 승인 성공 후 결제 완료 처리 (서버만)
create or replace function public.mark_order_paid(
  p_secret text, p_order_number text, p_payment_key text, p_amount int, p_method text, p_receipt_url text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_secret(p_secret);
  update public.orders set
    status = 'paid', payment_key = p_payment_key, payment_method = p_method,
    receipt_url = p_receipt_url, paid_at = now(), updated_at = now()
  where order_number = p_order_number and status = 'pending' and total_amount = p_amount;
  if not found then raise exception 'order not payable'; end if;
end $$;

-- 손님 결제 취소 완료 처리 (서버만: 토스 취소 API 성공 후)
create or replace function public.mark_order_canceled(p_secret text, p_order_number text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_secret(p_secret);
  update public.orders set status = 'canceled', canceled_at = now(), cancel_reason = left(p_reason, 200), updated_at = now()
  where order_number = p_order_number and status in ('pending', 'paid');
end $$;

-- 주문 상세 보기: 주문번호 + 접근 토큰 (주문 완료 화면·비회원 조회 링크)
create or replace function public.get_order(p_order_number text, p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(o) - 'access_token' - 'payment_key' - 'admin_memo' - 'user_id'
    || jsonb_build_object('items', coalesce((
      select jsonb_agg(to_jsonb(i) - 'order_id' order by i.name) from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb))
  from public.orders o
  where o.order_number = p_order_number and o.access_token = p_token and o.status <> 'pending';
$$;

-- 비회원 주문 조회: 주문번호 + 주문자 휴대폰 번호(숫자만 비교) → 접근 토큰
create or replace function public.lookup_order(p_order_number text, p_phone text)
returns text language sql stable security definer set search_path = '' as $$
  select access_token from public.orders
  where order_number = upper(trim(p_order_number))
    and regexp_replace(orderer_phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    and length(regexp_replace(p_phone, '\D', '', 'g')) >= 10
    and status <> 'pending';
$$;

revoke execute on function public.create_order(text, jsonb, jsonb) from public;
revoke execute on function public.order_for_payment(text, text) from public;
revoke execute on function public.mark_order_paid(text, text, text, int, text, text) from public;
revoke execute on function public.mark_order_canceled(text, text, text) from public;
revoke execute on function public.get_order(text, text) from public;
revoke execute on function public.lookup_order(text, text) from public;
grant execute on function public.create_order(text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.order_for_payment(text, text) to anon, authenticated;
grant execute on function public.mark_order_paid(text, text, text, int, text, text) to anon, authenticated;
grant execute on function public.mark_order_canceled(text, text, text) to anon, authenticated;
grant execute on function public.get_order(text, text) to anon, authenticated;
grant execute on function public.lookup_order(text, text) to anon, authenticated;

-- 서버 비밀값 해시는 이 파일에 적지 않고 따로 넣는다:
--   insert into private.app_secret (id, order_secret_sha256) values (1, '<.env 의 ORDER_SECRET 을 sha256 한 hex>');
