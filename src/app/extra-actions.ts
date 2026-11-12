"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";

// 쿠폰 미리 확인 (주문서) — 실제 할인은 주문 만들 때 DB가 다시 계산한다
export async function checkCoupon(code: string, itemsAmount: number) {
  const c = code.trim().toUpperCase();
  if (!c) return { ok: false as const, message: "쿠폰 코드를 입력해 주세요." };
  const supabase = await serverClient();
  const { data, error } = await supabase.rpc("check_coupon", { p_code: c, p_items_amount: Math.max(0, itemsAmount) });
  if (error || !data) return { ok: false as const, message: "쿠폰을 확인하지 못했어요." };
  const r = data as { discount: number; reason: string | null };
  if (r.reason) return { ok: false as const, message: r.reason };
  return { ok: true as const, code: c, discount: r.discount };
}

// 구매 후기 (산 회원만 — DB 함수가 확인)
export type ReviewState = { ok: boolean; message: string } | null;
export async function writeReview(productId: string, slug: string, _: ReviewState, fd: FormData): Promise<ReviewState> {
  const rating = Number(fd.get("rating"));
  const body = String(fd.get("body") ?? "").trim();
  if (!(rating >= 1 && rating <= 5)) return { ok: false, message: "별점을 골라 주세요." };
  if (body.length < 5) return { ok: false, message: "후기를 5자 이상 적어 주세요." };
  const supabase = await serverClient();
  const { error } = await supabase.rpc("write_review", { p_product_id: productId, p_rating: rating, p_body: body });
  if (error) {
    if (error.message.includes("login")) return { ok: false, message: "로그인 후 쓸 수 있어요." };
    if (error.message.includes("not purchased")) return { ok: false, message: "이 상품을 구매한 회원만 후기를 쓸 수 있어요." };
    return { ok: false, message: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  revalidatePath(`/product/${slug}`);
  return { ok: true, message: "후기를 남겼어요. 고맙습니다." };
}

// 교환·반품 신청 (주문 링크의 접근 토큰 필요, 배송 시작 이후)
export type ReturnState = { ok: boolean; message: string } | null;
export async function requestReturn(number: string, token: string, _: ReturnState, fd: FormData): Promise<ReturnState> {
  const kind = fd.get("kind") === "exchange" ? "exchange" : "return";
  const reason = String(fd.get("reason") ?? "").trim();
  if (reason.length < 2) return { ok: false, message: "사유를 적어 주세요." };
  const supabase = await serverClient();
  const { error } = await supabase.rpc("request_return", {
    p_order_number: number,
    p_token: token,
    p_kind: kind,
    p_reason: reason,
  });
  if (error) {
    if (error.message.includes("already")) return { ok: false, message: "이미 신청한 내역이 있어요. 처리될 때까지 기다려 주세요." };
    return { ok: false, message: "신청할 수 없는 주문이에요. 문의로 남겨 주세요." };
  }
  revalidatePath("/orders/view");
  return { ok: true, message: "신청했어요. 확인 후 연락드릴게요." };
}
