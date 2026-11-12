import { publicClient } from "@/lib/supabase/public";

const TYPES = new Set(["view", "hover", "click"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 방문·호버·클릭 기록 저장. 실패해도 손님 화면에는 영향 없음.
export async function POST(request: Request) {
  let payload: { type?: unknown; productId?: unknown; visitor?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { type, productId, visitor } = payload;
  if (typeof type !== "string" || !TYPES.has(type)) return new Response(null, { status: 400 });
  if (typeof productId !== "string" || !UUID.test(productId)) return new Response(null, { status: 400 });

  await publicClient()
    .from("events")
    .insert({
      type,
      product_id: productId,
      visitor: typeof visitor === "string" && UUID.test(visitor) ? visitor : null,
    });
  return new Response(null, { status: 204 });
}
