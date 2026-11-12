import type { ComponentProps, ReactNode } from "react";

// 관리자 화면 공통 스타일 (손님 화면 톤 유지, 색 없는 UI)
export const adminInput =
  "w-full border border-ink/15 bg-white/60 px-3 py-2 text-[14px] focus:border-ink focus:outline-none";

export function AdminField({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <label className="block space-y-1">
      <span className="label text-muted">{label}</span>
      <input {...props} className={adminInput} />
      {hint && <span className="block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-serif text-[36px] leading-none">{children}</h1>
      {aside}
    </div>
  );
}

export const adminButton =
  "label border border-ink px-3 py-2 transition-opacity hover:opacity-60 disabled:opacity-40";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
