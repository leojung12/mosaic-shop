import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOut } from "@/app/member-actions";
import PageMotion from "@/components/PageMotion";
import DeleteAccountForm from "@/components/member/DeleteAccountForm";
import PasswordForm from "@/components/member/PasswordForm";
import ProfileForm from "@/components/member/ProfileForm";
import Link from "next/link";
import { BRAND_NAME, formatPrice } from "@/config/site";
import { ORDER_STATUS, type OrderStatus } from "@/lib/orders";
import { serverClient } from "@/lib/supabase/server";
import type { InquiryRow, ProfileRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: `My account · ${BRAND_NAME}`, robots: { index: false } };

export default function AccountPage() {
  return (
    <PageMotion>
    <div className="mx-auto w-full max-w-[560px] px-5 pt-28 pb-20">
      <h1 className="mb-10 font-serif text-[44px] leading-none">My account</h1>
      <Suspense fallback={<p className="label text-muted">Loading…</p>}>
        <AccountContent />
      </Suspense>
    </div>
    </PageMotion>
  );
}

const STATUS: Record<InquiryRow["status"], string> = {
  open: "답변 대기",
  answered: "답변 완료",
  closed: "종료",
};

async function AccountContent() {
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [{ data: profile }, { data: inquiries }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("inquiries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("order_number, access_token, status, order_name, total_amount, created_at")
      .eq("user_id", user.id)
      .neq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  // 소셜로 처음 들어와 가입을 마치지 않은 회원
  if (!profile && (user.app_metadata?.provider !== "email" || user.user_metadata?.social))
    redirect("/signup/complete?next=/account");

  return (
    <div className="space-y-14">
      <Section title="회원 정보">
        <p className="mb-5 text-[13px]">
          <span className="label mr-3 text-muted">Email</span>
          {user.email}
        </p>
        {profile ? (
          <ProfileForm profile={profile as ProfileRow} />
        ) : (
          <p className="text-[13px] text-muted">회원 정보가 없는 계정입니다 (관리자 계정 등).</p>
        )}
      </Section>

      <Section title="주문 내역">
        {orders?.length ? (
          <ul className="divide-y divide-current/10 border-y border-current/10">
            {orders.map((o) => (
              <li key={o.order_number}>
                <Link
                  href={`/orders/view?n=${o.order_number}&t=${o.access_token}`}
                  className="flex items-baseline justify-between gap-4 py-4 text-[13px] hover:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="label block text-muted">
                      {new Date(o.created_at).toLocaleDateString("ko-KR")} · {o.order_number}
                    </span>
                    <span className="mt-1 block truncate">{o.order_name}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block tabular-nums">{formatPrice(o.total_amount)}</span>
                    <span className="label text-muted">{ORDER_STATUS[o.status as OrderStatus]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">아직 주문이 없어요.</p>
        )}
      </Section>

      <Section title="내 문의">
        {inquiries?.length ? (
          <ul className="space-y-5">
            {(inquiries as InquiryRow[]).map((q) => (
              <li key={q.id} className="space-y-2 border-b border-current/10 pb-5 text-[13px]">
                <p className="label text-muted">
                  {new Date(q.created_at).toLocaleDateString("ko-KR")} · {STATUS[q.status]}
                </p>
                <p className="whitespace-pre-wrap">{q.body}</p>
                {q.answer && (
                  <p className="border-l border-current/30 pl-3 whitespace-pre-wrap text-muted">{q.answer}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">아직 남긴 문의가 없어요. 상품 페이지의 &lsquo;문의하기&rsquo;에서 남길 수 있어요.</p>
        )}
      </Section>

      <Section title="비밀번호 변경">
        <PasswordForm />
      </Section>

      <Section title="로그아웃 · 탈퇴">
        <form action={signOut}>
          <button className="label border border-current px-4 py-3 hover:opacity-60">Log out</button>
        </form>
        <details className="mt-8 text-[13px]">
          <summary className="cursor-pointer text-muted">회원 탈퇴</summary>
          <DeleteAccountForm />
        </details>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label mb-5 border-b border-current/20 pb-2 text-muted">{title}</h2>
      {children}
    </section>
  );
}
