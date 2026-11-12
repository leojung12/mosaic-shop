import Link from "next/link";
import AccountLink from "@/components/AccountLink";
import BagButton from "@/components/cart/BagButton";
import HeaderBrand from "@/components/HeaderBrand";
import Clock from "@/components/fx/Clock";
import { UI } from "@/config/site";

// 왼쪽 로고 / 가운데 서울 시계 / 오른쪽 SHOP · LOGIN · INFO · BAG
export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 grid grid-cols-[1fr_auto] items-center gap-3 px-5 pt-[calc(18px+env(safe-area-inset-top))] md:grid-cols-[1fr_auto_1fr] md:px-8 md:pt-6">
      <div className="flex h-6 items-center">
        <HeaderBrand />
      </div>
      <div className="hidden md:block">
        <Clock />
      </div>
      <nav className="flex items-center justify-end gap-3.5 md:gap-5">
        <Link href="/shop" className="label hover-line">
          Shop
        </Link>
        <Link href="/search" className="label hover-line hidden sm:inline">
          Search
        </Link>
        <AccountLink />
        <Link href="/info" className="label hover-line">
          {UI.info}
        </Link>
        <BagButton />
      </nav>
    </header>
  );
}
