
import Link from "next/link";
import HeaderBrand from "@/components/HeaderBrand";
import Clock from "@/components/fx/Clock";
import { UI } from "@/config/site";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-[#24354A]/10 bg-[#A9C3E2]/85 px-4 py-4 text-[#24354A] backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-5">

        <div className="hidden items-center md:flex">
          <HeaderBrand />
        </div>

        <div className="hidden md:block">
          <Clock />
        </div>

        <nav
          aria-label="Main navigation"
          className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium tracking-[0.12em] md:w-auto md:flex-nowrap md:justify-end md:gap-5"
        >
          <Link href="/shop" className="hover:opacity-60">
            SHOP
          </Link>

          <Link href="/search" className="hover:opacity-60">
            SEARCH
          </Link>

          <Link href="/info" className="hover:opacity-60">
            {UI.info}
          </Link>
        </nav>
      </div>
    </header>
  );
}
