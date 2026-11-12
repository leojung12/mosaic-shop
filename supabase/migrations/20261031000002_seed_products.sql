-- 더미 상품 5개 (이미지는 public/products/{slug}/ 에 있는 로컬 파일)
insert into public.products
  (slug, name, color, price, tint, tint_is_dark, cutout, cutout_w, cutout_h, images,
   curator_note, size_w, size_d, size_h, weight_g, material, lead_min, lead_max, notice, sort_order)
values
  ('halo-vase-sand', 'HALO VASE', 'SAND', 54000, '#CFC3AE', false,
   '/products/halo-vase-sand/cutout.webp', 831, 880, array['/products/halo-vase-sand/1.webp'],
   '가운데가 비어 있는 원형 화병. 마른 가지 하나만 꽂아도 형태가 완성됩니다.',
   24, 8, 26, 900, '세라믹', 2, 4, '{}', 1),
  ('stem-vase-cobalt', 'STEM VASE', 'COBALT', 48000, '#3D4A5C', true,
   '/products/stem-vase-cobalt/cutout.webp', 238, 688, array['/products/stem-vase-cobalt/1.webp'],
   '길고 가는 목의 코발트 화병. 깊은 푸른 유약에 미세한 결이 남아 있습니다.',
   9, 9, 28, 450, '도자기', 2, 4, '{}', 2),
  ('lume-chamberstick-brass', 'LUME CHAMBERSTICK', 'BRASS', 46000, '#B8A47E', false,
   '/products/lume-chamberstick-brass/cutout.webp', 595, 880, array['/products/lume-chamberstick-brass/1.webp'],
   '손잡이가 달린 황동 촛대. 시간이 지날수록 자연스럽게 변색됩니다.',
   14, 14, 16, 380, '황동', 3, 5, '{}', 3),
  ('orla-vase-pair-stone', 'ORLA VASE PAIR', 'STONE', 56000, '#9C9A92', false,
   '/products/orla-vase-pair-stone/cutout.webp', 880, 558, array['/products/orla-vase-pair-stone/1.webp'],
   '둥근 몸통의 화병 두 점. 무광과 유광이 한 쌍을 이룹니다.',
   30, 16, 16, 1200, '석기', 2, 4, '{}', 4),
  ('halde-candlestick-ebony', 'HALDE CANDLESTICK', 'EBONY', 36000, '#3A3633', true,
   '/products/halde-candlestick-ebony/cutout.webp', 156, 880, array['/products/halde-candlestick-ebony/1.webp'],
   '선반 위에 세로선 하나를 더하는 촛대. 무광 블랙 마감입니다.',
   7, 7, 18, 260, '원목, 블랙 스테인', 3, 5, '{}', 5);

-- 상품정보제공고시 기본값 (실제 값은 관리자 페이지에서 수정)
update public.products set notice = jsonb_build_object(
  '품명 및 모델명', name || ' ' || color,
  '재질', material,
  '구성품', '본품 1',
  '크기', 'W ' || size_w || ' × D ' || size_d || ' × H ' || size_h || ' cm',
  '제조자/수입자', 'TBD',
  '제조국', 'TBD',
  '품질보증기준', '관련 법 및 소비자분쟁해결기준에 따름',
  'A/S 책임자와 전화번호', 'TBD'
);
