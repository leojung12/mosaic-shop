"use client";

import { getImageProps } from "next/image";
import { useEffect, useState } from "react";

// 시작 화면 배경: 화면 전체에 빈티지 색감 사진이 깔리고 어둡게(딤) 덮인다. 4.5초마다 부드럽게 겹쳐 바뀐다.
// 사진은 미드저니 업스케일 — 리소 인쇄 콜라주(단색 빈티지 바탕 + 흑백 망점 오려붙이기), 글씨 없음.
// 가로 화면은 16:9 (riso-*.webp), 세로 화면(휴대폰)은 따로 뽑은 9:16 (riso-*-tall3.webp) — 잘리지 않게
const SLIDES = [
  { key: "blue", alt: "Risograph collage — a hand holding a single tile on blue" },
  { key: "mustard", alt: "Risograph collage — hands laying small tiles on mustard" },
  { key: "red", alt: "Risograph collage — an old ceramic vase on red" },
  { key: "green", alt: "Risograph collage — a lit candlestick on green" },
  { key: "pink", alt: "Risograph collage — stacked river stones on pink" },
];

// 화면 비율에 따라 가로/세로 사진을 고른다 (<picture> 아트 디렉션)
function Slide({ name, priority }: { name: string; priority: boolean }) {
  const common = { alt: "", sizes: "100vw", quality: 85 };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, src: `/home/riso-${name}.webp`, width: 2560, height: 1371 });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, src: `/home/riso-${name}-tall3.webp`, width: 1440, height: 2560, priority });
  return (
    <picture>
      <source media="(min-aspect-ratio: 1/1)" srcSet={wide} />
      <source srcSet={tall} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- 장식 이미지 (alt="" 는 rest 에 들어 있다) */}
      <img {...rest} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  );
}
const DELAY = 4500;

export default function HeroSlides() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % SLIDES.length);
    }, DELAY);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-[#1a1714]">
        {SLIDES.map((s, i) => {
          const n = SLIDES.length;
          // 지금 장·다음 장(미리 받기)·방금 장(사라지는 중)만 붙여 메모리와 디코딩 부담을 줄인다
          const near = i === index || i === (index + 1) % n || i === (index + n - 1) % n;
          return (
            <div
              key={s.key}
              className="absolute inset-0 transition-opacity duration-[1000ms] ease-in-out will-change-[opacity]"
              style={{ opacity: i === index ? 1 : 0 }}
            >
              {near && <Slide name={s.key} priority={i === 0} />}
            </div>
          );
        })}
        {/* 전체 딤: 글자가 읽히게 어둡게, 아래쪽은 조금 더 */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
      </div>
      <p className="sr-only">{SLIDES[index].alt}</p>
      <p className="label absolute right-5 bottom-[calc(14px+env(safe-area-inset-bottom))] z-10 tabular-nums text-white/70 md:right-8">
        {index + 1} / {SLIDES.length}
      </p>
    </>
  );
}
