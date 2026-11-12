import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/config/categories";
import { SITE_URL } from "@/config/site";
import { getProducts } from "@/lib/products";

// 검색엔진용 사이트맵 (/sitemap.xml)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/shop`, priority: 0.9 },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/shop/${c.slug}`, priority: 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, priority: 0.8 })),
    { url: `${SITE_URL}/info`, priority: 0.3 },
  ];
}
