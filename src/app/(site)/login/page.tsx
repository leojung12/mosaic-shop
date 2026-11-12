import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/member/AuthShell";
import LoginForm from "@/components/member/LoginForm";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = { title: `Log in · ${BRAND_NAME}` };

export default function LoginPage() {
  return (
    <AuthShell title="Log in">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
