"use client";

import { useActionState } from "react";
import { refundOrder, saveOrderMemo, shipOrder } from "@/app/admin/actions";
import { COURIERS } from "@/lib/orders";
import { adminButton, adminInput } from "./ui";

export function ShipForm({ id, courier, tracking }: { id: string; courier: string | null; tracking: string | null }) {
  const [state, action, pending] = useActionState(shipOrder.bind(null, id), null);
  return (
    <form action={action} className="space-y-2">
      <span className="label text-muted">송장 입력 (저장하면 배송 중으로 바뀝니다)</span>
      <div className="flex gap-2">
        <select name="courier" defaultValue={courier ?? "CJ대한통운"} className={`${adminInput} w-40`}>
          {Object.keys(COURIERS).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input name="tracking" defaultValue={tracking ?? ""} placeholder="송장번호" className={adminInput} />
      </div>
      <button disabled={pending} className={adminButton}>
        배송 시작
      </button>
      {state && <p className="text-[12px]">{state.message}</p>}
    </form>
  );
}

export function MemoForm({ id, memo }: { id: string; memo: string }) {
  const [state, action, pending] = useActionState(saveOrderMemo.bind(null, id), null);
  return (
    <form action={action} className="space-y-2">
      <textarea name="memo" defaultValue={memo} rows={4} placeholder="공급처 발주번호 등" className={adminInput} />
      <button disabled={pending} className={adminButton}>
        저장
      </button>
      {state && <p className="text-[12px]">{state.message}</p>}
    </form>
  );
}

export function RefundForm({ id, left }: { id: string; left: number }) {
  const [state, action, pending] = useActionState(refundOrder.bind(null, id), null);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("결제를 환불할까요? 되돌릴 수 없습니다.")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input name="amount" inputMode="numeric" placeholder={`환불 금액 (비우면 남은 ${left.toLocaleString()}원 전부)`} className={adminInput} />
      <input name="reason" placeholder="취소 사유 (손님에게 보이지 않음)" className={adminInput} />
      <button disabled={pending} className={adminButton}>
        환불하기
      </button>
      {state && <p className="text-[12px]">{state.message}</p>}
    </form>
  );
}
