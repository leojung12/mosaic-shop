import { cacheLife, cacheTag } from "next/cache";
import { publicClient } from "@/lib/supabase/public";
import type { ProductRow } from "@/lib/supabase/types";
import type { Product } from "@/types/product";

// 상품 데이터는 Supabase에서 읽고 캐시한다. 관리자가 수정하면 updateTag(PRODUCTS_TAG)로 즉시 갱신.
export const PRODUCTS_TAG = "products";

// displayHeight(vh) = 실물 높이(cm) × 이 값. 실물 비율을 대략 맞춘다.
export const VH_PER_CM = 1.1;

export const rowToProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  color: r.color,
  price: r.price,
  tint: r.tint,
  tintIsDark: r.tint_is_dark,
  cutout: r.cutout,
  cutoutSize: { w: r.cutout_w, h: r.cutout_h },
  images: r.images,
  displayHeight: Math.round(Number(r.size_h) * VH_PER_CM * 10) / 10,
  curatorNote: r.curator_note,
  size: { w: Number(r.size_w), d: Number(r.size_d), h: Number(r.size_h) },
  weightG: r.weight_g,
  material: r.material,
  leadDays: { min: r.lead_min, max: r.lead_max },
  externalUrl: r.external_url ?? undefined,
  notice: r.notice,
  soldOut: r.sold_out,
  badge: r.badge,
  category: r.category,
  field: r.field ?? r.tint,
});

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`상품을 불러오지 못했습니다: ${error.message}`);
  return (data as ProductRow[]).map(rowToProduct);
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();
  if (error) throw new Error(`상품을 불러오지 못했습니다: ${error.message}`);
  return data ? rowToProduct(data as ProductRow) : null;
}

// 숍 'Best' 섹션: 최근 30일 조회·클릭이 많은 상품 id (DB 함수 best_product_ids). 한 시간 단위로 캐시
export async function getBestIds(limit = 6): Promise<string[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");
  const { data, error } = await publicClient().rpc("best_product_ids", { p_limit: limit });
  if (error) return [];
  return (data as { product_id: string }[]).map((r) => r.product_id);
}
