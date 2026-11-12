import { publicClient } from "@/lib/supabase/public";
import ReviewForm from "./ReviewForm";

type Review = { id: string; author: string; rating: number; body: string; created_at: string };

// 상품 상세의 구매 후기 (요청 때마다 읽는다)
export async function getReviews(productId: string) {
  const { data } = await publicClient()
    .from("reviews")
    .select("id, author, rating, body, created_at")
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Review[];
}

export default async function ProductReviews({ productId, slug }: { productId: string; slug: string }) {
  const reviews = await getReviews(productId);
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  return (
    <div className="space-y-6">
      {reviews.length > 0 ? (
        <>
          <p className="text-[13px]">
            <span className="tracking-[0.1em]">{"★".repeat(Math.round(avg))}</span>
            <span className="opacity-20 tracking-[0.1em]">{"★".repeat(5 - Math.round(avg))}</span>
            <span className="ml-2 text-muted">
              {avg.toFixed(1)} · {reviews.length}개
            </span>
          </p>
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-current/10 pb-4 text-[13px]">
                <p className="label mb-1 text-muted">
                  {"★".repeat(r.rating)} · {r.author} · {new Date(r.created_at).toLocaleDateString("ko-KR")}
                </p>
                <p className="leading-relaxed whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-[13px] text-muted">아직 후기가 없어요.</p>
      )}
      <ReviewForm productId={productId} slug={slug} />
    </div>
  );
}
