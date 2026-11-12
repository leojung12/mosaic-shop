"use client";

import { useEffect, useLayoutEffect } from "react";
import { rememberHome } from "@/lib/motion";
import { applyTint, fieldTint } from "@/lib/tint";
import { track } from "@/lib/track";
import type { Product } from "@/types/product";

// 상세 페이지 배경을 제품 컬러 필드 색으로 맞추고, 방문을 기록한다
export default function PageTint({ product }: { product: Product }) {
  // 홈을 내려 본 상태에서 들어와도 그려지기 전에 맨 위로: 그래야 메인 이미지가 화면 안에 있어
  // 홈 오브제가 그 자리로 날아와 이어진다
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [product.slug]);
  useEffect(() => {
    applyTint(fieldTint(product));
    rememberHome({ slug: product.slug });
  }, [product]);
  useEffect(() => {
    track("view", product.id);
  }, [product.id]);
  return null;
}
