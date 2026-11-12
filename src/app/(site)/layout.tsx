import { Suspense } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import TintReset from "@/components/TintReset";
import HiddenFx from "@/components/fx/HiddenFx";
import CartDrawer from "@/components/cart/CartDrawer";
import { getShopSettings } from "@/lib/shop-settings";

// 손님용 화면 공통 틀 (관리자 화면은 /admin 레이아웃을 따로 쓴다)
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <SmoothScroll>
      <TintReset />
      <HiddenFx />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* 장바구니 서랍은 주소(usePathname)를 읽어서 Suspense 안에 둔다 */}
      <Suspense fallback={null}>
        <Bag />
      </Suspense>
    </SmoothScroll>
  );
}

async function Bag() {
  return <CartDrawer settings={await getShopSettings()} />;
}
