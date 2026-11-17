"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import ObjectFrame from "@/components/product/ObjectFrame";
import { formatPrice } from "@/config/site";
import { EASE } from "@/lib/motion";
import type { Product } from "@/types/product";

const VISIBLE = 3; // 한 번에 보이는 개수
const INTERVAL = 3200; // 넘어가는 간격 (ms)

// 함께 보면 좋은 오브제 — 3칸은 그대로, 몇 초마다 안의 물건이 한 칸씩 왼쪽으로 흘러간다 (칸은 고정).
// 마우스를 올리거나(데스크톱) 손가락으로 누르고 있으면 멈춘다. 움직임 줄이기 설정이면 넘기지 않는다.
export default function RelatedCarousel({ products }: { products: Product[] }) {
  const reduce = useReducedMotion();
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = products.length;
  const rotates = n > VISIBLE && !reduce;

  useEffect(() => {
    if (!rotates || paused) return;
    const id = window.setInterval(() => setStart((s) => (s + 1) % n), INTERVAL);
    return () => window.clearInterval(id);
  }, [rotates, paused, n]);

  const shown = Array.from({ length: Math.min(VISIBLE, n) }, (_, i) => products[(start + i) % n]);

  return (
    <ul
      className="grid grid-cols-3 gap-3 md:gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {shown.map((p, i) => {
        // 칸(회색 타일)은 제자리에 두고, 안의 물건·글씨만 바뀐다.
        // 겹쳐 보이는 잔상이 없도록 원래 것이 먼저 빠르게 사라진 뒤 새것이 들어온다. 칸마다 살짝 시차를 둬 흐르듯이.
        const delay = i * 0.08;
        const enter = { duration: 0.7, ease: EASE, delay };
        const leave = { duration: 0.3, ease: EASE, delay };
        return (
          <li key={i}>
            <Link href={`/product/${p.slug}`} prefetch={true} className="group block text-center">
              <span className="relative block aspect-square overflow-hidden bg-(--tile) transition-colors duration-500 group-hover:bg-(--tile-hover)">
                <AnimatePresence initial={false} mode="wait">
                  <motion.span
                    key={p.slug}
                    className="absolute inset-[16%] flex items-end justify-center"
                    initial={{ opacity: 0, x: "8%" }}
                    animate={{ opacity: 1, x: 0, transition: enter }}
                    exit={{ opacity: 0, x: "-8%", transition: leave }}
                  >
                    <ObjectFrame product={p} sizes="(min-width: 768px) 280px, 30vw" />
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="mt-3 grid">
                <AnimatePresence initial={false} mode="wait">
                  <motion.span
                    key={p.slug}
                    className="[grid-area:1/1]"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0, transition: enter }}
                    exit={{ opacity: 0, x: -6, transition: leave }}
                  >
                    <span className="block font-serif text-[14px] leading-tight md:text-[18px]">{p.name}</span>
                    <span className="label mt-1 block text-muted">{formatPrice(p.price)}</span>
                  </motion.span>
                </AnimatePresence>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
