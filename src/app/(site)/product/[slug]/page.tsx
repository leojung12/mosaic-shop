import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import BuyBox from "@/components/product/BuyBox";
import ObjectFrame from "@/components/product/ObjectFrame";
import InquiryForm from "@/components/product/InquiryForm";
import HomeLink from "@/components/HomeLink";
import PageMotion from "@/components/PageMotion";
import Reveal from "@/components/Reveal";
import PageTint from "@/components/product/PageTint";
import ProductReviews from "@/components/review/ProductReviews";
import ProductHero from "@/components/product/ProductHero";
import { categoryOf } from "@/config/categories";
import { BRAND_NAME, UI, formatPrice } from "@/config/site";
import { getProduct, getProducts } from "@/lib/products";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProduct(slug);
  if (!p) return {};
  const title = `${p.name} — ${p.color} · ${BRAND_NAME}`;
  return {
    title,
    description: p.curatorNote,
    openGraph: { title, description: p.curatorNote, images: [{ url: p.images[0] ?? p.cutout }] },
  };
}

export default function ProductPage(props: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <ProductDetail params={props.params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const all = await getProducts();
  // 같은 카테고리를 먼저, 모자라면 다른 상품으로 채운다
  const rest = all.filter((p) => p.slug !== slug);
  const related = [
    ...rest.filter((p) => p.category === product.category),
    ...rest.filter((p) => p.category !== product.category),
  ].slice(0, 3);
  const index = all.findIndex((p) => p.slug === slug) + 1;
  const pad = (n: number, k = 3) => String(n).padStart(k, "0");
  const cat = categoryOf(product.category);
  const { w, d, h } = product.size;
  const photo = product.images[0] ?? product.cutout;

  return (
    // 1) 첫 화면: 거대한 이름 + 누끼 (숍 격자에서 날아옴)
    // 2) 스크롤: 가운데 한 단 — 이름·가격·노트·구매·접이식 정보 (아르제식 좁은 단)
    // 3) 함께 보면 좋은 오브제 3개
    // 4) DETAIL: 큰 사진이 아래로 쭉 (원본 사진 전체 → 부분 확대 → 질감 확대) 사이사이 짧은 글
    <PageMotion enter={false}>
      <PageTint product={product} />
      <ProductHero product={product} no={index} total={all.length} />

      <article className="px-5 pt-20 pb-10 md:pt-28">
        {/* 2) 가운데 한 단 */}
        <Reveal>
          <div className="mx-auto flex max-w-[440px] flex-col items-center text-center">
            <p className="label text-muted">
              No. {pad(index)}
              {cat && (
                <>
                  <span className="mx-2">/</span>
                  <Link href={`/shop/${cat.slug}`} className="hover-line">
                    {cat.label}
                  </Link>
                </>
              )}
            </p>
            <h2 className="mt-5 font-serif text-[34px] leading-none md:text-[40px]">{product.name}</h2>
            <p className="label mt-3 text-muted">{product.color}</p>
            <p className="label mt-4 text-[13px] text-(--current-ink)">
              {product.soldOut ? "Sold out" : formatPrice(product.price)}
            </p>
            <blockquote className="mt-8 text-[15px] leading-[1.85]">{product.curatorNote}</blockquote>
          </div>
        </Reveal>

        <Reveal order={1}>
          <div className="mx-auto mt-10 max-w-[440px]">
            <BuyBox product={product} />
            <p className="label mt-4 text-center text-muted">
              Ships in {product.leadDays.min}–{product.leadDays.max} business days
            </p>

            <div className="mt-8 border-t border-current">
              <Disclosure title="Size & Material" open>
                <dl className="label grid grid-cols-[96px_1fr] gap-y-2 text-left normal-case">
                  <dt className="text-muted uppercase">Size</dt>
                  <dd>
                    W {w} × D {d} × H {h} cm
                  </dd>
                  <dt className="text-muted uppercase">Weight</dt>
                  <dd>{product.weightG.toLocaleString("ko-KR")} g</dd>
                  <dt className="text-muted uppercase">Material</dt>
                  <dd className="font-sans">{product.material}</dd>
                </dl>
              </Disclosure>
              <Disclosure title="Shipping">
                <p className="text-[13px] leading-relaxed">
                  주문 후 영업일 기준 {product.leadDays.min}~{product.leadDays.max}일 안에 출고됩니다. 공급처에서 바로
                  보내 드리며, 다른 상품과 함께 주문하면 따로 도착할 수 있어요.
                </p>
                <Link href="/info#shipping" className="label mt-3 inline-block hover:opacity-60">
                  {UI.returnMore}
                </Link>
              </Disclosure>
              <Disclosure title="Exchange / Return">
                <p className="text-[13px] leading-relaxed">{UI.returnSummary}</p>
                <Link href="/info#returns" className="label mt-3 inline-block hover:opacity-60">
                  {UI.returnMore}
                </Link>
              </Disclosure>
              <Disclosure title="Product Notice">
                <table className="w-full text-left text-[13px]">
                  <tbody>
                    {Object.entries(product.notice).map(([k, v]) => (
                      <tr key={k} className="border-b border-current/10 last:border-0">
                        <th className="w-2/5 py-2 pr-3 align-top font-normal text-muted">{k}</th>
                        <td className="py-2">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Disclosure>
              <Disclosure title="Reviews">
                <Suspense fallback={<p className="text-[13px] text-muted">Loading…</p>}>
                  <ProductReviews productId={product.id} slug={product.slug} />
                </Suspense>
              </Disclosure>
              <Disclosure title="Q&A">
                <InquiryForm productId={product.id} />
              </Disclosure>
            </div>
          </div>
        </Reveal>

        {/* 3) 함께 보면 좋은 오브제 */}
        <section className="cv-auto mx-auto mt-28 max-w-[880px]">
          <p className="label mb-6 text-center text-muted">{UI.otherObjects}</p>
          <ul className="grid grid-cols-3 gap-3 md:gap-6">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} prefetch={true} className="group block text-center">
                  <span className="relative block aspect-square bg-(--tile) transition-colors duration-500 group-hover:bg-(--tile-hover)">
                    <span className="absolute inset-[16%] flex items-end justify-center">
                      <ObjectFrame product={p} sizes="(min-width: 768px) 280px, 30vw" />
                    </span>
                  </span>
                  <span className="mt-3 block font-serif text-[14px] leading-tight md:text-[18px]">{p.name}</span>
                  <span className="label mt-1 block text-muted">{formatPrice(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 4) DETAIL — 큰 사진이 아래로 쭉 */}
        <section className="cv-auto mx-auto mt-28 max-w-[880px]">
          <div className="label flex border-b border-current/20">
            <span className="flex-1 border-b border-current pb-3 text-center">Detail</span>
            <span className="flex-1 pb-3 text-center text-muted">No. {pad(index)}</span>
          </div>

          <div className="mt-14 flex flex-col items-center gap-14 md:gap-20">
            <DetailShot src={photo} alt={`${product.name} — ${product.color}`} />
            <p className="max-w-[440px] text-center font-serif text-[22px] leading-[1.35] md:text-[28px]">
              {product.name.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())}, in {product.color.toLowerCase()}.
            </p>
            <DetailShot src={photo} alt="" zoom={1.8} focus="50% 30%" />
            <div className="label max-w-[440px] text-center leading-[2] text-muted">
              {product.material}
              <br />W {w} × D {d} × H {h} cm · {product.weightG.toLocaleString("ko-KR")} g
            </div>
            <DetailShot src={photo} alt="" zoom={2.6} focus="55% 60%" />
            <div className="relative aspect-square w-full max-w-[560px] bg-(--tile)">
              <span className="absolute inset-[14%] flex items-end justify-center">
                <ObjectFrame product={product} sizes="(min-width: 768px) 420px, 70vw" />
              </span>
            </div>
            <p className="label text-center text-muted">
              {BRAND_NAME} — objects chosen slowly, kept for a long time.
            </p>
          </div>
        </section>

        <div className="mt-20 flex justify-center">
          <HomeLink href="/shop" className="label hover-line">
            ← Back to shop
          </HomeLink>
        </div>
      </article>
    </PageMotion>
  );
}

// 큰 디테일 사진. zoom 을 주면 같은 원본(긴 변 3200px)의 일부를 확대해 보여 준다 — 질감·마감 컷
function DetailShot({ src, alt, zoom = 1, focus = "50% 50%" }: { src: string; alt: string; zoom?: number; focus?: string }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-(--tile)">
      <Image
        src={src}
        alt={alt}
        fill
        quality={90}
        // 확대한 만큼 큰 원본을 받아야 흐리지 않다
        sizes={`(min-width: 768px) ${Math.round(880 * zoom)}px, ${Math.round(100 * zoom)}vw`}
        className="object-cover"
        style={{ transform: `scale(${zoom})`, transformOrigin: focus }}
      />
    </div>
  );
}

function Disclosure({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-current/20 text-left">
      <summary className="label flex cursor-pointer list-none items-center justify-between py-3.5 [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}
