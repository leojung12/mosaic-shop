"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { SETTINGS_TAG } from "@/lib/shop-settings";
import { PRODUCTS_TAG } from "@/lib/products";
import { cancelPayment } from "@/lib/toss";
import { serverClient } from "@/lib/supabase/server";

export type AdminState = { ok: boolean; message: string } | null;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const num = (fd: FormData, key: string) => Number(text(fd, key));

// 로그인 -----------------------------------------------------------------
export async function signIn(_: AdminState, fd: FormData): Promise<AdminState> {
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(fd, "email"),
    password: String(fd.get("password") ?? ""),
  });
  if (error) return { ok: false, message: "이메일 또는 비밀번호가 맞지 않습니다." };
  const { data } = await supabase.from("admin_users").select("user_id").limit(1);
  if (!data?.length) {
    await supabase.auth.signOut();
    return { ok: false, message: "관리자로 등록되지 않은 계정입니다." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// 상품 -------------------------------------------------------------------
export async function saveProduct(_: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id");

  let images: string[] = [];
  let notice: Record<string, string> = {};
  try {
    images = JSON.parse(text(fd, "images") || "[]");
    notice = JSON.parse(text(fd, "notice") || "{}");
  } catch {
    return { ok: false, message: "이미지·고시 데이터 형식이 잘못되었습니다." };
  }

  const row = {
    slug: text(fd, "slug"),
    name: text(fd, "name").toUpperCase(),
    color: text(fd, "color").toUpperCase(),
    price: num(fd, "price"),
    tint: text(fd, "tint"),
    tint_is_dark: fd.get("tint_is_dark") === "on",
    cutout: text(fd, "cutout"),
    cutout_w: num(fd, "cutout_w"),
    cutout_h: num(fd, "cutout_h"),
    images,
    curator_note: text(fd, "curator_note"),
    size_w: num(fd, "size_w"),
    size_d: num(fd, "size_d"),
    size_h: num(fd, "size_h"),
    weight_g: num(fd, "weight_g"),
    material: text(fd, "material"),
    lead_min: num(fd, "lead_min"),
    lead_max: num(fd, "lead_max"),
    external_url: text(fd, "external_url") || null,
    notice,
    sort_order: num(fd, "sort_order"),
    is_visible: fd.get("is_visible") === "on",
    sold_out: fd.get("sold_out") === "on",
    field: text(fd, "field") || null,
    category: text(fd, "category") || "object",
    badge: text(fd, "badge").toUpperCase().slice(0, 12) || null,
  };
  if (!row.cutout || !row.cutout_w) return { ok: false, message: "누끼 이미지를 올려 주세요." };

  const { error } = id
    ? await supabase.from("products").update(row).eq("id", id)
    : await supabase.from("products").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, message: "이미 있는 slug입니다." };
    if (error.code === "23514") return { ok: false, message: `입력값을 확인해 주세요 (${error.message})` };
    return { ok: false, message: `저장하지 못했습니다: ${error.message}` };
  }
  updateTag(PRODUCTS_TAG);
  redirect("/admin/products");
}

export async function setProductFlag(id: string, field: "is_visible" | "sold_out", value: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("products").update({ [field]: value }).eq("id", id);
  updateTag(PRODUCTS_TAG);
}

// 오픈 알림 --------------------------------------------------------------
export async function markNotified(id: number, notified: boolean) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("waitlist")
    .update({ notified_at: notified ? new Date().toISOString() : null })
    .eq("id", id);
}

export async function deleteWaitlist(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("waitlist").delete().eq("id", id);
}

// 문의 -------------------------------------------------------------------
export async function answerInquiry(_: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const status = text(fd, "status");
  if (!["open", "answered", "closed"].includes(status)) return { ok: false, message: "상태 값 오류" };
  const answer = text(fd, "answer") || null;
  const { error } = await supabase
    .from("inquiries")
    .update({
      answer,
      status,
      answered_at: status === "answered" ? new Date().toISOString() : null,
    })
    .eq("id", Number(text(fd, "id")));
  if (error) return { ok: false, message: `저장하지 못했습니다: ${error.message}` };
  return { ok: true, message: "저장했습니다." };
}

// 주문 ------------------------------------------------------------------
// (2026-11-02) 상태 변경·송장 입력·메모·환불·배송비 설정
type OrderFlow = "paid" | "preparing" | "shipped" | "delivered";

export async function setOrderStatus(id: string, status: OrderFlow) {
  const { supabase } = await requireAdmin();
  const now = new Date().toISOString();
  const patch: Record<string, string> = { status, updated_at: now };
  if (status === "delivered") patch.delivered_at = now;
  await supabase.from("orders").update(patch).eq("id", id);
  revalidatePath("/admin/orders");
}

