// 상품 카테고리. DB products.category 값(slug)과 맞춘다. 순서 = 숍 탭 순서.
export const CATEGORIES = [
  { slug: "vase", label: "Vases", ko: "화병" },
  { slug: "candle", label: "Candle holders", ko: "캔들 홀더" },
  { slug: "tableware", label: "Trays & Bowls", ko: "트레이·볼" },
  { slug: "desk", label: "Desk", ko: "데스크" },
  { slug: "object", label: "Objects", ko: "오브제" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const categoryOf = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
