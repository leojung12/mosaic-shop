"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/member-actions";
import { FormMessage, SubmitButton, inputClass } from "@/components/forms";
import { PASSWORD_RULE } from "@/config/legal";

export default function PasswordForm() {
  const [state, action] = useActionState(updatePassword, null);
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="label text-muted">New password</span>
        <input name="password" type="password" required autoComplete="new-password" className={inputClass} />
        <span className="mt-1 block text-[12px] text-muted">{PASSWORD_RULE}</span>
      </label>
      <label className="block">
        <span className="label text-muted">New password 확인</span>
        <input name="password2" type="password" required autoComplete="new-password" className={inputClass} />
      </label>
      <SubmitButton>비밀번호 바꾸기</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
