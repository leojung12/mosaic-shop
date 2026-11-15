"use client";

import { useState, type ReactNode } from "react";

// 상세 아래쪽 탭: Detail(큰 사진) | Info(사이즈·배송·교환·고시·문의)
// 접었다 펴는 칸 대신, 탭을 누르면 제목 + 내용이 바로 펼쳐진 채로 보인다.
export default function DetailTabs({ detail, info }: { detail: ReactNode; info: ReactNode }) {
  const [tab, setTab] = useState<"detail" | "info">("detail");
  const tabs = [
    { key: "detail", label: "Detail" },
    { key: "info", label: "Info" },
  ] as const;

  return (
    <>
      <div role="tablist" className="label flex border-b border-current/20">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex-1 border-b pb-3 text-center transition-opacity ${
              tab === t.key ? "border-current" : "border-transparent text-muted hover:opacity-60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tab === "detail" ? detail : info}</div>
    </>
  );
}
