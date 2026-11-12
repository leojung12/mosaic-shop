// 사이트 전역 설정. 브랜드명·링크·UI 문구는 여기서만 바꾼다.

// 임시 이름. 2026-11-01 회장 지시로 OLIO → 다시 MOSAIC (부원들과 상의해 확정 예정).
// 여기만 바꾸면 로고·제목·도장이 전부 따라 바뀐다 (홈 슬라이드 사진 속 글씨는 미드저니 이미지라 따로 다시 뽑아야 함)
export const BRAND_NAME = "MOSAIC";

export const SITE = {
  name: BRAND_NAME,
  description: "A small curated store in Seoul. Objects gathered one piece at a time.",
} as const;

// 배포 주소 (링크 미리보기·사이트맵). Vercel 에서는 자동으로 잡히고, 도메인을 붙이면 NEXT_PUBLIC_SITE_URL 로 정한다
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3200");

// 구매 버튼 방식.
//  'cart'     = 자체 장바구니·토스페이먼츠 결제 (2026-11-02 구현)
//  'soon'     = 판매 전 (COMING SOON + 오픈 알림 신청)
//  'external' = 상품의 externalUrl(스마트스토어 등)로 새 탭 이동
export const CHECKOUT_MODE: "cart" | "soon" | "external" = "cart";

export const UI = {
  info: "Info",
  back: "← Back",
  view: "View →",
  comingSoon: "Coming soon",
  buy: "Buy",
  notifyTitle: "오픈 알림 받기",
  notifyHint: "판매가 시작되면 한 번만 알려드려요.",
  inquiryTitle: "문의하기",
  noticeTitle: "상품정보제공고시",
  returnTitle: "교환·반품",
  returnSummary:
    "수령 후 7일 이내 교환·반품을 신청할 수 있습니다. 단순 변심은 왕복 배송비가 부과되며, 불량·파손은 판매자가 부담합니다.",
  returnMore: "자세히 보기 →",
  otherObjects: "Other objects",
  consent:
    "알림·답변 발송을 위해 연락처를 수집하며, 목적 달성 후 지체 없이 파기합니다. 동의합니다.",
  submit: "보내기",
  sending: "보내는 중…",
} as const;

export const formatPrice = (won: number) => `₩${won.toLocaleString("ko-KR")}`;
