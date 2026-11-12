"use client";

import { useActionState } from "react";
import { createCoupon } from "@/app/admin/actions";
import { AdminField, adminButton, adminInput } from "./ui";

export default function CouponForm() {
  const [state, action, pending] = useActionState(createCoupon, null);
  return (
    <form action={action} className="space-y-3">
      <AdminField label="코드" name="code" required placeholder="WELCOME10" />
      <label className="block space-y-1">
        <span className="label text-muted">종류</span>
        <select name="kind" className={adminInput}>
          <option value="percent">% 할인</option>
          <option value="fixed">원 할인</option>
        </select>
      </label>
      <AdminField label="할인 값" name="value" type="number" min={1} required placeholder="10 (% 또는 원)" />
      <AdminField label="최소 주문 금액 (선택)" name="minOrder" type="number" min={0} />
      <AdminField label="최대 할인 금액 (% 쿠폰, 선택)" name="maxDiscount" type="number" min={1} />
      <AdminField label="총 사용 횟수 (선택)" name="usageLimit" type="number" min={1} />
      <div className="grid grid-cols-2 gap-2">
        <AdminField label="시작일 (선택)" name="startsAt" type="date" />
        <AdminField label="종료일 (선택)" name="endsAt" type="date" />
      </div>
      <AdminField label="메모 (선택)" name="memo" placeholder="오픈 기념" />
      <button disabled={pending} className={adminButton}>
        만들기
      </button>
      {state && <p className="text-[12px]">{state.message}</p>}
    </form>
  );
}
