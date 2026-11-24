
import Link from "next/link";
import HeaderBrand from "@/components/HeaderBrand";
import Clock from "@/components/fx/Clock";
import { UI } from "@/config/site";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-[#24354A]/10 bg-[#A9C3E2]/90 text-[#24354A] backdrop-blur-xl">
      <div className="mx-auto grid h-[64px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-8 lg:px-12">

        {/* Left navigation */}
        <nav className="flex items-center gap-7 text-[13px] font-medium tracking-[0.18em]">
          <Link
            href="/shop"
            className="transition-opacity duration-300 hover:opacity-50"
          >
            SHOP
          </Link>

          <Link
            href="/info"
            className="hidden transition-opacity duration-300 hover:opacity-50 md:block"
          >
            {UI.info}
          </Link>
        </nav>

        {/* Center logo */}
        <div className="flex scale-125 items-center justify-center">
          <HeaderBrand />
        </div>

        {/* Right navigation */}
        <div className="flex items-center justify-end gap-6">

          <div className="hidden text-xs lg:block">
            <Clock />
          </div>

          <Link
            href="/search"
            aria-label="Search"
            className="flex items-center gap-2 transition-opacity duration-300 hover:opacity-50"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>

            <span className="hidden text-[11px] tracking-[0.15em] md:block">
              SEARCH
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
