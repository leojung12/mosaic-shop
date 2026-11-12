-- 누끼를 rembg(isnet) 모델로 원본 해상도에서 다시 땀 (Vision 마스크는 가장자리가 흐리고 흰 테두리가 남았음).
-- ROUND BUD VASE 는 원본에서 물건이 작게 찍혀 확대 시 흐려서, 더 크게 찍힌 사진(Unsplash K9yrTZWGOCE)으로 교체.
update public.products as p set cutout_w = v.w, cutout_h = v.h
from (values
  ('pebble-object-bone', 2798, 1534),
  ('round-bud-vase-ash', 1435, 2068),
  ('stem-vase-teal', 888, 2576),
  ('taper-candlestick-set-brass', 1888, 2220),
  ('trio-vase-set-chalk', 3200, 1073),
  ('cairn-stones-chalk', 1462, 2163),
  ('chalice-holder-silver', 1964, 2206),
  ('column-vase-indigo', 758, 1948),
  ('low-bowl-malachite', 3178, 1471),
  ('ribbed-vase-terracotta', 1894, 2157),
  ('stem-vase-oxblood', 907, 2641),
  ('wave-vase-ivory', 1958, 3200)
) as v(slug, w, h)
where p.slug = v.slug;

update public.products set
  name = 'BOTTLE VASE', color = 'ASH',
  curator_note = '목이 길게 솟은 둥근 병 모양 화병. 회녹색 유약 위로 모래알 같은 반점이 흩어져 있습니다.',
  size_w = 12, size_d = 12, size_h = 17, weight_g = 520,
  notice = notice || jsonb_build_object('품명 및 모델명', 'BOTTLE VASE ASH', '크기', 'W 12 × D 12 × H 17 cm')
where slug = 'round-bud-vase-ash';

-- 파일 이름을 바꿔 브라우저·이미지 캐시에 남은 옛 저화질 이미지를 피한다
update public.products set
  cutout = '/products/' || slug || '/cutout-hd.webp',
  images = array['/products/' || slug || '/1-hd.webp']
where cutout = '/products/' || slug || '/cutout.webp';
