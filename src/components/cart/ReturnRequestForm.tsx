"use client";

import { useActionState } from "react";
import { requestReturn } from "@/app/extra-actions";
import { inputClass } from "@/components/forms";

// 교환·반품 신청 (배송 시작 이후 주문 화면에서)
export default function ReturnRequestForm({ number, token }: { number: string; token: string }) {
  const [state, action, pending] = useActionState(requestReturn.bind(null, number, token), null);
  if (state?.ok) return <p className="text-[13px]">{state.message}</p>;
  return (
    <form action={action} className="space-y-4">
      <div className="flex gap-6 text-[13px]">
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="return" defaultChecked className="accent-current" /> 반품
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="exchange" className="accent-current" /> 교환
        </label>
      </div>
      <textarea name="reason" required rows={3} placeholder="사유를 적어 주세요 (파손이면 사진은 문의로 보내 주세요)" className={`${inputClass} resize-y`} />
      <button disabled={pending} className="label w-full border border-current px-4 py-3 hover:opacity-60 disabled:opacity-40">
        {pending ? "신청 중…" : "교환·반품 신청"}
      </button>
      {state && <p className="text-[13px] underline underline-offset-4">{state.message}</p>}
    </form>
  );
}
