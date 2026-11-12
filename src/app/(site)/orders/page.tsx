import type { Metadata } from "next";
import OrderLookupForm from "@/components/cart/OrderLookupForm";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = { title: `Order lookup · ${BRAND_NAME}` };

// 비회원 주문 조회 (회원은 My account 에서 주문 내역을 본다)
export default function OrderLookupPage() {
  return (
    <div className="mx-auto w-full max-w-[420px] px-5 pt-32 pb-24">
      <h1 className="mb-3 font-serif text-[40px] leading-none">Order lookup</h1>
      <p className="mb-10 text-[13px] text-muted">주문번호와 주문할 때 쓴 휴대폰 번호를 입력해 주세요.</p>
      <OrderLookupForm />
    </div>
  );
}
