import type { Product } from "@/types/product";

// 현재 배경·글자색을 <html>에 덮어써서 헤더·footer까지 함께 바뀌게 한다. null이면 기본색.
export function applyTint(p: Pick<Product, "tint" | "tintIsDark"> | null) {
  const s = document.documentElement.style;
  if (!p) {
    s.removeProperty("--current-bg");
    s.removeProperty("--current-ink");
    s.removeProperty("--current-muted");
    return;
  }
  s.setProperty("--current-bg", p.tint);
  s.setProperty("--current-ink", p.tintIsDark ? "var(--ink-inverse)" : "var(--ink)");
  s.setProperty(
    "--current-muted",
    p.tintIsDark ? "rgb(245 245 242 / 0.6)" : "rgb(26 26 26 / 0.5)",
  );
}

// 컬러 필드 색으로 칠하기 (홈 패널·상세 페이지). 글자색은 밝기로 자동 결정
// 2026-11 무채색으로 통일: 상품마다 다른 강한 색 대신 모두 같은 연회색. (DB의 field 값은 남겨 둔다)
export const FIELD = "#f4f4f4";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fieldTint = (_p: Pick<Product, "field">) => ({ tint: FIELD, tintIsDark: false });

// 배경 밝기로 글자색(밝게/어둡게)을 정한다. 관리자 화면 기본값 제안에 쓴다.
export function isDarkHex(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.25;
}

export const DESKTOP_QUERY = "(hover: hover) and (min-width: 768px)";
