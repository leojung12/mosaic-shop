"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

// 카카오·네이버·구글로 계속하기. 처음이면 로그인 뒤 가입 마무리(약관 동의·전화번호) 화면으로 간다.
// 구글·카카오는 Supabase 기본 로그인, 네이버는 우리 서버 경로(/auth/naver)를 거친다.
// Supabase 대시보드에서 켠 로그인만 실제로 연결한다 (.env 의 NEXT_PUBLIC_AUTH_PROVIDERS, 예: "kakao,google,naver").
// 켜지 않은 버튼은 누르면 '준비 중' 안내로 — Supabase의 날것 오류 화면을 손님이 보지 않게.
const ENABLED = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "").split(",").map((s) => s.trim());

export default function SocialLogin({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const oauth = async (provider: "google" | "kakao") => {
    if (!ENABLED.includes(provider)) return router.push(`/login?error=setup-${provider}`);
    setBusy(provider);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await browserClient().auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setBusy(null);
      router.push("/login?error=social");
    }
  };

  const base =
    "flex h-12 w-full items-center justify-center gap-2.5 text-[14px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50";

  return (
    <div className="space-y-2.5">
      <button type="button" onClick={() => oauth("kakao")} disabled={!!busy} className={`${base} bg-[#FEE500] text-black/85`}>
        <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
          <path
            fill="currentColor"
            d="M12 3C6.48 3 2 6.54 2 10.9c0 2.82 1.87 5.3 4.69 6.7l-.95 3.48c-.08.3.26.54.52.37l4.15-2.75c.52.07 1.05.1 1.59.1 5.52 0 10-3.54 10-7.9S17.52 3 12 3z"
          />
        </svg>
        카카오로 계속하기
      </button>
      <a
        href={ENABLED.includes("naver") ? `/auth/naver?next=${encodeURIComponent(next)}` : "/login?error=setup-naver"}
        onClick={() => setBusy("naver")}
        className={`${base} bg-[#03C75A] text-white`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-[15px]">
          <path fill="currentColor" d="M15.6 12.8 8.1 2H2v20h6.4V11.2L15.9 22H22V2h-6.4z" />
        </svg>
        네이버로 계속하기
      </a>
      <button
        type="button"
        onClick={() => oauth("google")}
        disabled={!!busy}
        className={`${base} border border-current/20 bg-white text-[#1f1f1f]`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
        </svg>
        Google로 계속하기
      </button>
    </div>
  );
}
