import { Bodoni_Moda, Courier_Prime, Gowun_Batang, IM_Fell_English } from "next/font/google";
import localFont from "next/font/local";

// 빈티지 서체 조합 (2026-11)
//  제목·상품명 — IM Fell English (17세기 활자를 디지털로 옮긴 것, 잉크 번짐이 남아 있다)
//  라벨·가격·메뉴 — Courier Prime (타자기)
//  한글 본문 — 고운바탕 (옛 책 느낌의 바탕체), 폼 입력 등 작은 글씨 대체용으로 Pretendard
export const fell = IM_Fell_English({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fell",
});

export const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
});

export const gowun = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun",
  preload: false,
});

export const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  weight: "45 920",
  variable: "--font-pretendard",
});

// 워드마크 — Bodoni Moda 굵은 대문자 (18~19세기 패션지 표제 같은 디도네). 이름은 임시라 그림이 아니라 글자로 그린다.
export const brand = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-brand",
});
