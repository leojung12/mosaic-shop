"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";

// 결제가 끝난 주문 완료 화면에서 장바구니를 비운다
export default function ClearCart() {
  useEffect(() => cart.clear(), []);
  return null;
}
