import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CancelOrderButton from "@/components/cart/CancelOrderButton";
import ClearCart from "@/components/cart/ClearCart";
import ReturnRequestForm from "@/components/cart/ReturnRequestForm";
import { BRAND_NAME, formatPrice } from "@/config/site";
import { ORDER_STATUS, RETURN_KIND, RETURN_STATUS, customerCancelable, trackingUrl, type Order } from "@/lib/orders";
import { serverClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: `Order · ${BRAND_NAME}`, robots: { index: false } };

// 주문 상세 (주문 완료 화면 겸 비회원 조회 결과). /orders/view?n=주문번호&t=접근토큰
export default function OrderPage(props: PageProps<"/orders/view">) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-5 pt-28 pb-24">
      <Suspense fallback={<p className="label text-muted">Loading…</p>}>
        <Content {...props} />
      </Suspense>
    </div>
  );
}

const STEPS = ["paid", "preparing", "shipped", "delivered"] as const;

async function Content({ searchParams }: PageProps<"/orders/view">) {
  const q = await searchParams;
  const number = typeof q.n === "string" ? q.n : "";
  const token = typeof q.t === "string" ? q.t : "";
  const supabase = await serverClient();
  const { data } = await supabase.rpc("get_order", { p_order_number: number, p_token: token });
  if (!data) notFound();
  const o = data as Order;
  const done = q.done === "1";
  const step = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const track = trackingUrl(o.courier, o.tracking_number);

  return (
    <article className="space-y-12">
      {done && <ClearCart />}
      <header className="space-y-3">
        <p className="label text-muted">Order {o.order_number}</p>
        <h1 className="font-serif text-[40px] leading-[1.05]">
          {done ? "주문이 완료됐어요" : q.canceled === "1" ? "주문을 취소했어요" : ORDER_STATUS[o.status]}
        </h1>
        {done && (
          <p className="text-[13px] leading-relaxed text-muted">
            {o.orderer_email}로 결제 영수증이 발송돼요. 이 페이지 주소를 저장하거나, 주문번호와 휴대폰 번호로{" "}
            <Link href="/orders" className="underline underline-offset-2">
              주문 조회
            </Link>
            에서 다시 볼 수 있어요.
          </p>
        )}
      </header>

      {/* 진행 단계 */}
      {step >= 0 && (
        <ol className="label grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className={`border-t-2 pt-2 ${i <= step ? "border-current" : "border-current/15 text-muted"}`}>
              {ORDER_STATUS[s]}
            </li>
          ))}
        </ol>
      )}
      {o.status === "shipped" || o.status === "delivered" ? (
        <p className="text-[13px]">
          {o.courier} {o.tracking_number}
          {track && (
            <>
              {" "}
              ·{" "}
              <a href={track} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                배송 조회
              </a>
            </>
          )}
        </p>
      ) : null}

      <Section title="주문 상품">
        <ul className="space-y-4">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4">
              <Link href={`/product/${i.slug}`} className="relative size-16 shrink-0 bg-(--tile)">
                <Image src={i.cutout} alt="" fill sizes="64px" className="object-contain p-1.5" />
              </Link>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[16px]">{i.name}</span>
                <span className="label text-muted">
                  {i.color} · {i.quantity}개
                </span>
              </span>
              <span className="label tabular-nums">{formatPrice(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-1.5 border-t border-current/15 pt-4 text-[13px]">
          <Row label="상품 금액" value={formatPrice(o.items_amount)} />
          <Row label="배송비" value={o.shipping_fee ? formatPrice(o.shipping_fee) : "무료"} />
          {o.discount_amount > 0 && <Row label={`쿠폰 ${o.coupon_code ?? ""}`} value={`−${formatPrice(o.discount_amount)}`} />}
          <Row label="결제 금액" value={formatPrice(o.total_amount)} strong />
          {o.payment_method && <Row label="결제 수단" value={o.payment_method} />}
          {o.refunded_amount > 0 && <Row label="환불 금액" value={formatPrice(o.refunded_amount)} />}
          {o.receipt_url && (
            <p className="text-right">
              <a href={o.receipt_url} target="_blank" rel="noreferrer" className="label underline underline-offset-2">
                영수증 보기
              </a>
            </p>
          )}
        </div>
      </Section>

      <Section title="배송지">
        <div className="space-y-1 text-[13px] leading-relaxed">
          <p>
            {o.recipient_name} · {o.recipient_phone}
          </p>
          <p>
            ({o.zipcode}) {o.address1} {o.address2}
          </p>
          {o.delivery_memo && <p className="text-muted">{o.delivery_memo}</p>}
        </div>
      </Section>

      {customerCancelable(o.status) && (
        <Section title="취소">
          <p className="mb-4 text-[12px] text-muted">상품 준비가 시작되기 전까지 바로 취소·환불할 수 있어요.</p>
          <CancelOrderButton number={o.order_number} token={token} />
        </Section>
      )}
      {(o.status === "shipped" || o.status === "delivered") && (
        <Section title="교환 · 반품">
          {o.returns?.length ? (
            <ul className="mb-6 space-y-2 text-[13px]">
              {o.returns.map((r, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {RETURN_KIND[r.kind]} — {r.reason}
                  </span>
                  <span className="label shrink-0 text-muted">{RETURN_STATUS[r.status]}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {!o.returns?.some((r) => r.status === "requested") && (
            <>
              <p className="mb-4 text-[12px] text-muted">받은 날부터 7일 안에 신청할 수 있어요. 단순 변심은 왕복 배송비가 들어요.</p>
              <ReturnRequestForm number={o.order_number} token={token} />
            </>
          )}
        </Section>
      )}
      {o.status === "canceled" && o.canceled_at && (
        <p className="text-[13px] text-muted">
          {new Date(o.canceled_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 취소 · 결제 수단으로 환불돼요
          (카드사에 따라 3~7영업일).
        </p>
      )}

      <p className="flex gap-6">
        <Link href="/shop" className="label hover-line">
          Continue shopping →
        </Link>
        <Link href="/info" className="label hover-line text-muted">
          교환·반품 안내
        </Link>
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label mb-5 border-b border-current pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className={`flex justify-between ${strong ? "pt-1 font-medium" : ""}`}>
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </p>
  );
}
