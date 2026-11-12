"use client";

import { useEffect } from "react";
import { BRAND_NAME } from "@/config/site";

// 사이트 곳곳에 숨겨 둔 작은 장치들 (화면에는 아무것도 그리지 않다가 조건이 맞을 때만 나타난다)
//  1) 다른 탭으로 가면 탭 제목이 "One piece missing" 으로 바뀌고, 돌아오면 원래대로
//  2) 개발자 도구 콘솔에 짧은 인사
// (2026-11-02 회장 지시로 화면 애니메이션 장치는 뺐다)
const AWAY = `One piece missing · ${BRAND_NAME}`;

export default function HiddenFx() {
  useEffect(() => {
    // 1) 탭 제목
    let saved = document.title;
    const onVis = () => {
      if (document.hidden) {
        saved = document.title;
        document.title = AWAY;
      } else if (document.title === AWAY) {
        document.title = saved;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    // 2) 콘솔 인사 (한 번)
    const w = window as unknown as { __mosaicHi?: boolean };
    if (!w.__mosaicHi) {
      w.__mosaicHi = true;
      console.log(
        `%c${BRAND_NAME}%c\nObjects gathered one piece at a time.`,
        "font:700 28px Didot,serif;letter-spacing:.04em",
        "font:12px monospace;color:#888",
      );
    }

    return () => {
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
