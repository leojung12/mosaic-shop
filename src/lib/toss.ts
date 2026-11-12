
// 토스페이먼츠 서버 API (결제 승인·취소). 시크릿 키는 서버에서만 쓴다.
// 사업자 심사 통과 전에는 토스 문서의 공개 테스트 키로 동작한다 (실제 돈이 나가지 않음).
const API = "https://api.tosspayments.com/v1/payments";

function auth() {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) throw new Error("TOSS_SECRET_KEY 가 .env.local 에 필요합니다");
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  receipt?: { url: string } | null;
};
export type TossError = { code: string; message: string };

async function call<T>(path: string, body: unknown, idempotencyKey?: string) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: {
      Authorization: auth(),
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  return res.ok ? { ok: true as const, data: data as T } : { ok: false as const, error: data as TossError };
}

export const confirmPayment = (paymentKey: string, orderId: string, amount: number) =>
  call<TossPayment>("/confirm", { paymentKey, orderId, amount }, `confirm-${orderId}`);

// amount 를 주면 부분 취소, 없으면 남은 금액 전부
export const cancelPayment = (paymentKey: string, cancelReason: string, amount?: number) =>
  call<TossPayment>(
    `/${encodeURIComponent(paymentKey)}/cancel`,
    amount ? { cancelReason, cancelAmount: amount } : { cancelReason },
    `cancel-${paymentKey}-${amount ?? "all"}-${Date.now()}`,
  );

export const orderSecret = () => {
  const s = process.env.ORDER_SECRET;
  if (!s) throw new Error("ORDER_SECRET 가 .env.local 에 필요합니다");
  return s;
};
