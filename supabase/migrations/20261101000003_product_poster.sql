-- 홈 전용 그래픽 누끼(포스터 느낌 벡터 SVG). 비우면 홈에서도 사진 누끼(cutout)를 쓴다.
-- 상세 페이지는 언제나 실제 사진. 만드는 법: scripts/poster-svg.py
alter table public.products
  add column poster text check (poster is null or poster ~ '^(/|https://)');

update public.products set poster = '/products/' || slug || '/poster.svg'
where slug in (
  'pebble-object-bone', 'stem-vase-teal', 'taper-candlestick-set-brass', 'trio-vase-set-chalk',
  'round-bud-vase-ash', 'stem-vase-oxblood', 'ribbed-vase-terracotta', 'column-vase-indigo',
  'low-bowl-malachite', 'cairn-stones-chalk', 'wave-vase-ivory', 'chalice-holder-silver'
);
