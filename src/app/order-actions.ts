"use server";

import { redirect } from "next/navigation";
import { cancelPayment, orderSecret } from "@/lib/toss";
import { serverClient } from "@/lib/supabase/server";

// 주문서 제출 → DB에 결제 대기 주문을 만든다. 금액은 DB 가격·배송비로 서버가 계산한 값을 돌려준다.
export type CheckoutInfo = {
  ordererName: string;
  ordererPhone: string;
  ordererEmail: string;
  recipientName: string;
  recipientPhone: string;
  zipcode: string;
  address1: string;
  address2: string;
  deliveryMemo: string;
  agreeTerms: boolean;
  marketingAgreed: boolean;
  couponCode?: string;
};
export type CheckoutResult =
  | { ok: true; orderNumber: string; amount: number; orderName: string }
  | { ok: false; message: string; field?: keyof CheckoutInfo };

const PHONE = /^01[0-9]-?\d{3,4}-?\d{4}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");

export async function startCheckout(
  items: { productId: string; quantity: number }[],
  info: CheckoutInfo,
): Promise<CheckoutResult> {
  const t = (k: keyof CheckoutInfo) => String(info[k] ?? "").trim();
  if (!items?.length) return { ok: false, message: "장바구니가 비어 있어요." };
  if (!t("ordererName")) return { ok: false, message: "주문자 이름을 입력해 주세요.", field: "ordererName" };
  if (!PHONE.test(t("ordererPhone").replace(/\s/g, "")))
    return { ok: false, message: "주문자 휴대폰 번호를 확인해 주세요.", field: "ordererPhone" };
  if (!EMAIL.test(t("ordererEmail"))) return { ok: false, message: "이메일을 확인해 주세요.", field: "ordererEmail" };
  if (!t("recipientName")) return { ok: false, message: "받는 분 이름을 입력해 주세요.", field: "recipientName" };
  if (!PHONE.test(t("recipientPhone").replace(/\s/g, "")))
    return { ok: false, message: "받는 분 휴대폰 번호를 확인해 주세요.", field: "recipientPhone" };
  if (!/^\d{5}$/.test(t("zipcode")) || !t("address1"))
    return { ok: false, message: "주소 검색으로 배송지를 입력해 주세요.", field: "address1" };
  if (!info.agreeTerms) return { ok: false, message: "주문 내용 확인 및 결제 동의가 필요해요.", field: "agreeTerms" };

  const supabase = await serverClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_secret: orderSecret(),
    p_items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    p_info: {
      ...info,
      ordererName: t("ordererName"),
      ordererPhone: phone(t("ordererPhone")),
      ordererEmail: t("ordererEmail").toLowerCase(),
      recipientName: t("recipientName"),
      recipientPhone: phone(t("recipientPhone")),
    },
  });
  if (error) {
    if (error.message.startsWith("coupon:")) return { ok: false, message: error.message.slice(7) };
    if (error.message.startsWith("unavailable"))
      return { ok: false, message: "품절되었거나 판매가 끝난 상품이 있어요. 장바구니를 확인해 주세요." };
    console.error("create_order", error);
    return { ok: false, message: "주문을 만들지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  const r = data as { orderNumber: string; amount: number; orderName: string };
  return { ok: true, orderNumber: r.orderNumber, amount: r.amount, orderName: r.orderName };
}

// 비회원 주문 조회: 주문번호 + 휴대폰 번호
export type LookupState = { ok: boolean; message: string } | null;
export async function lookupOrder(_: LookupState, fd: FormData): Promise<LookupState> {
  const number = String(fd.get("orderNumber") ?? "").trim().toUpperCase();
  const tel = String(fd.get("phone") ?? "").trim();
  if (!number || !tel) return { ok: false, message: "주문번호와 휴대폰 번호를 입력해 주세요." };
  const supabase = await serverClient();
  const { data } = await supabase.rpc("lookup_order", { p_order_number: number, p_phone: tel });
  if (!data) return { ok: false, message: "일치하는 주문이 없어요. 주문번호와 번호를 다시 확인해 주세요." };
  redirect(`/orders/view?n=${encodeURIComponent(number)}&t=${data}`);
}

// 손님 결제 취소 (공급처 발주 전, 결제 완료 상태에서만)
export type CancelState = { ok: boolean; message: string } | null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function cancelMyOrder(number: string, token: string, _prev: CancelState): Promise<CancelState> {
  const supabase = await serverClient();
  const secret = orderSecret();
  const { data } = await supabase.rpc("order_for_payment", { p_secret: secret, p_order_number: number });
  const o = data as { status: string; accessToken: string; paymentKey: string | null } | null;
  if (!o || o.accessToken !== token) return { ok: false, message: "주문을 찾을 수 없어요." };
  if (o.status !== "paid" || !o.paymentKey)
    return { ok: false, message: "이미 상품 준비가 시작되어 직접 취소할 수 없어요. 문의로 요청해 주세요." };

  const res = await cancelPayment(o.paymentKey, "고객 요청 취소");
  if (!res.ok) return { ok: false, message: `취소하지 못했어요: ${res.error.message}` };
  await supabase.rpc("mark_order_canceled", { p_secret: secret, p_order_number: number, p_reason: "고객 요청 취소" });
  redirect(`/orders/view?n=${encodeURIComponent(number)}&t=${token}&canceled=1`);
}
