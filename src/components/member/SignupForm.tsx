"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { completeProfile, signUp } from "@/app/member-actions";
import { SubmitButton, inputClass } from "@/components/forms";
import {
  CONSENTS,
  MARKETING_NOTICE,
  PASSWORD_RULE,
  PRIVACY_NOTICE,
  checkPassword,
  formatPhone,
} from "@/config/legal";

type Agree = {
  age: boolean;
  terms: boolean;
  privacy: boolean;
  email: boolean;
  sms: boolean;
};
const NONE: Agree = {
  age: false,
  terms: false,
  privacy: false,
  email: false,
  sms: false,
};

// social: 구글·카카오·네이버로 처음 로그인한 회원의 가입 마무리 (이메일·비밀번호 칸 없이 동의와 이름·전화번호만)
export default function SignupForm({
  social,
}: {
  social?: { name: string; next: string };
}) {
  const [state, action] = useActionState(
    social ? completeProfile : signUp,
    null,
  );
  const [agree, setAgree] = useState<Agree>(NONE);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [phone, setPhone] = useState("");

  const all = Object.values(agree).every(Boolean);
  const required = agree.age && agree.terms && agree.privacy;
  const set = (k: keyof Agree) => (v: boolean) =>
    setAgree((a) => ({ ...a, [k]: v }));
  const err = (f: string) =>
    state && !state.ok && state.field === f ? state.message : null;

  // 가입 완료 (이메일 인증 대기)
  if (state?.ok) {
    return (
      <div className="space-y-4 leading-relaxed">
        <p>
          <strong className="font-medium">{state.message}</strong> 로 인증
          메일을 보냈어요.
        </p>
        <p className="text-muted">
          메일의 링크를 누르면 가입이 완료됩니다. 메일이 안 보이면 스팸함도
          확인해 주세요.
        </p>
        <Link
          href="/login"
          className="label inline-block pt-4 hover:opacity-60"
        >
          로그인 화면으로 →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      {social && <input type="hidden" name="next" value={social.next} />}
      {!social && (
        <>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={err("email")}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            hint={PASSWORD_RULE}
            error={
              err("password") ??
              (pw && !checkPassword(pw) ? PASSWORD_RULE : null)
            }
          />
          <Input
            label="Password 확인"
            name="password2"
            type="password"
            autoComplete="new-password"
            required
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            error={
              err("password2") ??
              (pw2 && pw2 !== pw ? "비밀번호가 서로 다릅니다." : null)
            }
          />
        </>
      )}
      <Input
        label="Name"
        name="name"
        autoComplete="name"
        required
        maxLength={40}
        defaultValue={social?.name}
        error={err("name")}
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required
        placeholder="010-0000-0000"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d-]/g, ""))}
        onBlur={() => setPhone((v) => formatPhone(v) || v)}
        error={err("phone")}
      />

      <fieldset className="space-y-3 border-y border-current/20 py-5">
        <legend className="sr-only">약관 동의</legend>
        <Check
          checked={all}
          onChange={(v) =>
            setAgree(
              v
                ? {
                    age: true,
                    terms: true,
                    privacy: true,
                    email: true,
                    sms: true,
                  }
                : NONE,
            )
          }
          strong
        >
          전체 동의 <span className="text-muted">(선택 항목 포함)</span>
        </Check>
        <div className="space-y-3 border-t border-current/10 pt-3">
          <Check name="agree_age" checked={agree.age} onChange={set("age")}>
            {CONSENTS.age}
          </Check>
          <Check
            name="agree_terms"
            checked={agree.terms}
            onChange={set("terms")}
          >
            {CONSENTS.terms}{" "}
            <Link
              href="/terms"
              target="_blank"
              className="label text-muted underline"
            >
              보기
            </Link>
          </Check>
          <Check
            name="agree_privacy"
            checked={agree.privacy}
            onChange={set("privacy")}
          >
            {CONSENTS.privacy}
          </Check>
          <details className="ml-6 text-[12px] text-muted">
            <summary className="cursor-pointer">수집·이용 내용 보기</summary>
            <dl className="mt-2 grid grid-cols-[72px_1fr] gap-y-1">
              {PRIVACY_NOTICE.map((r) => (
                <div key={r.label} className="contents">
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </details>
          <Check
            checked={agree.email && agree.sms}
            onChange={(v) => setAgree((a) => ({ ...a, email: v, sms: v }))}
          >
            {CONSENTS.marketing}
          </Check>
          <div className="ml-6 flex gap-5">
            <Check
              name="marketing_email"
              checked={agree.email}
              onChange={set("email")}
            >
              이메일
            </Check>
            <Check
              name="marketing_sms"
              checked={agree.sms}
              onChange={set("sms")}
            >
              SMS
            </Check>
          </div>
          <p className="ml-6 text-[12px] text-muted">{MARKETING_NOTICE}</p>
        </div>
      </fieldset>

      {err("agree") && (
        <p className="text-[13px] underline underline-offset-4">
          {err("agree")}
        </p>
      )}
      {state && !state.ok && !state.field && (
        <p className="text-[13px] underline underline-offset-4">
          {state.message}
        </p>
      )}
      <div className={required ? "" : "opacity-50"}>
        <SubmitButton>{social ? "가입 마치기" : "가입하기"}</SubmitButton>
      </div>
      {!social && (
        <p className="label text-center text-muted">
          이미 회원이신가요?{" "}
          <Link href="/login" className="text-current hover:opacity-60">
            로그인
          </Link>
        </p>
      )}
    </form>
  );
}

function Input({
  label,
  hint,
  error,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string | null;
} & React.ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="label text-muted">{label}</span>
      <input {...props} aria-invalid={!!error} className={inputClass} />
      {(error || hint) && (
        <span
          className={`mt-1 block text-[12px] ${error ? "underline underline-offset-4" : "text-muted"}`}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

function Check({
  name,
  checked,
  onChange,
  strong,
  children,
}: {
  name?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-center gap-2 text-[13px] ${strong ? "font-medium" : ""}`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-current"
      />
      <span>{children}</span>
    </label>
  );
}
