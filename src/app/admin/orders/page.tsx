import Link from "next/link";
import CsvButton from "@/components/admin/CsvButton";
import SettingsForm from "@/components/admin/SettingsForm";
import { PageTitle, formatDate } from "@/components/admin/ui";
import { formatPrice } from "@/config/site";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUS, type Order, type OrderStatus } from "@/lib/orders";

const FILTERS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "todo", label: "처리할 주문", statuses: ["paid", "preparing"] },
  { key: "shipped", label: "배송 중", statuses: ["shipped"] },
  { key: "done", label: "완료", statuses: ["delivered"] },
  { key: "canceled", label: "취소·환불", statuses: ["canceled", "refunded"] },
  { key: "pending", label: "결제 대기", statuses: ["pending"] },
];

const RETURNS = { key: "returns", label: "교환·반품 요청", statuses: [] as OrderStatus[] };

// 주문 목록. 결제 완료 → (공급처 발주) 상품 준비 중 → 송장 입력하면 배송 중 → 배송 완료
export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase } = await requireAdmin();
  const q = await searchParams;
  const filter = FILTERS.find((f) => f.key === q.f) ?? (q.f === "returns" ? RETURNS : FILTERS[0]);
  const [{ data }, { data: settings }] = await Promise.all([
    filter.key === "returns"
      ? supabase
          .from("orders")
          .select("*, items:order_items(*), returns:return_requests!inner(status)")
          .eq("returns.status", "requested")
          .order("created_at", { ascending: false })
          .limit(300)
      : supabase
          .from("orders")
          .select("*, items:order_items(*)")
          .in("status", filter.statuses)
          .order("created_at", { ascending: false })
          .limit(300),
    supabase.from("shop_settings").select("*").eq("id", 1).single(),
  ]);
  const rows = (data ?? []) as (Order & { admin_memo: string })[];

  // 공급처 발주용 CSV (상품 한 줄씩)
  const csv = [
    ["주문번호", "상태", "주문일", "상품", "색", "수량", "받는 분", "연락처", "우편번호", "주소", "배송 메모"],
    ...rows.flatMap((o) =>
      o.items.map((i) => [
        o.order_number,
        ORDER_STATUS[o.status],
        o.created_at,
        i.name,
        i.color,
        String(i.quantity),
        o.recipient_name,
        o.recipient_phone,
        o.zipcode,
        `${o.address1} ${o.address2}`.trim(),
        o.delivery_memo,
      ]),
    ),
  ];

  return (
    <>
      <PageTitle aside={<CsvButton rows={csv} filename={`orders-${filter.key}.csv`} />}>Orders</PageTitle>
      <nav className="label mb-6 flex flex-wrap gap-4">
        {[...FILTERS, RETURNS].map((f) => (
          <Link key={f.key} href={`/admin/orders?f=${f.key}`} className={f.key === filter.key ? "underline underline-offset-4" : "text-muted hover:text-ink"}>
            {f.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="label text-muted">No orders.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="label text-left text-muted">
              <tr className="border-b border-ink/15">
                <th className="py-2 font-normal">주문번호</th>
                <th className="py-2 font-normal">주문일</th>
                <th className="py-2 font-normal">상품</th>
                <th className="py-2 font-normal">받는 분</th>
                <th className="py-2 text-right font-normal">금액</th>
                <th className="py-2 pl-4 font-normal">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-ink/10 hover:bg-ink/[0.03]">
                  <td className="py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="underline underline-offset-2">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="py-2.5 tabular-nums">{formatDate(o.created_at)}</td>
                  <td className="py-2.5">{o.order_name}</td>
                  <td className="py-2.5">{o.recipient_name}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatPrice(o.total_amount)}</td>
                  <td className="py-2.5 pl-4">{ORDER_STATUS[o.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-16 max-w-[420px]">
        <h2 className="label mb-4 border-b border-ink/15 pb-2">배송비 설정</h2>
        <SettingsForm shippingFee={settings?.shipping_fee ?? 3000} freeShippingOver={settings?.free_shipping_over ?? 50000} />
      </section>
    </>
  );
}
