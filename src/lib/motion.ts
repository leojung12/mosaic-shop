// 모션 공통값 (akin 사이트와 같은 곡선)
// 애플 키노트풍의 느린 감속: 크게 움직이는 전환(넘기기, 등장)에 쓴다
export const EASE = [0.16, 1, 0.3, 1] as const;
// 조금 더 빠른 감속: 작은 반응(호버, 버튼)에 쓴다
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// 홈 오브제 ↔ 상세 이미지가 같은 물건으로 이어지도록 공유하는 이름
export const objectName = (slug: string) => `obj-${slug}`;

// 마지막으로 본 상품. 상세에서 홈으로 돌아올 때 모바일 넘기기 화면이 그 장에서 열리게 한다.
// (모듈 변수라 새로고침하면 초기화된다 — 페이지 이동 사이에서만 기억하면 충분)
// scrollY: 데스크톱 홈을 떠날 때의 스크롤 위치. 돌아오면 그 자리로 복원해 오브제가 화면 안에서 제자리로 날아오게 한다.
export const homeMemory: { slug: string | null; index: number; scrollY: number } = {
  slug: null,
  index: 0,
  scrollY: 0,
};

export const rememberHome = (patch: Partial<typeof homeMemory>) => Object.assign(homeMemory, patch);

// 시작 화면의 큰 로고 ↔ 다른 화면 왼쪽 위 작은 로고가 이어지는 전환 이름
export const BRAND_VT = "brand-wordmark";