export async function shipOrder(id: string, _: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const courier = text(fd, "courier");
  const tracking = text(fd, "tracking").replace(/\s/g, "");
  if (!courier || !tracking) return { ok: false, message: "택배사와 송장번호를 입력하세요." };
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({ courier, tracking_number: tracking, status: "shipped", shipped_at: now, updated_at: now })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/orders");
  return { ok: true, message: "배송 중으로 바꿨습니다." };
}

export async function saveOrderMemo(id: string, _: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("orders").update({ admin_memo: text(fd, "memo") }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "저장했습니다." };
}

// 관리자 취소·환불: 토스 결제 취소 → 주문 상태 변경. 금액을 적으면 부분 환불, 비우면 남은 금액 전부
export async function refundOrder(id: string, _: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const reason = text(fd, "reason") || "판매자 취소";
  const want = Math.round(Number(text(fd, "amount").replace(/[^0-9]/g, "")) || 0);
  const { data: o } = await supabase
    .from("orders")
    .select("status, payment_key, total_amount, refunded_amount")
    .eq("id", id)
    .single();
  if (!o) return { ok: false, message: "주문이 없습니다." };
  if (o.status === "canceled" || o.status === "refunded") return { ok: false, message: "이미 전액 취소된 주문입니다." };
  const left = o.total_amount - o.refunded_amount;
  const amount = want > 0 ? want : left;
  if (amount > left) return { ok: false, message: `환불 가능 금액은 ${left.toLocaleString()}원입니다.` };
  if (o.status !== "pending") {
    if (!o.payment_key) return { ok: false, message: "결제 정보가 없습니다." };
    const res = await cancelPayment(o.payment_key, reason, amount < left ? amount : undefined);
    if (!res.ok) return { ok: false, message: `토스 취소 실패: ${res.error.message}` };
  }
  const now = new Date().toISOString();
  const refunded = o.refunded_amount + amount;
  const full = refunded >= o.total_amount;
  const shippedAlready = o.status === "shipped" || o.status === "delivered";
  await supabase
    .from("orders")
    .update({
      refunded_amount: refunded,
      ...(full ? { status: shippedAlready ? "refunded" : "canceled", canceled_at: now } : {}),
      cancel_reason: reason,
      updated_at: now,
    })
    .eq("id", id);
  revalidatePath("/admin/orders");
  return { ok: true, message: full ? "전액 환불했습니다." : `${amount.toLocaleString()}원 부분 환불했습니다.` };
}

export async function setReturnStatus(id: string, status: "approved" | "rejected" | "done") {
  const { supabase } = await requireAdmin();
  await supabase.from("return_requests").update({ status }).eq("id", id);
  revalidatePath("/admin/orders");
}

// 쿠폰 ------------------------------------------------------------------
export async function createCoupon(_: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const code = text(fd, "code").toUpperCase().replace(/\s/g, "");
  const kind = text(fd, "kind") === "fixed" ? "fixed" : "percent";
  const value = num(fd, "value");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { ok: false, message: "코드는 영문 대문자·숫자 3~30자로 적으세요." };
  if (!(value > 0) || (kind === "percent" && value > 100)) return { ok: false, message: "할인 값을 확인하세요." };
  const opt = (k: string) => (text(fd, k) ? num(fd, k) : null);
  const date = (k: string) => (text(fd, k) ? new Date(text(fd, k) + "T00:00:00+09:00").toISOString() : null);
  const { error } = await supabase.from("coupons").insert({
    code,
    kind,
    value,
    min_order: opt("minOrder") ?? 0,
    max_discount: opt("maxDiscount"),
    usage_limit: opt("usageLimit"),
    starts_at: date("startsAt"),
    ends_at: date("endsAt") ? new Date(text(fd, "endsAt") + "T23:59:59+09:00").toISOString() : null,
    memo: text(fd, "memo"),
  });
  if (error?.code === "23505") return { ok: false, message: "이미 있는 코드입니다." };
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/coupons");
  return { ok: true, message: `${code} 쿠폰을 만들었습니다.` };
}

export async function toggleCoupon(id: string, active: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("coupons").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/coupons");
}

export async function saveShopSettings(_: AdminState, fd: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const fee = num(fd, "shippingFee");
  const free = num(fd, "freeShippingOver");
  if (!(fee >= 0) || !(free >= 0)) return { ok: false, message: "숫자를 확인하세요." };
  const { error } = await supabase
    .from("shop_settings")
    .update({ shipping_fee: fee, free_shipping_over: free, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { ok: false, message: error.message };
  updateTag(SETTINGS_TAG);
  return { ok: true, message: "저장했습니다." };
}

export async function setReviewVisible(id: string, visible: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("reviews").update({ is_visible: visible }).eq("id", id);
  revalidatePath("/admin/reviews");
}
