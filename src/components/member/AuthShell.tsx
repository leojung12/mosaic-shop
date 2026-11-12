import type { ReactNode } from "react";
import PageMotion from "@/components/PageMotion";

// 로그인·가입 화면 공통 틀: 가운데 좁은 칼럼
export default function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageMotion>
    <div className="mx-auto w-full max-w-[400px] px-5 pt-28 pb-20">
      <h1 className="mb-10 font-serif text-[44px] leading-none">{title}</h1>
      {children}
    </div>
    </PageMotion>
  );
}
