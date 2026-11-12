-- 있으면 좋은 기능 (2026-11-02): 쿠폰 · 구매 후기 · 교환/반품 신청 · 부분 환불 · 결제 대기 주문 정리

-- 쿠폰 ------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 3 and 30),
  kind text not null check (kind in ('percent', 'fixed')),
  value int not null check (value > 0),
  min_order int not null default 0 check (min_order >= 0),
  max_discount int check (max_discount is null or max_discount > 0),
  usage_limit int check (usage_limit is null or usage_limit > 0),
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  memo text not null default '',
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;
create policy "admins manage coupons" on public.coupons for all
  using ((select private.is_admin())) with check ((select private.is_admin()));

alter table public.orders
  add column coupon_code text,
  add column discount_amount int not null default 0 check (discount_amount >= 0),
  add column refunded_amount int not null default 0 check (refunded_amount >= 0);

-- 쿠폰 할인액 계산 (없거나 못 쓰면 0, 사유)
create or replace function private.coupon_discount(p_code text, p_items_amount int)
returns table (discount int, reason text) language plpgsql stable security definer set search_path = '' as $$
declare c public.coupons;
begin
  select * into c from public.coupons where code = upper(trim(p_code));
  if not found or not c.is_active then return query select 0, '없는 쿠폰이에요.'; return; end if;
  if c.starts_at is not null and now() < c.starts_at then return query select 0, '아직 사용할 수 없는 쿠폰이에요.'; return; end if;
  if c.ends_at is not null and now() > c.ends_at then return query select 0, '기간이 끝난 쿠폰이에요.'; return; end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return query select 0, '모두 소진된 쿠폰이에요.'; return; end if;
  if p_items_amount < c.min_order then
    return query select 0, (c.min_order || '원 이상 주문 시 쓸 수 있어요.'); return;
  end if;
  return query select least(
    p_items_amount,
    case when c.kind = 'percent'
      then least(floor(p_items_amount * c.value / 100.0)::int, coalesce(c.max_discount, 2147483647))
      else c.value end
  ), null::text;
end $$;
revoke execute on function private.coupon_discount(text, int) from public;

-- 주문서에서 쿠폰 미리 확인 (손님)
create or replace function public.check_coupon(p_code text, p_items_amount int)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('discount', d.discount, 'reason', d.reason)
  from private.coupon_discount(p_code, p_items_amount) d;
$$;
revoke execute on function public.check_coupon(text, int) from public;
grant execute on function public.check_coupon(text, int) to anon, authenticated;

-- create_order: 쿠폰 반영 + 하루 지난 결제 대기 주문 정리
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
  v_code text := nullif(upper(trim(coalesce(p_info ->> 'couponCode', ''))), '');
  v_discount int := 0;
  v_reason text;
begin
  perform private.check_secret(p_secret);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'empty cart';
  end if;
  -- 결제창을 열고 그냥 떠난 주문은 하루 뒤 지운다
  delete from public.orders where status = 'pending' and created_at < now() - interval '1 day';

  select * into v_settings from public.shop_settings where id = 1;
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

  if v_code is not null then
    select d.discount, d.reason into v_discount, v_reason from private.coupon_discount(v_code, v_items_amount) d;
    if v_reason is not null then raise exception 'coupon:%', v_reason; end if;
  end if;

  v_fee := case when v_items_amount >= v_settings.free_shipping_over then 0 else v_settings.shipping_fee end;
  update public.orders set
    items_amount = v_items_amount,
    shipping_fee = v_fee,
    coupon_code = v_code,
    discount_amount = v_discount,
    total_amount = greatest(100, v_items_amount - v_discount + v_fee),
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

