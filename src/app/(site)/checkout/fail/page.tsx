import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = { title: `Payment failed · ${BRAND_NAME}`, robots: { index: false } };

// 결제 실패·취소 시 토스가 보내는 곳 (failUrl). 장바구니는 그대로 남아 있다.
export default function FailPage({ searchParams }: PageProps<"/checkout/fail">) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pt-32 pb-24 text-center">
      <h1 className="font-serif text-[40px] leading-none">결제가 완료되지 않았어요</h1>
      <Suspense>
        <Message searchParams={searchParams} />
      </Suspense>
      <div className="mt-10 flex justify-center gap-6">
        <Link href="/checkout" className="label hover-line">
          ← 주문서로 돌아가기
        </Link>
        <Link href="/shop" className="label hover-line text-muted">
          Shop
        </Link>
      </div>
    </div>
  );
}

async function Message({ searchParams }: { searchParams: PageProps<"/checkout/fail">["searchParams"] }) {
  const q = await searchParams;
  const message = typeof q.message === "string" ? q.message : "결제를 취소했거나 문제가 생겼어요.";
  return <p className="mt-5 text-[14px] text-muted">{message}</p>;
}
