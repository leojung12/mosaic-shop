import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/member/AuthShell";
import PasswordForm from "@/components/member/PasswordForm";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = { title: `New password · ${BRAND_NAME}` };

// 비밀번호 재설정 메일 링크 → /auth/callback → 여기 (세션이 있어야 함, proxy가 확인)
export default function NewPasswordPage() {
  return (
    <AuthShell title="New password">
      <PasswordForm />
      <Link href="/account" className="label mt-8 inline-block hover:opacity-60">
        My account →
      </Link>
    </AuthShell>
  );
}
