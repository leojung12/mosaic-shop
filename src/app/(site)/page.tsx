import Link from "next/link";
import { ViewTransition } from "react";
import { BRAND_VT } from "@/lib/motion";
import Footer from "@/components/Footer";
import HeroSlides from "@/components/home/HeroSlides";
import HomeTheme from "@/components/home/HomeTheme";
import { ClubWordmark } from "@/components/Logo";
import { CATEGORIES } from "@/config/categories";
import { BRAND_NAME } from "@/config/site";

// 시작 화면: 화면 전체에 빈티지 색감 사진(어둡게) → 가운데 흰 동아리 로고 + 소개 → 아래 카테고리.
// 소개 문구는 '타일을 한 조각씩 모아 모자이크를 만든다'는 이름 뜻에서 나왔다.
// 이 화면에서만 헤더·footer 글자가 흰색 (HomeTheme 가 <html data-home> 을 켠다 → globals.css)
export default function HomePage() {
  return (
    <div className="relative flex h-svh min-h-[560px] flex-col overflow-hidden text-white">
      <HomeTheme />
      <HeroSlides />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-5 pt-16">
        <h1 className="w-[min(72vw,440px)]">
          {/* 다른 화면으로 가면 이 로고가 왼쪽 위 작은 로고 자리로 날아간다 (HeaderBrand 와 같은 전환 이름) */}
          <ViewTransition name={BRAND_VT} share="morph" default="none">
            <ClubWordmark className="block w-full" />
          </ViewTransition>
        </h1>
        <p className="label max-w-[440px] text-center leading-[1.8] text-white/85">
          {BRAND_NAME}, a small curated store in Seoul.
          <br />
          Objects gathered one piece at a time, each one chosen slowly.
        </p>
      </div>
      <nav aria-label="Categories" className="relative z-10 px-5 pb-4 md:pb-6">
        <ul className="label flex flex-wrap items-baseline justify-center gap-x-5 gap-y-1.5 md:gap-x-7">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/shop/${c.slug}`} className="hover-line text-white/80 hover:text-white">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="relative z-10">
        <Footer compact />
      </div>
    </div>
  );
}
