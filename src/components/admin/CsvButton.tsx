"use client";

import { adminButton } from "@/components/admin/ui";

// 표 데이터를 CSV 파일로 내려받는다 (엑셀 한글 깨짐 방지 BOM 포함)
export default function CsvButton({ rows, filename }: { rows: string[][]; filename: string }) {
  const download = () => {
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const text = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" onClick={download} className={adminButton}>
      Download CSV
    </button>
  );
}
