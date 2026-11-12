-- 상품 7개 추가 (5 → 12). 같은 규칙: 단색 배경 고해상도 사진(Unsplash) → 누끼 → 긴 변 1600px.
-- 사진 출처: stem-vase-oxblood maVIpNNtmlQ / ribbed-vase-terracotta THtfRdrK0nI /
--   column-vase-indigo 39wdffepWuM / low-bowl-malachite zid1VjcXtNY / cairn-stones-chalk ReI0SNvZp4g /
--   wave-vase-ivory ZqGBGQ1-wYo / chalice-holder-silver _srndYorq1s

insert into public.products
  (slug, name, color, price, tint, tint_is_dark, cutout, cutout_w, cutout_h, images,
   curator_note, size_w, size_d, size_h, weight_g, material, lead_min, lead_max, sort_order)
select v.slug, v.name, v.color, v.price, v.tint, v.dark,
       '/products/' || v.slug || '/cutout.webp', v.cw, v.ch, array['/products/' || v.slug || '/1.webp'],
       v.note, v.w, v.d, v.h, v.g, v.mat, v.lmin, v.lmax, v.ord
from (values
  ('stem-vase-oxblood', 'STEM VASE', 'OXBLOOD', 48000, '#5A3A3C', true, 546, 1600,
   'STEM VASE의 다른 유약. 붉은 몸통이 목으로 갈수록 옅어져 끝에서 하얗게 바랩니다.',
   9, 9, 28, 450, '도자기', 2, 4, 6),
  ('ribbed-vase-terracotta', 'RIBBED VASE', 'TERRACOTTA', 52000, '#C29A7B', false, 1404, 1600,
   '세로 골이 깊게 패인 항아리형 화병. 빛을 받으면 골마다 다른 농도의 주황이 생깁니다.',
   16, 16, 18, 1100, '석기, 유광 유약', 2, 4, 7),
  ('column-vase-indigo', 'COLUMN VASE', 'INDIGO', 56000, '#34405A', true, 620, 1600,
   '반듯한 기둥 모양 화병. 짙은 남색 위로 번진 무늬가 대리석처럼 흐릅니다.',
   10, 10, 26, 900, '도자기', 3, 5, 8),
  ('low-bowl-malachite', 'LOW BOWL', 'MALACHITE', 62000, '#3F5A50', true, 1600, 738,
   '녹청이 핀 낮은 볼. 열쇠나 작은 소품을 담아 현관에 두기 좋습니다.',
   26, 26, 10, 1400, '황동, 녹청 마감', 3, 5, 9),
  ('cairn-stones-chalk', 'CAIRN STONES', 'CHALK', 38000, '#D9D3C8', false, 1086, 1600,
   '하얀 조약돌 다섯 개를 쌓은 오브제. 책장 한 칸에 고요한 중심을 만듭니다.',
   12, 9, 18, 1600, '천연석', 2, 4, 10),
  ('wave-vase-ivory', 'WAVE VASE', 'IVORY', 58000, '#DCD3C3', false, 978, 1600,
   '한쪽이 파도처럼 말려 들어간 조형 화병. 꽃 없이 그대로 두어도 하나의 조각입니다.',
   16, 10, 26, 850, '세라믹 (무광)', 3, 5, 11),
  ('chalice-holder-silver', 'CHALICE HOLDER', 'SILVER', 44000, '#A9AAA8', false, 1422, 1600,
   '은빛 잔 모양 캔들 홀더. 쓸수록 생기는 얼룩이 빈티지한 표정을 더합니다. 캔들은 연출용이며 포함되지 않습니다.',
   12, 12, 14, 420, '황동, 은도금', 3, 5, 12)
) as v(slug, name, color, price, tint, dark, cw, ch, note, w, d, h, g, mat, lmin, lmax, ord);

update public.products set notice = jsonb_build_object(
  '품명 및 모델명', name || ' ' || color,
  '재질', material,
  '구성품', case when name like '%SET%' or name like '%STONES%' then '본품 1세트' else '본품 1' end,
  '크기', 'W ' || size_w || ' × D ' || size_d || ' × H ' || size_h || ' cm',
  '제조자/수입자', 'TBD',
  '제조국', 'TBD',
  '품질보증기준', '관련 법 및 소비자분쟁해결기준에 따름',
  'A/S 책임자와 전화번호', 'TBD'
)
where notice = '{}'::jsonb;
