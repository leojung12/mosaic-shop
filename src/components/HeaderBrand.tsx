"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import HomeLink from "@/components/HomeLink";
import { ClubWordmark } from "@/components/Logo";
import { BRAND_NAME } from "@/config/site";
import { BRAND_VT } from "@/lib/motion";

// 왼쪽 위 로고 — 동아리 로고 글씨체.
// 시작 화면에는 가운데 큰 로고가 있으니 숨기고, 다른 화면으로 넘어가면 큰 로고가 이 자리로 날아와 작아진다
// (아킨 방식. 같은 전환 이름 BRAND_VT — 시작 화면의 큰 로고와 짝)
export default function HeaderBrand() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <HomeLink aria-label={`${BRAND_NAME} — Home`} className="block transition-opacity hover:opacity-60">
      <ViewTransition name={BRAND_VT} share="morph" default="none">
        <ClubWordmark className="h-[18px] align-top md:h-[21px]" />
      </ViewTransition>
    </HomeLink>
  );
}
