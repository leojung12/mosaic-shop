import Link from "next/link";
import AnswerForm from "@/components/admin/AnswerForm";
import { PageTitle, formatDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { InquiryRow } from "@/lib/supabase/types";

const TABS = ["open", "answered", "closed", "all"] as const;

export default async function InquiriesPage(props: PageProps<"/admin/inquiries">) {
  const { supabase } = await requireAdmin();
  const { status: raw } = await props.searchParams;
  const status = TABS.find((t) => t === raw) ?? "open";

  let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const [{ data }, { data: products }] = await Promise.all([
    query,
    supabase.from("products").select("id, name, color"),
  ]);
  const names = new Map((products ?? []).map((p) => [p.id, `${p.name} — ${p.color}`]));
  const rows = (data ?? []) as InquiryRow[];

  return (
    <>
      <PageTitle
        aside={
          <div className="label flex gap-3">
            {TABS.map((t) => (
              <Link
                key={t}
                href={`/admin/inquiries?status=${t}`}
                className={t === status ? "underline" : "text-muted"}
              >
                {t}
              </Link>
            ))}
          </div>
        }
      >
        Inquiries
      </PageTitle>
      <p className="mb-6 text-[12px] text-muted">
        답변은 손님에게 자동 발송되지 않습니다. 남긴 연락처로 직접 보낸 뒤 여기 기록하고 상태를
        &lsquo;answered&rsquo;로 바꾸세요.
      </p>
      {rows.length === 0 ? (
        <p className="label text-muted">Nothing here.</p>
      ) : (
        <ul className="space-y-6">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-4 border-t border-ink/15 pt-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="label text-muted">
                  #{r.id} · {formatDate(r.created_at)} · {r.status}
                </p>
                <p className="text-[14px]">
                  {r.name} <span className="text-muted">· {r.contact}</span>
                </p>
                {r.product_id && <p className="label">{names.get(r.product_id)}</p>}
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{r.body}</p>
              </div>
              <AnswerForm inquiry={r} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
