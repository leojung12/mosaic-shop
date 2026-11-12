"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { FormMessage, SubmitButton, inputClass } from "@/components/forms";
import { resendConfirmation, signIn } from "@/app/member-actions";
import SocialLogin from "@/components/member/SocialLogin";

export default function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(signIn, null);
  const [resent, resend] = useActionState(resendConfirmation, null);
  const linkError = params.get("error") === "link";
  const SOCIAL_ERRORS: Record<string, string> = {
    social: "소셜 로그인을 마치지 못했어요. 다시 시도해 주세요.",
    "naver-setup": "네이버 로그인은 아직 준비 중이에요. 다른 방법으로 로그인해 주세요.",
    "setup-naver": "네이버 로그인은 아직 준비 중이에요. 다른 방법으로 로그인해 주세요.",
    "setup-kakao": "카카오 로그인은 아직 준비 중이에요. 다른 방법으로 로그인해 주세요.",
    "setup-google": "구글 로그인은 아직 준비 중이에요. 다른 방법으로 로그인해 주세요.",
    "naver-email": "네이버 동의 화면에서 이메일 제공에 동의해야 로그인할 수 있어요.",
  };
  const socialError = SOCIAL_ERRORS[params.get("error") ?? ""];

  return (
    <div className="space-y-8">
      <SocialLogin next={params.get("next") ?? "/account"} />
      {socialError && <p className="text-[13px] underline underline-offset-4">{socialError}</p>}
      <p className="label flex items-center gap-3 text-muted before:h-px before:flex-1 before:bg-current/20 after:h-px after:flex-1 after:bg-current/20">
        or email
      </p>
      <form action={action} className="space-y-5">
        <input type="hidden" name="next" value={params.get("next") ?? "/account"} />
        <label className="block">
          <span className="label text-muted">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="label text-muted">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
        <SubmitButton>로그인</SubmitButton>
        {linkError && !state && (
          <p className="text-[13px] underline underline-offset-4">
            링크가 만료되었거나 이미 사용되었어요. 다시 시도해 주세요.
          </p>
        )}
        <FormMessage state={state} />
      </form>

      {/* 이메일 인증을 안 한 경우: 인증 메일 다시 받기 */}
      {state?.field === "unconfirmed" && (
        <form action={resend} className="space-y-3 border-t border-current/20 pt-6">
          <label className="block">
            <span className="label text-muted">인증 메일 다시 받기</span>
            <input name="email" type="email" required className={inputClass} />
          </label>
          <SubmitButton>다시 보내기</SubmitButton>
          <FormMessage state={resent} />
        </form>
      )}

      <div className="label flex justify-between border-t border-current/20 pt-6">
        <Link href="/forgot-password" className="hover:opacity-60">
          비밀번호 찾기
        </Link>
        <Link href="/signup" className="hover:opacity-60">
          회원가입 →
        </Link>
      </div>
    </div>
  );
}
