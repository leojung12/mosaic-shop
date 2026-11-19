import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ShopGrid from "@/components/shop/ShopGrid";
import { CATEGORIES } from "@/config/categories";
import { BRAND_NAME } from "@/config/site";
import { getProducts } from "@/lib/products";
import type { Product } from "@/types/product";

export const metadata: Metadata = { title: `Search · ${BRAND_NAME}`, robots: { index: false } };

// 상품 검색: 이름·색·소재·카테고리·노트에서 찾는다 (상품 수가 적어 서버에서 바로 거른다)
export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="mx-auto w-full max-w-[972px] px-5 pt-28 pb-24 md:px-6">
      <Suspense fallback={<p className="label text-muted">Loading…</p>}>
        <Results {...props} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: PageProps<"/search">) {
  const q = await searchParams;
  const query = (typeof q.q === "string" ? q.q : "").trim();
  const products = await getProducts();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = (p: (typeof products)[number]) =>
    [p.name, p.color, p.material, p.curatorNote, CATEGORIES.find((c) => c.slug === p.category)?.label ?? "", CATEGORIES.find((c) => c.slug === p.category)?.ko ?? ""]
      .join(" ")
      .toLowerCase();
  const found = words.length ? products.filter((p) => words.every((w) => hay(p).includes(w))) : [];

  return (
    <>
      <form action="/search" className="mb-12 flex items-end gap-4 border-b border-current pb-2">
        <label className="flex-1">
          <span className="sr-only">Search</span>
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Search objects — vase, brass, 화병…"
            className="w-full bg-transparent font-serif text-[28px] outline-none placeholder:text-current/25 md:text-[40px]"
          />
        </label>
        <button className="label pb-2 hover-line">Search</button>
      </form>
      {query && (
        <p className="label mb-8 text-muted">
          {found.length} result{found.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}
      {found.length > 0 && <ShopGrid products={found} catalog={products.map((p) => p.slug)} />}
      {query && found.length === 0 && <NoResults products={products} />}
    </>
  );
}

// 검색 결과가 없을 때: 안내 문구 + 카테고리 바로가기 + 추천 오브제 4개
function NoResults({ products }: { products: Product[] }) {
  // 추천: 큐레이터 PICK 먼저, 품절은 빼고, 나머지는 추천 순서대로
  const picks = [...products.filter((p) => p.badge === "PICK"), ...products]
    .filter((p, i, a) => !p.soldOut && a.indexOf(p) === i)
    .slice(0, 4);

  return (
    <div>
      <p className="font-serif text-[22px] leading-snug md:text-[28px]">찾는 오브제가 없어요.</p>
      <p className="mt-2 text-[14px] text-muted">다른 단어로 찾아보거나, 아래에서 둘러보세요.</p>

      <nav aria-label="카테고리" className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/shop/${c.slug}`}
            className="label rounded-full border border-current/30 px-4 py-2 transition-colors duration-300 hover:border-current hover:bg-(--current-ink) hover:text-(--current-bg)"
          >
            {c.label} · {c.ko}
          </Link>
        ))}
      </nav>

      {picks.length > 0 && (
        <section className="mt-16 border-t border-current/20 pt-6">
          <h2 className="label mb-6 text-muted">이런 오브제는 어때요?</h2>
          <ShopGrid products={picks} catalog={products.map((p) => p.slug)} />
        </section>
      )}
    </div>
  );
}
