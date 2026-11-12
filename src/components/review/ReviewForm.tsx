"use client";

import { useActionState, useState } from "react";
import { writeReview } from "@/app/extra-actions";
import { inputClass } from "@/components/forms";

// 후기 쓰기 (구매한 회원만 저장된다 — 서버·DB에서 확인)
export default function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [state, action, pending] = useActionState(writeReview.bind(null, productId, slug), null);
  const [rating, setRating] = useState(5);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n}점`}
            onClick={() => setRating(n)}
            className={`text-[20px] leading-none ${n <= rating ? "" : "opacity-20"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea name="body" rows={3} required minLength={5} maxLength={1000} placeholder="써 보신 느낌을 남겨 주세요" className={`${inputClass} resize-y`} />
      <button disabled={pending} className="label w-full border border-current px-4 py-2.5 hover:opacity-60 disabled:opacity-40">
        {pending ? "저장 중…" : "후기 남기기"}
      </button>
      {state && <p className={`text-[12px] ${state.ok ? "" : "underline underline-offset-4"}`}>{state.message}</p>}
      <p className="text-[11px] text-muted">이 상품을 구매한 회원만 남길 수 있어요.</p>
    </form>
  );
}
