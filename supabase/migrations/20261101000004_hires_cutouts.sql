-- 누끼를 원본 해상도 그대로(긴 변 최대 3200px) 다시 저장. 홈 그래픽(poster) 시안은 쓰지 않기로 해서 비운다.
update public.products as p set cutout_w = v.w, cutout_h = v.h, poster = null
from (values
  ('pebble-object-bone', 2803, 1549),
  ('round-bud-vase-ash', 1190, 1103),
  ('stem-vase-teal', 880, 2580),
  ('taper-candlestick-set-brass', 1884, 2221),
  ('trio-vase-set-chalk', 3200, 1073),
  ('cairn-stones-chalk', 1466, 2159),
  ('chalice-holder-silver', 1961, 2206),
  ('column-vase-indigo', 756, 1952),
  ('low-bowl-malachite', 3200, 1477),
  ('ribbed-vase-terracotta', 1900, 2166),
  ('stem-vase-oxblood', 904, 2649),
  ('wave-vase-ivory', 1955, 3200)
) as v(slug, w, h)
where p.slug = v.slug;