-- 결제 완료 시 쿠폰 사용 수 +1
create or replace function public.mark_order_paid(
  p_secret text, p_order_number text, p_payment_key text, p_amount int, p_method text, p_receipt_url text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  perform private.check_secret(p_secret);
  update public.orders set
    status = 'paid', payment_key = p_payment_key, payment_method = p_method,
    receipt_url = p_receipt_url, paid_at = now(), updated_at = now()
  where order_number = p_order_number and status = 'pending' and total_amount = p_amount
  returning coupon_code into v_code;
  if not found then raise exception 'order not payable'; end if;
  if v_code is not null then
    update public.coupons set used_count = used_count + 1 where code = v_code;
  end if;
end $$;

-- 구매 후기 -------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author text not null, -- 화면 표시용 (홍*동)
  rating int not null check (rating between 1 and 5),
  body text not null check (length(body) between 5 and 1000),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on public.reviews (product_id, created_at desc);
alter table public.reviews enable row level security;
create policy "anyone reads visible reviews" on public.reviews for select
  using (is_visible or user_id = (select auth.uid()) or (select private.is_admin()));
create policy "authors delete own review" on public.reviews for delete
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "admins update reviews" on public.reviews for update
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- 산 사람만(결제 완료 이후 주문에 그 상품이 있는 회원) 후기를 쓴다
create or replace function public.write_review(p_product_id uuid, p_rating int, p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if auth.uid() is null then raise exception 'login'; end if;
  if not exists (
    select 1 from public.orders o join public.order_items i on i.order_id = o.id
    where o.user_id = auth.uid() and i.product_id = p_product_id
      and o.status in ('paid', 'preparing', 'shipped', 'delivered')
  ) then raise exception 'not purchased'; end if;
  select name into v_name from public.profiles where id = auth.uid();
  v_name := coalesce(nullif(v_name, ''), '구매자');
  insert into public.reviews (product_id, user_id, author, rating, body)
  values (
    p_product_id, auth.uid(),
    left(v_name, 1) || repeat('*', greatest(char_length(v_name) - 1, 1)),
    greatest(1, least(5, p_rating)), left(trim(p_body), 1000)
  )
  on conflict (product_id, user_id) do update
    set rating = excluded.rating, body = excluded.body, created_at = now();
end $$;
revoke execute on function public.write_review(uuid, int, text) from public;
grant execute on function public.write_review(uuid, int, text) to authenticated;

-- 교환·반품 신청 --------------------------------------------------------
create table public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('exchange', 'return')),
  reason text not null check (length(reason) between 2 and 1000),
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'done')),
  admin_note text not null default '',
  created_at timestamptz not null default now()
);
create index return_requests_order_idx on public.return_requests (order_id);
alter table public.return_requests enable row level security;
create policy "admins manage return requests" on public.return_requests for all
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "members read own return requests" on public.return_requests for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

-- 주문 링크(주문번호+토큰)가 있는 손님이 배송 시작 이후 신청한다
create or replace function public.request_return(p_order_number text, p_token text, p_kind text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from public.orders
  where order_number = p_order_number and access_token = p_token and status in ('shipped', 'delivered');
  if v_id is null then raise exception 'not allowed'; end if;
  if exists (select 1 from public.return_requests where order_id = v_id and status = 'requested') then
    raise exception 'already requested';
  end if;
  insert into public.return_requests (order_id, kind, reason)
  values (v_id, case when p_kind = 'exchange' then 'exchange' else 'return' end, left(trim(p_reason), 1000));
end $$;
revoke execute on function public.request_return(text, text, text, text) from public;
grant execute on function public.request_return(text, text, text, text) to anon, authenticated;

-- 주문 상세에 교환·반품 신청 내역도 함께 (손님 화면)
create or replace function public.get_order(p_order_number text, p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(o) - 'access_token' - 'payment_key' - 'admin_memo' - 'user_id'
    || jsonb_build_object(
      'items', coalesce((
        select jsonb_agg(to_jsonb(i) - 'order_id' order by i.name) from public.order_items i where i.order_id = o.id
      ), '[]'::jsonb),
      'returns', coalesce((
        select jsonb_agg(jsonb_build_object('kind', r.kind, 'status', r.status, 'reason', r.reason, 'created_at', r.created_at)
          order by r.created_at desc)
        from public.return_requests r where r.order_id = o.id
      ), '[]'::jsonb)
    )
  from public.orders o
  where o.order_number = p_order_number and o.access_token = p_token and o.status <> 'pending';
$$;
