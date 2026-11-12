"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { applyTint } from "@/lib/tint";

// 홈·상세 페이지는 스스로 배경색을 정한다. 그 외 페이지(INFO 등)로 가면 기본색으로 되돌린다.
// 홈→상세 이동 때는 색을 지우지 않아서 배경이 끊기지 않고 이어진다.
export default function TintReset() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/" && !pathname.startsWith("/product/")) applyTint(null);
  }, [pathname]);
  return null;
}
