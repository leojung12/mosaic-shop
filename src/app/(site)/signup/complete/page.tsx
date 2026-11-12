import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthShell from "@/components/member/AuthShell";
import SignupForm from "@/components/member/SignupForm";
import { BRAND_NAME } from "@/config/site";
import { safeNext } from "@/lib/social";
import { serverClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: `Welcome · ${BRAND_NAME}`, robots: { index: false } };

// 카카오·네이버·구글로 처음 로그인한 회원: 약관 동의와 이름·휴대폰 번호를 받고 가입을 마친다
export default function CompleteSignupPage(props: PageProps<"/signup/complete">) {
  return (
    <AuthShell title="Welcome">
      <Suspense>
        <Complete searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Complete({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile) redirect(next);

  const m = user.user_metadata ?? {};
  const name = String(m.full_name ?? m.name ?? m.nickname ?? "").slice(0, 40);
  return (
    <>
      <p className="mb-8 text-[14px] leading-relaxed text-muted">
        {user.email ? `${user.email} 계정으로 처음 오셨네요. ` : ""}약관 동의와 연락처만 받으면 가입이 끝나요.
      </p>
      <SignupForm social={{ name, next }} />
    </>
  );
}
