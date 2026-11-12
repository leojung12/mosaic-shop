-- 컬러 필드 디자인: 홈에서 상품마다 화면 한 장을 채우는 강한 배경색 (상세 페이지 배경도 같은 색).
-- 오브제와 대비되는 색을 고른다. 비우면 tint 를 쓴다. 글자색(밝게/어둡게)은 밝기로 자동 결정.
alter table public.products
  add column field text check (field is null or field ~ '^#[0-9a-fA-F]{6}$');

update public.products as p set field = v.field
from (values
  ('pebble-object-bone', '#2F4BD8'),
  ('stem-vase-teal', '#F1B9A1'),
  ('taper-candlestick-set-brass', '#1E3A2E'),
  ('trio-vase-set-chalk', '#E5482A'),
  ('round-bud-vase-ash', '#F2E2A0'),
  ('stem-vase-oxblood', '#C3D7C9'),
  ('ribbed-vase-terracotta', '#9DB9E2'),
  ('column-vase-indigo', '#F2C14E'),
  ('low-bowl-malachite', '#F3C4CF'),
  ('cairn-stones-chalk', '#6B2B27'),
  ('wave-vase-ivory', '#6F7F45'),
  ('chalice-holder-silver', '#C9B8F0')
) as v(slug, field)
where p.slug = v.slug;
