"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import ObjectFrame from "@/components/product/ObjectFrame";
import { formatPrice } from "@/config/site";
import { homeMemory, rememberHome } from "@/lib/motion";
import { track } from "@/lib/track";
import type { Product } from "@/types/product";

// 숍 격자: 칸마다 누끼 하나 (아르제 숍 비율 438:513, 이름·가격 없이 사진만). 호버하면 칸이 그 상품의 필드 색으로 물들고 오브제가 살짝 뜬다.
// 누르면 누끼가 상세 첫 화면의 큰 오브제로 날아간다.
export default function ShopGrid({
  products,
  catalog,
  morph,
}: {
  products: Product[];
  catalog?: string[]; // 카탈로그 번호 기준 (전체 상품 순서)
  morph?: string[]; // 전환 이름을 가질 상품 (한 화면에 같은 상품이 여러 번 나올 때)
}) {
  const list = products;

  // 상세에서 돌아오면 방금 본 상품 칸이 화면 안에 오도록 (그래야 오브제가 제자리로 날아온다)
  const items = useRef(new Map<string, HTMLElement>());
  const restoreY = useRef<number | null>(null);
  const lenis = useLenis();
  useLayoutEffect(() => {
    const el = homeMemory.slug ? items.current.get(homeMemory.slug) : undefined;
    if (!el) return;
    rememberHome({ slug: null });
    const r = el.getBoundingClientRect();
    restoreY.current = Math.max(0, window.scrollY + r.top - (window.innerHeight - r.height) / 2);
    window.scrollTo(0, restoreY.current);
  }, []);
  useEffect(() => {
    if (!lenis || restoreY.current === null) return;
    lenis.resize();
    lenis.scrollTo(restoreY.current, { immediate: true, force: true });
  }, [lenis]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12">
        {list.map((p, i) => (
          <li
            key={p.slug}
            ref={(el) => {
              if (el) items.current.set(p.slug, el);
              else items.current.delete(p.slug);
            }}
          >
            <Card
              no={catalog ? catalog.indexOf(p.slug) + 1 : i + 1}
              morph={morph ? morph.includes(p.slug) : true}
              product={p}
              eager={i < 8}
              onOpen={() => {
                rememberHome({ slug: p.slug });
                track("click", p.id);
              }}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function Card({
  no,
  morph,
  product: p,
  eager,
  onOpen,
}: {
  no: number;
  morph: boolean;
  product: Product;
  eager: boolean;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/product/${p.slug}`}
      prefetch={true}
      onClick={onOpen}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group block outline-none"
    >
      <div
        style={{ backgroundColor: hover ? p.field : undefined }}
        className="relative aspect-[438/513] bg-white transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-visible:ring-1 group-focus-visible:ring-current"
      >
        <div className="absolute inset-x-[17%] top-[17%] bottom-[19%] flex items-end justify-center">
          {/* 바닥 그림자 */}
          <span
            aria-hidden
            className={`absolute bottom-0 left-1/2 h-[6%] w-[70%] -translate-x-1/2 translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.28),transparent)] blur-[4px] transition-[scale,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              hover ? "scale-x-[0.8] opacity-60" : ""
            }`}
          />
          <div
            className={`relative flex h-full w-full items-end justify-center transition-[translate,scale] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              hover ? "-translate-y-[3%] scale-[1.04]" : ""
            }`}
          >
            <ObjectFrame
              product={p}
              sizes="(min-width: 1000px) 450px, 46vw"
              preload={eager}
              morph={morph}
            />
          </div>
        </div>
        {p.badge && (
          <span
            aria-hidden
            className={`absolute top-3 right-3 flex size-[46px] items-center justify-center rounded-full bg-(--accent) text-center font-mono text-[9px] leading-[1.05] font-medium text-[#ffffff] uppercase transition-[rotate,scale] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:top-4 md:right-4 md:size-[52px] md:text-[9.5px] ${
              hover ? "scale-110 rotate-0" : "-rotate-[14deg]"
            }`}
          >
            <span className="max-w-[80%]">{p.badge}</span>
          </span>
        )}
        {/* 카탈로그 번호 */}
        <span className="label absolute top-3 left-3 text-muted tabular-nums md:top-4 md:left-4">
          No. {String(no).padStart(3, "0")}
        </span>
        {p.soldOut && <span className="label absolute bottom-3 left-3 md:bottom-4 md:left-4">Sold out</span>}
      </div>
      {/* 이름·가격은 격자에 쓰지 않는다 (화면 읽기용만) */}
      <span className="sr-only">
        {p.name}, {p.color}, {formatPrice(p.price)}
      </span>
    </Link>
  );
}
