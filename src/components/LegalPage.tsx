import type { ReactNode } from "react";
import PageMotion from "@/components/PageMotion";
import Reveal from "@/components/Reveal";

export type Article = { id: string; title: string; body: ReactNode };

// 이용약관·개인정보처리방침 공통 틀. Info 페이지와 같은 결(큰 세리프 제목 + 데스크톱 고정 목차).
export default function LegalPage({
  label,
  title,
  effective,
  intro,
  articles,
  numbered = false,
}: {
  label: string;
  title: string;
  effective: string;
  intro?: ReactNode;
  articles: Article[];
  numbered?: boolean; // 약관은 '제1조', 방침은 '1.'
}) {
  const heading = (a: Article, i: number) => (numbered ? `제${i + 1}조 (${a.title})` : `${i + 1}. ${a.title}`);
  return (
    <PageMotion>
      <div className="px-5 pt-28 pb-24 md:px-8 md:pt-32">
        <Reveal>
          <h1 className="font-serif text-[52px] leading-none md:text-[72px]">{label}</h1>
          <p className="mt-4 text-[15px]">{title}</p>
          <p className="label mt-2 text-muted">시행일 {effective}</p>
          {intro && <div className="mt-6 max-w-[560px] text-[14px] leading-relaxed text-muted">{intro}</div>}
        </Reveal>

        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-[220px_1fr] md:gap-16">
          <nav className="hidden md:block">
            <ol className="sticky top-28 max-h-[calc(100svh-9rem)] space-y-2 overflow-y-auto pr-2 text-[12px]">
              {articles.map((a, i) => (
                <li key={a.id}>
                  <a href={`#${a.id}`} className="text-muted transition-colors hover:text-current">
                    {numbered ? `제${i + 1}조 ${a.title}` : `${i + 1}. ${a.title}`}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Reveal order={1}>
            <div className="max-w-[680px] divide-y divide-current/10 border-t border-current/20">
              {articles.map((a, i) => (
                <section key={a.id} id={a.id} className="scroll-mt-28 py-8">
                  <h2 className="text-[15px] font-semibold">{heading(a, i)}</h2>
                  <div className="mt-4 space-y-3 text-[14px] leading-[1.8] [&_a]:underline [&_a]:underline-offset-4">
                    {a.body}
                  </div>
                </section>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </PageMotion>
  );
}

export function Ol({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="grid grid-cols-[1.6em_1fr]">
          <span className="text-muted">{i + 1}.</span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-current/30">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-normal text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-current/10 align-top">
              {r.map((c, j) => (
                <td key={j} className="py-3 pr-4 leading-relaxed">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
