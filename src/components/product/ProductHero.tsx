"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { ViewTransition, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Sticker from "@/components/fx/Sticker";
import { categoryOf } from "@/config/categories";
import { formatPrice } from "@/config/site";
import { EASE, objectName } from "@/lib/motion";
import type { Product } from "@/types/product";

// 상세 페이지 첫 화면: 상품의 필드 색 위에 거대한 세리프 이름, 그 위에 누끼 오브제.
// 숍 격자에서 누른 누끼가 이 자리로 날아온다 (같은 전환 이름).
export default function ProductHero({ product: p, no, total }: { product: Product; no: number; total: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // 스크롤하면 이름은 느리게, 오브제는 살짝 빠르게 올라가며 아래 상세로 이어진다
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const nameY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "22%"]);
  const objY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "-10%"]);

  const words = p.name.split(" ");
  const longest = Math.max(...words.map((w) => w.length));
  // 가장 긴 단어가 화면 폭의 약 88%가 되도록 (세리프 대문자 한 글자 ≈ 0.72em). 그려진 뒤 실제 폭을 재서 넘치면 줄인다
  const nameSize = `min(${(88 / (longest * 0.72)).toFixed(1)}vw, ${(62 / words.length).toFixed(1)}svh)`;
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const measure = () => {
      const spans = [...el.querySelectorAll("span")];
      const widest = Math.max(...spans.map((s) => s.scrollWidth / fit));
      const room = window.innerWidth * 0.92;
      setFit(widest > room ? room / widest : 1);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // fit 은 측정값을 원래 크기로 되돌리는 데만 쓴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.slug]);
  const ratio = p.cutoutSize.w / p.cutoutSize.h;
  // 실제 높이(cm)에 비례: 키 큰 화병은 크게, 낮은 볼·조약돌은 작게 (화면 높이 20~56%)
  const objH = Math.min(56, Math.max(20, p.size.h * 1.9));
  const pad = (n: number) => String(n).padStart(2, "0");
  const scrollDown = () => {
    const el = ref.current;
    if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - 72, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section ref={ref} data-hero className="relative h-svh min-h-[600px] overflow-hidden">
      <motion.h1
        ref={nameRef}
        style={{ y: nameY, fontSize: fit < 1 ? `calc(${nameSize} * ${fit.toFixed(3)})` : nameSize }}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center font-serif leading-[0.84] tracking-[-0.02em] uppercase will-change-transform select-none"
      >
        {words.map((w, i) => (
          <motion.span
            key={i}
            style={{ whiteSpace: "nowrap" }}
            initial={{ opacity: 0, y: "30%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 1.1, ease: EASE }}
            className={i % 2 ? "italic" : ""}
          >
            {w}
          </motion.span>
        ))}
      </motion.h1>

      <motion.div style={{ y: objY }} className="absolute inset-x-0 bottom-[12svh] flex justify-center will-change-transform">
        <div
          style={
            {
              "--r": ratio,
              height: `min(${objH}svh, calc(64vw / var(--r)))`,
            } as CSSProperties
          }
          className="relative aspect-(--r)"
        >
          <span
            aria-hidden
            className="absolute bottom-0 left-1/2 h-[7%] w-[78%] -translate-x-1/2 translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.38),rgb(0_0_0/0.12)_55%,transparent)] blur-[6px]"
          />
          <ViewTransition name={objectName(p.slug)} share="morph" default="none">
            <div className="absolute inset-0">
              <Image
                src={p.cutout}
                alt={`${p.name} — ${p.color}`}
                fill
                quality={90}
                sizes="(min-width: 768px) 45vw, 80vw"
                preload
                draggable={false}
                className="pointer-events-none object-contain object-bottom select-none"
              />
            </div>
          </ViewTransition>
          {p.badge && <Sticker text={p.badge} active={false} large />}
        </div>
      </motion.div>

      <p className="label absolute top-20 left-5 md:top-24 md:left-8">
        № {pad(no)} <span className="opacity-50">/ {pad(total)}</span>
      </p>
      <p className="label absolute top-20 right-5 text-right md:top-24 md:right-8">
        {categoryOf(p.category)?.label}
        <br />
        <span className="opacity-60">{p.color}</span>
      </p>
      <div className="absolute bottom-6 left-5 md:bottom-8 md:left-8">
        <p className="label">{p.soldOut ? "Sold out" : formatPrice(p.price)}</p>
      </div>
      <button
        type="button"
        onClick={scrollDown}
        className="label hover-line absolute right-5 bottom-6 md:right-8 md:bottom-8"
      >
        Details ↓
      </button>
    </section>
  );
}
