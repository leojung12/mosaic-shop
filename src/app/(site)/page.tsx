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
    
  <div className="relative flex min-h-svh flex-col bg-[#a9c3e2] text-white">
      
<HomeTheme />
<HeroSlides />

{/* 모바일 전용 MOSAIC 로고 */}
<div className="pointer-events-none absolute inset-x-0 top-[35%] z-20 flex justify-center px-4 md:hidden">
  <h1 className="text-center font-serif text-[clamp(48px,15vw,90px)] font-bold leading-none tracking-[-0.07em] text-[#E9A2BB]">
    MOSAIC
  </h1>
</div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-5 pt-16">
        
        


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
