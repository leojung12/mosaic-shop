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
import ProductReviews, { getReviews } from "@/components/review/ProductReviews";
import ProductHero from "@/components/product/ProductHero";
import RelatedCarousel from "@/components/product/RelatedCarousel";
import DetailTabs from "@/components/product/DetailTabs";
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
  // 함께 보면 좋은 오브제: 같은 카테고리 물건을 모두 넘겨 가며 보여 준다.
  // 같은 카테고리가 3개보다 적으면 다른 상품으로 3칸을 채운다 (이때는 넘기지 않음)
  const rest = all.filter((p) => p.slug !== slug);
  const sameCategory = rest.filter((p) => p.category === product.category);
  const related =
    sameCategory.length >= 3
      ? sameCategory
      : [...sameCategory, ...rest.filter((p) => p.category !== product.category)].slice(0, 3);
  const index = all.findIndex((p) => p.slug === slug) + 1;
  const pad = (n: number, k = 3) => String(n).padStart(k, "0");
  const cat = categoryOf(product.category);
  const { w, d, h } = product.size;
  const photo = product.images[0] ?? product.cutout;
  // Detail 탭 마지막 사진 뒤에 넣는 작은 이름 — 첫 화면(ProductHero)과 같은 계산을 화면 대신 칸 크기(cqw·cqh) 기준으로
  const nameWords = product.name.split(" ");
  const longestWord = Math.max(...nameWords.map((w) => w.length));
  const miniNameSize = `min(${(88 / (longestWord * 0.72)).toFixed(1)}cqw, ${(62 / nameWords.length).toFixed(1)}cqh)`;
  // 후기 요약 — 가격 아래와 Reviews 제목에 개수·별점을 보여 준다
  const reviews = await getReviews(product.id);
  const reviewAvg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

  return (
    // 1) 첫 화면: 거대한 이름 + 누끼 (숍 격자에서 날아옴)
    // 2) 스크롤: 가운데 한 단 — 이름·가격·노트·구매·접이식 정보 (아르제식 좁은 단)
    // 3) 함께 보면 좋은 오브제 3개
    // 4) DETAIL: 큰 사진이 아래로 쭉 (원본 사진 전체 → 부분 확대 → 질감 확대) 사이사이 짧은 글
    <PageMotion enter={false}>
      <PageTint product={product} />
      <ProductHero product={product} no={index} total={all.length} />

      <article className="px-5 pt-6 pb-10 md:pt-10">
        {/* 2) 가운데 한 단 */}
        <Reveal>
          <div className="mx-auto flex max-w-[440px] flex-col items-center text-center">
            {/* NEW 같은 배지는 첫 화면 스티커 대신 번호 위에 — 검은 네모 + 흰 라벨 글씨 */}
            {product.badge && (
              <p className="label mb-3 bg-(--ink) px-2 py-1 leading-none text-white">{product.badge}</p>
            )}
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
            {reviews.length > 0 && (
              <a href="#reviews" className="label mt-3 text-muted hover:opacity-60">
                <span className="tracking-[0.1em] text-(--current-ink)">★</span> {reviewAvg.toFixed(1)} · 후기{" "}
                {reviews.length}개
              </a>
            )}
            <blockquote className="mt-8 text-[15px] leading-[1.85]">{product.curatorNote}</blockquote>
          </div>
        </Reveal>

        <Reveal order={1}>
          <div className="mx-auto mt-10 max-w-[440px]">
            <BuyBox product={product} />
            <p className="label mt-4 text-center text-muted">
              Ships in {product.leadDays.min}–{product.leadDays.max} business days
            </p>

            {/* 구매 후기 — 위쪽에는 후기만 펼쳐서 보여 준다 (나머지 정보는 아래 Info 탭) */}
            <section id="reviews" className="mt-8 scroll-mt-24 border-t border-current pt-4 text-left">
              <h3 className="label mb-5">
                Reviews{reviews.length > 0 && ` (${reviews.length})`}
                {reviews.length > 0 && <span className="ml-2 text-muted">★ {reviewAvg.toFixed(1)}</span>}
              </h3>
              <ProductReviews productId={product.id} slug={product.slug} reviews={reviews} />
            </section>
          </div>
        </Reveal>

        {/* 3) 함께 보면 좋은 오브제 */}
        <section className="cv-auto mx-auto mt-28 max-w-[880px]">
          <p className="label mb-6 text-center text-muted">{UI.otherObjects}</p>
          <RelatedCarousel products={related} />
        </section>

        {/* 4) DETAIL — 큰 사진이 아래로 쭉 */}
        <section className="cv-auto mx-auto mt-28 max-w-[880px]">
          <DetailTabs
            detail={
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
                <div className="@container relative aspect-square w-full max-w-[560px] overflow-hidden bg-(--tile)">
                  {/* 맨 위 첫 화면의 축소판 — 뒤에 큰 이름, 그 위에 오브제 (글씨 크기는 이 칸 크기에 맞춰 같은 비율로) */}
                  <p
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center font-serif leading-[0.84] tracking-[-0.02em] uppercase select-none"
                    style={{ fontSize: miniNameSize }}
                  >
                    {nameWords.map((word, i) => (
                      <span key={i} className={`whitespace-nowrap ${i % 2 ? "italic" : ""}`}>
                        {word}
                      </span>
                    ))}
                  </p>
                  <span className="absolute inset-[14%] flex items-end justify-center">
                    <ObjectFrame product={product} sizes="(min-width: 768px) 420px, 70vw" morph={false} />
                  </span>
                </div>
                <p className="label text-center text-muted">
                  {BRAND_NAME} — objects chosen slowly, kept for a long time.
                </p>
              </div>
            }
            info={
              <div className="mx-auto mt-14 max-w-[440px] space-y-12 text-left">
                <InfoBlock title="Size & Material">
                  <dl className="label grid grid-cols-[96px_1fr] gap-y-2 normal-case">
                    <dt className="text-muted uppercase">Size</dt>
                    <dd>
                      W {w} × D {d} × H {h} cm
                    </dd>
                    <dt className="text-muted uppercase">Weight</dt>
                    <dd>{product.weightG.toLocaleString("ko-KR")} g</dd>
                    <dt className="text-muted uppercase">Material</dt>
                    <dd className="font-sans">{product.material}</dd>
                  </dl>
                </InfoBlock>
                <InfoBlock title="Shipping">
                  <p className="text-[13px] leading-relaxed">
                    주문 후 영업일 기준 {product.leadDays.min}~{product.leadDays.max}일 안에 출고됩니다. 공급처에서 바로
                    보내 드리며, 다른 상품과 함께 주문하면 따로 도착할 수 있어요.
                  </p>
                  <Link href="/info#shipping" className="label mt-3 inline-block hover:opacity-60">
                    {UI.returnMore}
                  </Link>
                </InfoBlock>
                <InfoBlock title="Exchange / Return">
                  <p className="text-[13px] leading-relaxed">{UI.returnSummary}</p>
                  <Link href="/info#returns" className="label mt-3 inline-block hover:opacity-60">
                    {UI.returnMore}
                  </Link>
                </InfoBlock>
                <InfoBlock title="Product Notice">
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
                </InfoBlock>
                <InfoBlock title="Q&A">
                  <InquiryForm productId={product.id} />
                </InfoBlock>
              </div>
            }
          />
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

// Info 탭 안의 한 묶음: 제목 + 그 아래 내용 (접지 않고 펼친 채로)
function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="label mb-4 border-b border-current/20 pb-2">{title}</h3>
      {children}
    </section>
  );
}
