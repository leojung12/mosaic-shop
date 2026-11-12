"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { UI } from "@/config/site";
import type { FormState } from "@/app/actions";

// 손님 폼 공통 부품. 색은 현재 글자색(currentColor) 기준이라 어떤 tint 배경에서도 읽힌다.
export const inputClass =
  "w-full border-0 border-b border-current/30 bg-transparent px-0 py-2 text-body placeholder:text-current/40 focus:border-current focus:outline-none";

export function Field({ label, ...props }: { label: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="label text-muted">{label}</span>
      <input {...props} className={inputClass} />
    </label>
  );
}

export function TextArea({ label, ...props }: { label: string } & ComponentProps<"textarea">) {
  return (
    <label className="block">
      <span className="label text-muted">{label}</span>
      <textarea {...props} className={`${inputClass} min-h-28 resize-y`} />
    </label>
  );
}

// 봇만 채우는 숨김 칸
export function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      className="absolute -left-[9999px] h-0 w-0 opacity-0"
    />
  );
}

export function Consent() {
  return (
    <label className="flex items-start gap-2 text-[12px] leading-relaxed text-muted">
      <input type="checkbox" name="consent" required className="mt-1 accent-current" />
      <span>{UI.consent}</span>
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="label w-full border border-current px-4 py-3 transition-opacity hover:opacity-60 disabled:opacity-40"
    >
      {pending ? UI.sending : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-[13px] ${state.ok ? "" : "underline underline-offset-4"}`}>
      {state.message}
    </p>
  );
}
