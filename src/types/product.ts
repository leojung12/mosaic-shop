export type Product = {
  id: string;
  slug: string; // 'halo-vase-sand'
  name: string; // 'HALO VASE'
  color: string; // 'SAND'
  price: number;
  tint: string; // 호버 배경색 (저채도)
  tintIsDark: boolean; // true면 텍스트를 밝게
  field: string; // 컬러 필드: 홈 패널·상세 배경의 강한 색 (없으면 tint)
  cutout: string; // 투명 배경, 여백 없이 크롭한 누끼
  cutoutSize: { w: number; h: number }; // cutout 픽셀 크기 (비율 계산용)
  images: string[]; // 상세 이미지 (라이프스타일·디테일)
  displayHeight: number; // 홈 표시 높이 (vh)
  curatorNote: string;
  size: { w: number; d: number; h: number }; // cm
  weightG: number;
  material: string;
  leadDays: { min: number; max: number };
  externalUrl?: string;
  notice: Record<string, string>; // 상품정보제공고시
  soldOut: boolean;
  category: string; // config/categories.ts 의 slug
  badge: string | null; // 홈 오브제 스티커 문구 (NEW 등)
};
