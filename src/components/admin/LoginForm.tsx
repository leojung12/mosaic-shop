"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { AdminField, adminButton } from "@/components/admin/ui";

export default function LoginForm({ denied }: { denied: boolean }) {
  const [state, action, pending] = useActionState(signIn, null);
  const message = state?.message ?? (denied ? "관리자로 등록되지 않은 계정입니다." : null);

  return (
    <form action={action} className="mx-auto mt-16 max-w-sm space-y-4">
      <h1 className="font-serif text-[36px] leading-none">Admin</h1>
      <AdminField label="Email" name="email" type="email" required autoComplete="username" />
      <AdminField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      <button disabled={pending} className={`${adminButton} w-full py-3`}>
        {pending ? "…" : "Log in"}
      </button>
      {message && <p className="text-[13px]">{message}</p>}
    </form>
  );
}
