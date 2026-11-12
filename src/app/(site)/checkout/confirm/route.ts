import { NextResponse, type NextRequest } from "next/server";
import { confirmPayment, orderSecret } from "@/lib/toss";
import { serverClient } from "@/lib/supabase/server";

// 토스 결제창에서 돌아오는 곳 (successUrl).
// 1) DB 주문 금액과 돌아온 금액이 같은지 확인 → 2) 토스 승인 API → 3) 주문을 결제 완료로 → 주문 완료 화면
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const paymentKey = q.get("paymentKey") ?? "";
  const orderId = q.get("orderId") ?? "";
  const amount = Number(q.get("amount"));
  const fail = (message: string) =>
    NextResponse.redirect(new URL(`/checkout/fail?message=${encodeURIComponent(message)}`, req.url));

  if (!paymentKey || !orderId || !Number.isFinite(amount)) return fail("결제 정보가 올바르지 않아요.");

  const supabase = await serverClient();
  const secret = orderSecret();
  const { data } = await supabase.rpc("order_for_payment", { p_secret: secret, p_order_number: orderId });
  const order = data as { status: string; amount: number; accessToken: string } | null;
  if (!order) return fail("주문을 찾을 수 없어요.");
  const done = new URL(`/orders/view?n=${encodeURIComponent(orderId)}&t=${order.accessToken}&done=1`, req.url);
  if (order.status !== "pending") return NextResponse.redirect(done); // 새로고침 등으로 다시 들어온 경우
  if (order.amount !== amount) return fail("결제 금액이 주문 금액과 달라요. 다시 시도해 주세요.");

  const res = await confirmPayment(paymentKey, orderId, amount);
  if (!res.ok) return fail(res.error.message);

  const { error } = await supabase.rpc("mark_order_paid", {
    p_secret: secret,
    p_order_number: orderId,
    p_payment_key: res.data.paymentKey,
    p_amount: res.data.totalAmount,
    p_method: res.data.method,
    p_receipt_url: res.data.receipt?.url ?? null,
  });
  if (error) {
    // 돈은 나갔는데 주문 기록에 실패한 경우 — 관리자가 토스 상점관리자에서 확인해야 한다
    console.error("mark_order_paid failed", orderId, error);
    return fail(`결제는 완료됐지만 주문 저장에 실패했어요. 주문번호 ${orderId} 로 문의해 주세요.`);
  }
  return NextResponse.redirect(done);
}
