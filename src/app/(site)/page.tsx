
import Link from "next/link";
import HeroSlides from "@/components/home/HeroSlides";
import HomeTheme from "@/components/home/HomeTheme";
import { CATEGORIES } from "@/config/categories";

export default function HomePage() {
  return (
    <div className="relative flex min-h-svh flex-col bg-[#a9c3e2] text-white">
      <HomeTheme />
      <HeroSlides />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-5 pt-16">
      </div>

      <nav aria-label="Categories" className="relative z-10 px-5 pb-4 md:pb-6">
        <ul className="label flex flex-wrap items-baseline justify-center gap-x-5 gap-y-1.5 md:gap-x-7">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/shop/${c.slug}`}
                className="hover-line text-white/80 hover:text-white"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
