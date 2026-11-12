import Image from "next/image";
import Link from "next/link";
import { setProductFlag } from "@/app/admin/actions";
import { PageTitle, adminButton } from "@/components/admin/ui";
import { formatPrice } from "@/config/site";
import { requireAdmin } from "@/lib/admin";
import type { ProductRow } from "@/lib/supabase/types";

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select("*").order("sort_order").order("created_at");
  const products = (data ?? []) as ProductRow[];

  return (
    <>
      <PageTitle
        aside={
          <Link href="/admin/products/new" className={adminButton}>
            + New product
          </Link>
        }
      >
        Products
      </PageTitle>
      <p className="mb-4 text-[12px] text-muted">
        홈 배치는 5개까지 한 화면, 그 이상은 두 화면씩 이어집니다 (ObjectStage의 SPOTS). 순서(Order)대로 놓입니다.
      </p>
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {products.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 py-3">
            <span className="relative h-14 w-14 shrink-0" style={{ background: p.tint }}>
              <Image src={p.cutout} alt="" fill sizes="56px" className="object-contain p-1" />
            </span>
            <div className="min-w-40 flex-1">
              <p className="text-[14px]">
                {p.name} — {p.color}
              </p>
              <p className="label text-muted">
                #{p.sort_order} · {formatPrice(p.price)} · /{p.slug}
              </p>
            </div>
            <form action={setProductFlag.bind(null, p.id, "is_visible", !p.is_visible)}>
              <button className={`label ${p.is_visible ? "" : "text-muted line-through"}`}>
                {p.is_visible ? "Visible" : "Hidden"}
              </button>
            </form>
            <form action={setProductFlag.bind(null, p.id, "sold_out", !p.sold_out)}>
              <button className={`label ${p.sold_out ? "" : "text-muted"}`}>
                {p.sold_out ? "Sold out" : "In stock"}
              </button>
            </form>
            <Link href={`/admin/products/${p.id}`} className={adminButton}>
              Edit
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-muted">Visible / Sold out 을 누르면 바로 전환되고 사이트에 즉시 반영됩니다.</p>
    </>
  );
}
