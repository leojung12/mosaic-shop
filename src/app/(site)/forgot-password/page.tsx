import type { Metadata } from "next";
import AuthShell from "@/components/member/AuthShell";
import ForgotForm from "@/components/member/ForgotForm";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = { title: `Password · ${BRAND_NAME}` };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Password">
      <ForgotForm />
    </AuthShell>
  );
}
