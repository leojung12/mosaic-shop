import { setReviewVisible } from "@/app/admin/actions";
import { PageTitle, formatDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";

// 구매 후기 관리: 부적절한 후기는 숨긴다
export default async function ReviewsAdminPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("reviews")
    .select("id, author, rating, body, is_visible, created_at, product:products(name, color)")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as unknown as {
    id: string;
    author: string;
    rating: number;
    body: string;
    is_visible: boolean;
    created_at: string;
    product: { name: string; color: string } | null;
  }[];
  return (
    <>
      <PageTitle>Reviews</PageTitle>
      {rows.length === 0 ? (
        <p className="label text-muted">No reviews yet.</p>
      ) : (
        <ul className="max-w-[760px] space-y-5">
          {rows.map((r) => (
            <li key={r.id} className={`border-b border-ink/10 pb-4 text-[13px] ${r.is_visible ? "" : "opacity-50"}`}>
              <p className="label mb-1 flex justify-between text-muted">
                <span>
                  {r.product ? `${r.product.name} — ${r.product.color}` : "삭제된 상품"} · {"★".repeat(r.rating)} · {r.author} ·{" "}
                  {formatDate(r.created_at)}
                </span>
                <form action={setReviewVisible.bind(null, r.id, !r.is_visible)}>
                  <button className="hover:text-ink">{r.is_visible ? "숨기기" : "다시 보이기"}</button>
                </form>
              </p>
              <p className="whitespace-pre-wrap">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
