import type { ReactNode } from "react";
import PageMotion from "@/components/PageMotion";
import ShopGrid from "@/components/shop/ShopGrid";
import { categoryOf } from "@/config/categories";
import type { Product } from "@/types/product";

// 숍 목록. 카테고리는 숍에 들어오기 전(시작 화면)에서 고른다.
//  전체(/shop) — 아르제처럼 Best · MD Pick · New Arrivals · All objects 로 나눠 접었다 폈다
//  카테고리(/shop/vase …) — 격자 하나
export default function ShopView({
  products,
  category,
  bestIds = [],
}: {
  products: Product[];
  category?: string;
  bestIds?: string[];
}) {
  const cat = category ? categoryOf(category) : undefined;
  const catalog = products.map((p) => p.slug);

  if (cat) {
    return (
      <Shell title={cat.label}>
        <ShopGrid key={cat.slug} products={products.filter((p) => p.category === cat.slug)} catalog={catalog} />
      </Shell>
    );
  }

  // Best: 최근 30일 조회·클릭 순 (기록이 모자라면 추천 순서로 채움)
  const byId = new Map(products.map((p) => [p.id, p]));
  const best = [...bestIds.map((id) => byId.get(id)).filter((p): p is Product => !!p), ...products]
    .filter((p, i, a) => a.indexOf(p) === i)
    .slice(0, 4);
  // MD Pick: 큐레이터 추천 스티커(PICK) 먼저, 나머지는 추천 순서에서 Best 와 겹치지 않게
  const pick = [...products.filter((p) => p.badge === "PICK"), ...products.filter((p) => !best.includes(p))]
    .filter((p, i, a) => a.indexOf(p) === i)
    .slice(0, 4);
  // New Arrivals: NEW 스티커 (나중에 넣은 것부터)
  const fresh = products.filter((p) => p.badge === "NEW").reverse();

  const sections = [
    { key: "best", title: "Best", items: best },
    { key: "pick", title: "MD Pick", items: pick },
    { key: "new", title: "New Arrivals", items: fresh },
    { key: "all", title: "All Objects", items: products },
  ].filter((s) => s.items.length);

  // 같은 상품이 여러 섹션에 나오면 처음 나온 곳만 상세로 날아가는 전환을 갖는다
  const seen = new Set<string>();
  const morphOf = (items: Product[]) =>
    items.filter((p) => !seen.has(p.slug) && seen.add(p.slug)).map((p) => p.slug);

  return (
    <Shell title="All objects">
      <div className="border-t border-current">
        {sections.map((s, i) => (
          // 첫 구역 아래는 화면에 들어올 때 그린다
          <details key={s.key} open className={`group border-b border-current/20 ${i > 0 ? "cv-auto" : ""}`}>
            <summary className="label flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
              <span className="text-(--current-ink)">{s.title}</span>
              <span className="flex items-center gap-4 text-muted">
                <span className="tabular-nums">{String(s.items.length).padStart(2, "0")}</span>
                {/* + 의 세로 획이 접히며 − 가 된다 */}
                <span aria-hidden className="relative inline-block size-[9px] text-(--current-ink)">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:scale-y-0 group-open:rotate-90" />
                </span>
              </span>
            </summary>
            <div className="pt-2 pb-16">
              <ShopGrid products={s.items} catalog={catalog} morph={morphOf(s.items)} />
            </div>
          </details>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageMotion>
      <section className="mx-auto max-w-[972px] px-5 pt-24 pb-24 md:px-6 md:pt-28">
        <h1 className="sr-only">{title}</h1>
        {children}
      </section>
    </PageMotion>
  );
}
