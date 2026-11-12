import type { Metadata } from "next";
import AuthShell from "@/components/member/AuthShell";
import SignupForm from "@/components/member/SignupForm";
import SocialLogin from "@/components/member/SocialLogin";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = { title: `Sign up · ${BRAND_NAME}` };

export default function SignupPage() {
  return (
    <AuthShell title="Sign up">
      <div className="space-y-8">
        <SocialLogin />
        <p className="label flex items-center gap-3 text-muted before:h-px before:flex-1 before:bg-current/20 after:h-px after:flex-1 after:bg-current/20">
          or email
        </p>
        <SignupForm />
      </div>
    </AuthShell>
  );
}
