import type { Metadata } from "next";
import ShopView from "@/components/shop/ShopView";
import { BRAND_NAME } from "@/config/site";
import { getBestIds, getProducts } from "@/lib/products";

export const metadata: Metadata = { title: `Shop · ${BRAND_NAME}` };

export default async function ShopPage() {
  const [products, bestIds] = await Promise.all([getProducts(), getBestIds(6)]);
  return <ShopView products={products} bestIds={bestIds} />;
}
