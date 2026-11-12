"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/member-actions";
import { FormMessage, SubmitButton, inputClass } from "@/components/forms";

export default function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, null);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5">
      <p className="text-[13px] text-muted">가입한 이메일로 비밀번호 재설정 링크를 보내드려요.</p>
      <label className="block">
        <span className="label text-muted">Email</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <SubmitButton>재설정 링크 받기</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
