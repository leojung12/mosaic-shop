import Link from "next/link";
import { notFound } from "next/navigation";
import { setOrderStatus, setReturnStatus } from "@/app/admin/actions";
import { MemoForm, RefundForm, ShipForm } from "@/components/admin/OrderForms";
import { PageTitle, adminButton, formatDate } from "@/components/admin/ui";
import { formatPrice } from "@/config/site";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUS, RETURN_KIND, RETURN_STATUS, trackingUrl, type Order, type ReturnRequest } from "@/lib/orders";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*), returns:return_requests(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const o = data as Order & { admin_memo: string; marketing_agreed: boolean };
  const track = trackingUrl(o.courier, o.tracking_number);
  const live = !["pending", "canceled", "refunded"].includes(o.status);

  return (
    <div className="max-w-[880px]">
      <p className="label mb-2">
        <Link href="/admin/orders" className="text-muted hover:text-ink">
          ← Orders
        </Link>
      </p>
      <PageTitle aside={<span className="label">{ORDER_STATUS[o.status]}</span>}>{o.order_number}</PageTitle>

      <div className="grid gap-10 md:grid-cols-2">
        <Block title="주문 상품">
          <ul className="space-y-2">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>
                  {i.name} — {i.color} × {i.quantity}
                </span>
                <span className="tabular-nums">{formatPrice(i.unit_price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-ink/10 pt-3">
            <Line k="상품" v={formatPrice(o.items_amount)} />
            <Line k="배송비" v={formatPrice(o.shipping_fee)} />
            {o.discount_amount > 0 && <Line k={`쿠폰 ${o.coupon_code}`} v={`−${formatPrice(o.discount_amount)}`} />}
            <Line k="결제 금액" v={formatPrice(o.total_amount)} />
            <Line k="결제 수단" v={o.payment_method ?? "—"} />
            <Line k="결제 시각" v={o.paid_at ? formatDate(o.paid_at) : "—"} />
            {o.refunded_amount > 0 && <Line k="환불한 금액" v={formatPrice(o.refunded_amount)} />}
            {o.receipt_url && (
              <a href={o.receipt_url} target="_blank" rel="noreferrer" className="label underline">
                영수증
              </a>
            )}
          </div>
        </Block>

        <Block title="주문자 · 배송지">
          <Line k="주문자" v={`${o.orderer_name} · ${o.orderer_phone}`} />
          <Line k="이메일" v={o.orderer_email} />
          <Line k="받는 분" v={`${o.recipient_name} · ${o.recipient_phone}`} />
          <p className="mt-2">
            ({o.zipcode}) {o.address1} {o.address2}
          </p>
          {o.delivery_memo && <p className="text-muted">메모: {o.delivery_memo}</p>}
          <Line k="마케팅 수신" v={o.marketing_agreed ? "동의" : "—"} />
        </Block>

        {live && (
          <Block title="진행">
            <div className="flex flex-wrap gap-2">
              {(["paid", "preparing", "delivered"] as const).map((s) => (
                <form key={s} action={setOrderStatus.bind(null, o.id, s)}>
                  <button className={`${adminButton} ${o.status === s ? "bg-ink text-white" : ""}`}>{ORDER_STATUS[s]}</button>
                </form>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">공급처에 발주했으면 &lsquo;상품 준비 중&rsquo;으로 바꾸세요. 이후 손님은 직접 취소할 수 없습니다.</p>
            <div className="mt-6">
              <ShipForm id={o.id} courier={o.courier} tracking={o.tracking_number} />
              {track && (
                <a href={track} target="_blank" rel="noreferrer" className="label mt-2 inline-block underline">
                  배송 조회
                </a>
              )}
            </div>
          </Block>
        )}

        {(o.returns as ReturnRequest[] | undefined)?.length ? (
          <Block title="교환 · 반품 신청">
            <ul className="space-y-4">
              {(o.returns as ReturnRequest[]).map((r) => (
                <li key={r.id} className="space-y-2 border-b border-ink/10 pb-3">
                  <p>
                    <span className="label mr-2">{RETURN_KIND[r.kind]}</span>
                    {r.reason}
                  </p>
                  <p className="label text-muted">
                    {formatDate(r.created_at)} · {RETURN_STATUS[r.status]}
                  </p>
                  <div className="flex gap-2">
                    {(["approved", "rejected", "done"] as const).map((st) => (
                      <form key={st} action={setReturnStatus.bind(null, r.id!, st)}>
                        <button className={`${adminButton} ${r.status === st ? "bg-ink text-white" : ""}`}>{RETURN_STATUS[st]}</button>
                      </form>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        <Block title="관리자 메모">
          <MemoForm id={o.id} memo={o.admin_memo} />
        </Block>

        {o.status !== "canceled" && o.status !== "refunded" && (
          <Block title="취소 · 환불">
            <RefundForm id={o.id} left={o.total_amount - o.refunded_amount} />
          </Block>
        )}
        {o.canceled_at && (
          <Block title="취소 정보">
            <Line k="시각" v={formatDate(o.canceled_at)} />
            <Line k="사유" v={o.cancel_reason ?? "—"} />
          </Block>
        )}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="text-[13px]">
      <h2 className="label mb-3 border-b border-ink/15 pb-2">{title}</h2>
      {children}
    </section>
  );
}
function Line({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-4">
      <span className="text-muted">{k}</span>
      <span className="text-right tabular-nums">{v}</span>
    </p>
  );
}
