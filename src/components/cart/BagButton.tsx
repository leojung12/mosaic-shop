"use client";

import { cartCount, openBag, useCart } from "@/lib/cart";

// 헤더 오른쪽 "Bag 2" — 누르면 장바구니 서랍이 열린다
export default function BagButton() {
  const items = useCart();
  return (
    <button type="button" onClick={openBag} className="label hover-line tabular-nums" suppressHydrationWarning>
      Bag {cartCount(items)}
    </button>
  );
}
