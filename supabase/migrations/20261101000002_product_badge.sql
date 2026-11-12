-- 홈 오브제에 붙는 원형 스티커 문구 (예: NEW, PICK). 비우면 스티커 없음. 관리자 페이지에서 수정.
-- 재고가 없는 드롭쉬핑이라 '1 LEFT' 같은 수량 문구는 쓰지 않는다 (거짓 희소성 표시 금지).
alter table public.products
  add column badge text check (badge is null or char_length(badge) between 1 and 12);

update public.products set badge = v.badge
from (values
  ('low-bowl-malachite', 'NEW'),
  ('wave-vase-ivory', 'NEW'),
  ('column-vase-indigo', 'NEW'),
  ('taper-candlestick-set-brass', 'PICK'),
  ('trio-vase-set-chalk', 'SET OF 3')
) as v(slug, badge)
where products.slug = v.slug;
