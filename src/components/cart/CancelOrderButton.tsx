"use client";

import { useActionState } from "react";
import { cancelMyOrder } from "@/app/order-actions";

// 손님 결제 취소 (결제 완료 상태에서만 보인다)
export default function CancelOrderButton({ number, token }: { number: string; token: string }) {
  const [state, action, pending] = useActionState(cancelMyOrder.bind(null, number, token), null);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("주문을 취소하고 결제를 환불할까요?")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <button disabled={pending} className="label w-full border border-current px-4 py-3 hover:opacity-60 disabled:opacity-40">
        {pending ? "취소하는 중…" : "주문 취소"}
      </button>
      {state && <p className="text-[13px] underline underline-offset-4">{state.message}</p>}
    </form>
  );
}
