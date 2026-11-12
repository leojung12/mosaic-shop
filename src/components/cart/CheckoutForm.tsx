"use client";

import { ANONYMOUS, loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { checkCoupon } from "@/app/extra-actions";
import { startCheckout, type CheckoutInfo } from "@/app/order-actions";
import { inputClass } from "@/components/forms";
import { formatPrice } from "@/config/site";
import { cartTotal, useCart } from "@/lib/cart";
import type { ShopSettings } from "@/lib/orders";

declare global {
  interface Window {
    daum?: {
      Postcode: new (o: { oncomplete: (d: DaumAddress) => void; width: string; height: string }) => {
        embed: (el: HTMLElement) => void;
      };
    };
  }
}
type DaumAddress = { zonecode: string; roadAddress: string; jibunAddress: string; buildingName: string };

const noop = () => () => {};
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

// 주문서: 주문자 · 배송지(우편번호 검색) · 동의 → 토스 결제위젯으로 결제
export default function CheckoutForm({
  settings,
  customerKey,
  prefill,
}: {
  settings: ShopSettings;
  customerKey: string | null;
  prefill: { name: string; phone: string; email: string };
}) {
  const items = useCart();
  // 장바구니는 브라우저에만 있어서, 첫 화면(서버)에서는 '비어 있음'이 잠깐 보이지 않게 기다린다
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const subtotal = cartTotal(items);
  const fee = subtotal === 0 || subtotal >= settings.freeShippingOver ? 0 : settings.shippingFee;
  // 쿠폰: 적용한 뒤 상품 금액이 바뀌면 다시 적용하게 한다
  const [coupon, setCoupon] = useState<{ code: string; discount: number; base: number } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const discount = coupon && coupon.base === subtotal ? coupon.discount : 0;
  const total = Math.max(subtotal > 0 ? 100 : 0, subtotal - discount + fee);

  const [info, setInfo] = useState<CheckoutInfo>({
    ordererName: prefill.name,
    ordererPhone: prefill.phone,
    ordererEmail: prefill.email,
    recipientName: prefill.name,
    recipientPhone: prefill.phone,
    zipcode: "",
    address1: "",
    address2: "",
    deliveryMemo: "",
    agreeTerms: false,
    marketingAgreed: false,
  });
  const [same, setSame] = useState(true); // 받는 분 = 주문자
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const widgets = useRef<TossPaymentsWidgets | null>(null);
  const rendered = useRef(false);

  const set = (k: keyof CheckoutInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInfo((v) => ({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // 토스 결제위젯: 결제수단 + 토스 약관
  useEffect(() => {
    if (rendered.current || total <= 0 || !CLIENT_KEY) return;
    rendered.current = true;
    (async () => {
      const toss = await loadTossPayments(CLIENT_KEY);
      const w = toss.widgets({ customerKey: customerKey ?? ANONYMOUS });
      await w.setAmount({ currency: "KRW", value: total });
      await Promise.all([
        w.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        w.renderAgreement({ selector: "#payment-agreement", variantKey: "AGREEMENT" }),
      ]);
      widgets.current = w;
      setReady(true);
    })().catch((e) => {
      console.error(e);
      setError({ message: "결제창을 불러오지 못했어요. 새로고침해 주세요." });
    });
  }, [total, customerKey]);
  // 수량이 바뀌면 결제 금액도
  useEffect(() => {
    if (ready && total > 0) widgets.current?.setAmount({ currency: "KRW", value: total });
  }, [ready, total]);

  // 주소 검색: 팝업 창 대신 페이지 위 레이어에 띄운다 (팝업 차단·모바일 대응)
  const [postcode, setPostcode] = useState(false);
  const postcodeBox = useRef<HTMLDivElement>(null);
  const searchAddress = () => {
    if (!window.daum) return setError({ message: "주소 검색을 불러오는 중이에요. 잠시 후 다시 눌러 주세요." });
    setPostcode(true);
  };
  useEffect(() => {
    if (!postcode || !postcodeBox.current || !window.daum) return;
    new window.daum.Postcode({
      width: "100%",
      height: "100%",
      oncomplete: (d) => {
        setInfo((v) => ({
          ...v,
          zipcode: d.zonecode,
          address1: (d.roadAddress || d.jibunAddress) + (d.buildingName ? ` (${d.buildingName})` : ""),
        }));
        setPostcode(false);
      },
    }).embed(postcodeBox.current);
  }, [postcode]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgets.current || busy) return;
    setError(null);
    if (!agreePrivacy)
      return setError({ message: "개인정보 수집·이용 및 제3자 제공에 동의해 주세요.", field: "agreePrivacy" });
    setBusy(true);
    const base = same ? { ...info, recipientName: info.ordererName, recipientPhone: info.ordererPhone } : info;
    const payload = { ...base, couponCode: discount > 0 && coupon ? coupon.code : "" };
    const res = await startCheckout(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      payload,
    );
    if (!res.ok) {
      setBusy(false);
      return setError(res);
    }
    try {
      if (res.amount !== total) {
        // 그 사이 가격이 바뀐 경우: 서버 금액으로 맞추고 다시 누르게 한다
        await widgets.current.setAmount({ currency: "KRW", value: res.amount });
        setBusy(false);
        return setError({ message: `상품 가격이 바뀌어 결제 금액이 ${formatPrice(res.amount)}이에요. 확인 후 다시 눌러 주세요.` });
      }
      await widgets.current.requestPayment({
        orderId: res.orderNumber,
        orderName: res.orderName,
        successUrl: `${location.origin}/checkout/confirm`,
        failUrl: `${location.origin}/checkout/fail`,
        customerEmail: payload.ordererEmail,
        customerName: payload.ordererName,
        customerMobilePhone: payload.ordererPhone.replace(/\D/g, ""),
      });
    } catch (err) {
      setBusy(false);
      const code = (err as { code?: string }).code;
      if (code !== "USER_CANCEL") setError({ message: (err as Error).message || "결제를 요청하지 못했어요." });
    }
  };

  if (!hydrated) return <p className="label text-muted">Loading…</p>;
  if (items.length === 0)
    return (
      <div className="space-y-4">
        <p className="text-[14px] text-muted">장바구니가 비어 있어요.</p>
        <Link href="/shop" className="label hover-line">
          Shop →
        </Link>
      </div>
    );

  const err = (f: string) => (error?.field === f ? "border-current" : "");

  return (
    <form onSubmit={pay} className="grid gap-12 md:grid-cols-[1fr_380px] md:gap-16">
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
      {postcode && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => setPostcode(false)}>
          <div className="flex h-[min(560px,85svh)] w-full max-w-[480px] flex-col bg-white text-black" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <span className="label">주소 검색</span>
              <button type="button" onClick={() => setPostcode(false)} className="label hover:opacity-60">
                Close
              </button>
            </div>
            <div ref={postcodeBox} className="min-h-0 flex-1" data-lenis-prevent />
          </div>
        </div>
      )}
      <div className="space-y-12">
        <Section title="주문자">
          <Input label="이름" value={info.ordererName} onChange={set("ordererName")} autoComplete="name" className={err("ordererName")} />
          <Input label="휴대폰" value={info.ordererPhone} onChange={set("ordererPhone")} inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" className={err("ordererPhone")} />
          <Input label="이메일 (결제 영수증·주문 안내)" type="email" value={info.ordererEmail} onChange={set("ordererEmail")} autoComplete="email" className={err("ordererEmail")} />
        </Section>

        <Section title="배송지">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} className="accent-current" />
            주문자와 같아요
          </label>
          {!same && (
            <>
              <Input label="받는 분" value={info.recipientName} onChange={set("recipientName")} className={err("recipientName")} />
              <Input label="받는 분 휴대폰" value={info.recipientPhone} onChange={set("recipientPhone")} inputMode="tel" placeholder="010-0000-0000" className={err("recipientPhone")} />
            </>
          )}
          <div className="flex items-end gap-3">
            <Input label="우편번호" value={info.zipcode} readOnly placeholder="주소 검색" onClick={searchAddress} className={`cursor-pointer ${err("address1")}`} />
            <button type="button" onClick={searchAddress} className="label shrink-0 border border-current px-3 py-2 hover:opacity-60">
              주소 검색
            </button>
          </div>
          <Input label="주소" value={info.address1} readOnly onClick={searchAddress} className={`cursor-pointer ${err("address1")}`} />
          <Input label="상세 주소" value={info.address2} onChange={set("address2")} autoComplete="address-line2" />
          <Input label="배송 메모 (선택)" value={info.deliveryMemo} onChange={set("deliveryMemo")} placeholder="문 앞에 놓아 주세요" />
        </Section>

        <Section title="결제 수단">
          {!CLIENT_KEY && <p className="text-[13px] text-muted">결제 키가 설정되지 않았어요 (NEXT_PUBLIC_TOSS_CLIENT_KEY).</p>}
          <div id="payment-method" className="-mx-5 md:-mx-6" />
          <div id="payment-agreement" className="-mx-5 md:-mx-6" />
        </Section>
      </div>

      {/* 오른쪽: 주문 요약 (데스크톱에서 따라 내려온다) */}
      <aside className="h-fit space-y-6 md:sticky md:top-24">
        <Section title={`주문 상품 ${items.length}`}>
          <ul className="space-y-4">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <span className="relative size-14 shrink-0 bg-(--tile)">
                  <Image src={i.cutout} alt="" fill sizes="56px" className="object-contain p-1.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[15px]">{i.name}</span>
                  <span className="label text-muted">
                    {i.color} · {i.quantity}
                  </span>
                </span>
                <span className="label tabular-nums">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </Section>
        <div className="space-y-2 border-t border-current/15 pt-4">
          <Row label="상품 금액" value={formatPrice(subtotal)} />
          <Row label="배송비" value={fee === 0 ? "무료" : formatPrice(fee)} />
          {discount > 0 && <Row label={`쿠폰 ${coupon?.code}`} value={`−${formatPrice(discount)}`} />}
          {fee > 0 && <p className="text-[12px] text-muted">{formatPrice(settings.freeShippingOver)} 이상 무료배송</p>}
          <p className="flex items-baseline justify-between pt-2">
            <span className="label">Total</span>
            <span className="font-serif text-[26px] tabular-nums">{formatPrice(total)}</span>
          </p>
        </div>

        {/* 쿠폰 */}
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <Input label="쿠폰 코드" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
            <button
              type="button"
              onClick={async () => {
                const r = await checkCoupon(couponInput, subtotal);
                if (r.ok) {
                  setCoupon({ code: r.code, discount: r.discount, base: subtotal });
                  setCouponMsg(`${formatPrice(r.discount)} 할인됐어요.`);
                } else {
                  setCoupon(null);
                  setCouponMsg(r.message);
                }
              }}
              className="label shrink-0 border border-current px-3 py-2 hover:opacity-60"
            >
              적용
            </button>
          </div>
          {couponMsg && <p className="text-[12px] text-muted">{coupon && coupon.base !== subtotal ? "상품이 바뀌어 쿠폰을 다시 적용해 주세요." : couponMsg}</p>}
        </div>

        <div className="space-y-3 text-[12px] leading-relaxed">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 accent-current" />
            <span>
              (필수) 주문·배송을 위한 개인정보 수집·이용 및 배송을 위한 공급처 제3자 제공에 동의합니다.{" "}
              <Link href="/privacy" target="_blank" className="underline underline-offset-2">
                자세히
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={info.agreeTerms} onChange={set("agreeTerms")} className="mt-0.5 accent-current" />
            <span>
              (필수) 주문 상품과 금액을 확인했으며{" "}
              <Link href="/terms" target="_blank" className="underline underline-offset-2">
                이용약관
              </Link>
              에 따라 결제에 동의합니다.
            </span>
          </label>
          <label className="flex items-start gap-2 text-muted">
            <input type="checkbox" checked={info.marketingAgreed} onChange={set("marketingAgreed")} className="mt-0.5 accent-current" />
            <span>(선택) 새 오브제 소식을 이메일·문자로 받을게요.</span>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-[13px] underline underline-offset-4">
            {error.message}
          </p>
        )}
        <button
          type="submit"
          disabled={!ready || busy}
          className="label flex w-full items-center justify-center gap-3 bg-(--ink) px-4 py-4 text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {busy ? "결제 준비 중…" : <>Pay <span className="opacity-50">·</span> <span className="tabular-nums">{formatPrice(total)}</span></>}
        </button>
        <p className="text-[11px] leading-relaxed text-muted">
          공급처에서 직접 배송돼요. 결제 완료 후 상품 준비 전까지는 주문 조회에서 바로 취소할 수 있어요.
        </p>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="label border-b border-current pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, className = "", ...props }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="label text-muted">{label}</span>
      <input {...props} className={`${inputClass} ${className}`} />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </p>
  );
}
