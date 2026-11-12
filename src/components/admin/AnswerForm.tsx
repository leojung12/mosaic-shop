"use client";

import { useActionState } from "react";
import { answerInquiry } from "@/app/admin/actions";
import { adminButton, adminInput } from "@/components/admin/ui";
import type { InquiryRow } from "@/lib/supabase/types";

export default function AnswerForm({ inquiry }: { inquiry: InquiryRow }) {
  const [state, action, pending] = useActionState(answerInquiry, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={inquiry.id} />
      <textarea
        name="answer"
        rows={4}
        defaultValue={inquiry.answer ?? ""}
        placeholder="보낸 답변 내용 기록"
        className={adminInput}
      />
      <div className="flex items-center gap-2">
        <select name="status" defaultValue={inquiry.status === "open" ? "answered" : inquiry.status} className={`${adminInput} w-auto`}>
          <option value="open">open</option>
          <option value="answered">answered</option>
          <option value="closed">closed</option>
        </select>
        <button disabled={pending} className={adminButton}>
          {pending ? "…" : "Save"}
        </button>
        {state && <span className="text-[12px]">{state.message}</span>}
      </div>
    </form>
  );
}
