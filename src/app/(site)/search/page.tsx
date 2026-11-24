
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ShopGrid from "@/components/shop/ShopGrid";
import { CATEGORIES } from "@/config/categories";
import { BRAND_NAME } from "@/config/site";
import { getProducts } from "@/lib/products";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: `Search · ${BRAND_NAME}`,
  robots: { index: false },
};

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="min-h-svh bg-[#faf9f6] text-[#343434]">
      <div className="mx-auto w-full max-w-[1100px] px-6 pt-36 pb-24 md:pt-44">
        <Suspense
          fallback={
            <p className="text-center text-sm text-[#999999]">
              Loading...
            </p>
          }
        >
          <Results {...props} />
        </Suspense>
      </div>
    </div>
  );
}

async function Results({ searchParams }: PageProps<"/search">) {
  const q = await searchParams;
  const query = (typeof q.q === "string" ? q.q : "").trim();

  const products = await getProducts();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  const hay = (p: (typeof products)[number]) =>
    [
      p.name,
      p.color,
      p.material,
      p.curatorNote,
      CATEGORIES.find((c) => c.slug === p.category)?.label ?? "",
      CATEGORIES.find((c) => c.slug === p.category)?.ko ?? "",
    ]
      .join(" ")
      .toLowerCase();

  const found = words.length
    ? products.filter((p) =>
        words.every((w) => hay(p).includes(w))
      )
    : [];

  return (
    <>
      <section className="mx-auto max-w-[720px] text-center">
        <p className="mb-5 text-[10px] tracking-[0.3em] text-[#92908b]">
          DISCOVER YOUR FAVORITES
        </p>

        <h1 className="font-serif text-[42px] italic leading-tight md:text-[64px]">
          Find your object.
        </h1>

        <p className="mt-4 text-[13px] text-[#92908b] md:text-[14px]">
          당신의 일상을 채울 오브제를 찾아보세요.
        </p>

        <form
          action="/search"
          className="mt-10 flex items-center gap-4 rounded-full border border-[#c5c1ba] px-5 py-4 transition-colors focus-within:border-[#343434] md:px-7"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>

          <label className="min-w-0 flex-1">
            <span className="sr-only">Search</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Search for something lovely..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#aaa7a1] md:text-[16px]"
            />
          </label>

          <button
            type="submit"
            aria-label="Search"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#e9e6df]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>

        {!query && (
          <div className="mt-10">
            <p className="mb-5 text-[10px] tracking-[0.2em] text-[#92908b]">
              EXPLORE BY CATEGORY
            </p>
            <CategoryLinks />
          </div>
        )}
      </section>

      {query && (
        <section className="mt-16">
          <p className="mb-8 border-b border-[#dedbd5] pb-4 text-[12px] tracking-wide text-[#858585]">
            {found.length} result{found.length === 1 ? "" : "s"} for “{query}”
          </p>

          {found.length > 0 && (
            <ShopGrid
              products={found}
              catalog={products.map((p) => p.slug)}
            />
          )}

          {found.length === 0 && (
            <NoResults products={products} />
          )}
        </section>
      )}
    </>
  );
}

function CategoryLinks() {
  return (
    <nav
      aria-label="Categories"
      className="flex flex-wrap justify-center gap-2"
    >
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/shop/${c.slug}`}
          className="rounded-full border border-[#d8d4ce] px-5 py-2.5 text-[11px] tracking-wide transition-colors duration-300 hover:border-[#343434] hover:bg-[#343434] hover:text-white"
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}

function NoResults({ products }: { products: Product[] }) {
  const picks = [
    ...products.filter((p) => p.badge === "PICK"),
    ...products,
  ]
    .filter(
      (p, i, a) => !p.soldOut && a.indexOf(p) === i
    )
    .slice(0, 4);

  return (
    <div>
      <div className="py-8 text-center">
        <p className="font-serif text-[28px] italic md:text-[36px]">
          Nothing found.
        </p>

        <p className="mt-3 text-[13px] text-[#92908b]">
          다른 검색어로 찾아보거나 새로운 오브제를 발견해 보세요.
        </p>

        <div className="mt-8">
          <CategoryLinks />
        </div>
      </div>

      {picks.length > 0 && (
        <section className="mt-16 border-t border-[#dedbd5] pt-8">
          <h2 className="mb-8 text-center font-serif text-[28px] italic">
            You may also love.
          </h2>

          <ShopGrid
            products={picks}
            catalog={products.map((p) => p.slug)}
          />
        </section>
      )}
    </div>
  );
}
