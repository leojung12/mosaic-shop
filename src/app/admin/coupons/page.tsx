import { toggleCoupon } from "@/app/admin/actions";
import CouponForm from "@/components/admin/CouponForm";
import { PageTitle, formatDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";

type Coupon = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  memo: string;
};

// 쿠폰 발행·관리. 손님은 주문서에서 코드를 입력한다 (할인은 DB가 계산)
export default async function CouponsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Coupon[];
  return (
    <>
      <PageTitle>Coupons</PageTitle>
      <div className="grid gap-12 md:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="label text-muted">No coupons yet.</p>
          ) : (
            <table className="w-full min-w-[620px] text-[13px]">
              <thead className="label text-left text-muted">
                <tr className="border-b border-ink/15">
                  <th className="py-2 font-normal">코드</th>
                  <th className="py-2 font-normal">할인</th>
                  <th className="py-2 font-normal">조건</th>
                  <th className="py-2 font-normal">사용</th>
                  <th className="py-2 font-normal">기간</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={`border-b border-ink/10 ${c.is_active ? "" : "text-muted"}`}>
                    <td className="py-2 font-medium">
                      {c.code}
                      {c.memo && <span className="block text-[11px] font-normal text-muted">{c.memo}</span>}
                    </td>
                    <td className="py-2">
                      {c.kind === "percent" ? `${c.value}%` : `${c.value.toLocaleString()}원`}
                      {c.max_discount ? ` (최대 ${c.max_discount.toLocaleString()}원)` : ""}
                    </td>
                    <td className="py-2">{c.min_order ? `${c.min_order.toLocaleString()}원 이상` : "—"}</td>
                    <td className="py-2 tabular-nums">
                      {c.used_count}
                      {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                    </td>
                    <td className="py-2 tabular-nums">
                      {c.starts_at ? formatDate(c.starts_at).slice(0, 8) : "—"} ~ {c.ends_at ? formatDate(c.ends_at).slice(0, 8) : ""}
                    </td>
                    <td className="py-2 text-right">
                      <form action={toggleCoupon.bind(null, c.id, !c.is_active)}>
                        <button className="label hover:opacity-60">{c.is_active ? "끄기" : "켜기"}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <section>
          <h2 className="label mb-4 border-b border-ink/15 pb-2">새 쿠폰</h2>
          <CouponForm />
        </section>
      </div>
    </>
  );
}
