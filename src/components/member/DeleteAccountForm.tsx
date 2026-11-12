"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/member-actions";
import { FormMessage, SubmitButton, inputClass } from "@/components/forms";

// 브라우저 확인창 대신 '탈퇴' 직접 입력으로 실수를 막는다
export default function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <p className="text-muted">
        탈퇴하면 회원 정보와 남긴 문의의 회원 연결이 즉시 삭제되며 되돌릴 수 없습니다.
      </p>
      <label className="block">
        <span className="label text-muted">확인을 위해 &lsquo;탈퇴&rsquo;를 입력하세요</span>
        <input name="confirm" required autoComplete="off" className={inputClass} />
      </label>
      <SubmitButton>탈퇴하기</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
