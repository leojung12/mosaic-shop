import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopView from "@/components/shop/ShopView";
import { CATEGORIES, categoryOf } from "@/config/categories";
import { BRAND_NAME } from "@/config/site";
import { getProducts } from "@/lib/products";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  return { title: `${categoryOf(category)?.label ?? "Shop"} · ${BRAND_NAME}` };
}

export default async function CategoryPage(props: PageProps<"/shop/[category]">) {
  const { category } = await props.params;
  if (!categoryOf(category)) notFound();
  return <ShopView products={await getProducts()} category={category} />;
}
