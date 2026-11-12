-- 숍 격자에서 카테고리별로 보기 위한 분류
alter table public.products add column if not exists category text not null default 'object'
  check (category in ('vase', 'candle', 'tableware', 'desk', 'object'));

update public.products set category = v.c
from (values
  ('pebble-object-bone', 'object'),
  ('stem-vase-teal', 'vase'),
  ('taper-candlestick-set-brass', 'candle'),
  ('trio-vase-set-chalk', 'vase'),
  ('round-bud-vase-ash', 'vase'),
  ('stem-vase-oxblood', 'vase'),
  ('ribbed-vase-terracotta', 'vase'),
  ('column-vase-indigo', 'vase'),
  ('low-bowl-malachite', 'tableware'),
  ('cairn-stones-chalk', 'object'),
  ('wave-vase-ivory', 'vase'),
  ('chalice-holder-silver', 'candle')
) as v(slug, c)
where products.slug = v.slug;

create index if not exists products_category_idx on public.products (category);
