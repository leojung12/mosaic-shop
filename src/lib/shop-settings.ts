import { cacheLife, cacheTag } from "next/cache";
import type { ShopSettings } from "@/lib/orders";
import { publicClient } from "@/lib/supabase/public";

// 배송비 설정 (관리자 화면에서 바꾸면 SETTINGS_TAG 로 갱신)
export const SETTINGS_TAG = "shop-settings";

export async function getShopSettings(): Promise<ShopSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const { data } = await publicClient().from("shop_settings").select("*").eq("id", 1).single();
  return { shippingFee: data?.shipping_fee ?? 3000, freeShippingOver: data?.free_shipping_over ?? 50000 };
}
