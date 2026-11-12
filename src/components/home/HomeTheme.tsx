"use client";

import { useEffect } from "react";

// 시작 화면이 실제로 보이는 동안에만 <html data-home> 를 켠다 (어두운 바탕·흰 글자·큰 footer 숨김).
// 지나온 페이지는 숨겨진 채 문서에 남아 있어서 CSS :has([data-home]) 로 잡으면 다른 페이지까지 어두워졌다.
export default function HomeTheme() {
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.home = "";
    return () => {
      delete el.dataset.home;
    };
  }, []);
  return null;
}
