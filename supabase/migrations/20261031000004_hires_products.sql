-- 더미 상품 5개를 누끼 품질이 좋은 고해상도 사진(Unsplash, 단색 배경)으로 교체.
-- 행을 지우지 않고 갱신해서 id(통계·알림·문의 연결)는 유지한다.
-- 사진 출처: stem-vase-teal l0ah3UBLppo / taper-candlestick-set-brass mwrMvNJYic8 /
--           pebble-object-bone TVhK0ZS3j48 / round-bud-vase-ash vLQg3hDIv5I / trio-vase-set-chalk Gm1JXx_PA1Q

update public.products as p set
  slug = v.slug, name = v.name, color = v.color, price = v.price,
  tint = v.tint, tint_is_dark = v.dark,
  cutout = '/products/' || v.slug || '/cutout.webp', cutout_w = v.cw, cutout_h = v.ch,
  images = array['/products/' || v.slug || '/1.webp'],
  curator_note = v.note, size_w = v.w, size_d = v.d, size_h = v.h,
  weight_g = v.g, material = v.mat, sort_order = v.ord
from (values
  ('halo-vase-sand', 'pebble-object-bone', 'PEBBLE OBJECT', 'BONE', 42000, '#D6CBB8', false, 1600, 884,
   '강가의 조약돌을 크게 키운 듯한 오브제. 아무것도 담지 않아도 선반 위에 무게를 더합니다.',
   20, 12, 11, 1100, '세라믹', 1),
  ('stem-vase-cobalt', 'stem-vase-teal', 'STEM VASE', 'TEAL', 48000, '#44575C', true, 546, 1600,
   '길고 가는 목의 화병. 깊은 청록 유약에 미세한 결이 남아 있어 빛에 따라 색이 달라집니다.',
   9, 9, 28, 450, '도자기', 2),
  ('lume-chamberstick-brass', 'taper-candlestick-set-brass', 'TAPER CANDLESTICK SET', 'BRASS', 58000, '#B9A57A', false, 1357, 1600,
   '높이가 다른 황동 촛대 세 점. 나란히 두면 리듬이 생기고, 따로 두어도 충분합니다.',
   22, 8, 30, 640, '황동', 3),
  ('orla-vase-pair-stone', 'trio-vase-set-chalk', 'TRIO VASE SET', 'CHALK', 46000, '#DAD6CE', false, 1600, 536,
   '유약 없이 구운 작은 화병 세 점. 마른 가지 한 줄기씩 꽂기 좋은 크기입니다.',
   30, 8, 12, 750, '세라믹 (무유약)', 4),
  ('halde-candlestick-ebony', 'round-bud-vase-ash', 'ROUND BUD VASE', 'ASH', 34000, '#8E8B86', false, 1190, 1103,
   '손바닥만 한 둥근 화병. 거친 회색 표면이 작은 꽃 한 송이를 돋보이게 합니다.',
   11, 11, 10, 380, '석기', 5)
) as v(old_slug, slug, name, color, price, tint, dark, cw, ch, note, w, d, h, g, mat, ord)
where p.slug = v.old_slug;

-- 상품정보제공고시 기본값 다시 채우기 (실제 값은 관리자 페이지에서 수정)
update public.products set notice = jsonb_build_object(
  '품명 및 모델명', name || ' ' || color,
  '재질', material,
  '구성품', case when name like '%SET%' then '본품 3' else '본품 1' end,
  '크기', 'W ' || size_w || ' × D ' || size_d || ' × H ' || size_h || ' cm',
  '제조자/수입자', 'TBD',
  '제조국', 'TBD',
  '품질보증기준', '관련 법 및 소비자분쟁해결기준에 따름',
  'A/S 책임자와 전화번호', 'TBD'
);
