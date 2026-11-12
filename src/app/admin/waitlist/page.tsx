import { deleteWaitlist, markNotified } from "@/app/admin/actions";
import CsvButton from "@/components/admin/CsvButton";
import { PageTitle, formatDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { WaitlistRow } from "@/lib/supabase/types";

export default async function WaitlistPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: products }] = await Promise.all([
    supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id, name, color"),
  ]);
  const names = new Map((products ?? []).map((p) => [p.id, `${p.name} — ${p.color}`]));
  const rows = (data ?? []) as WaitlistRow[];
  const csv = [
    ["contact", "product", "created_at", "notified_at"],
    ...rows.map((r) => [
      r.contact,
      r.product_id ? (names.get(r.product_id) ?? "") : "",
      r.created_at,
      r.notified_at ?? "",
    ]),
  ];

  return (
    <>
      <PageTitle aside={<CsvButton rows={csv} filename="waitlist.csv" />}>Waitlist</PageTitle>
      <p className="mb-4 text-[12px] text-muted">
        오픈 알림 신청자입니다. 알림을 보낸 뒤 &lsquo;Notified&rsquo;로 표시하고, 목적을 다한 연락처는
        삭제하세요 (개인정보 파기).
      </p>
      {rows.length === 0 ? (
        <p className="label text-muted">No sign-ups yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="label text-left text-muted">
              <tr className="border-b border-ink/15">
                <th className="py-2 font-normal">Contact</th>
                <th className="py-2 font-normal">Object</th>
                <th className="py-2 font-normal">Signed up</th>
                <th className="py-2 font-normal">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/10">
                  <td className="py-2">{r.contact}</td>
                  <td className="py-2">{r.product_id ? names.get(r.product_id) : "—"}</td>
                  <td className="py-2 tabular-nums">{formatDate(r.created_at)}</td>
                  <td className="py-2">
                    <form action={markNotified.bind(null, r.id, !r.notified_at)}>
                      <button className={`label ${r.notified_at ? "" : "text-muted"}`}>
                        {r.notified_at ? `Notified ${formatDate(r.notified_at)}` : "Pending"}
                      </button>
                    </form>
                  </td>
                  <td className="py-2 text-right">
                    <form action={deleteWaitlist.bind(null, r.id)}>
                      <button className="label text-muted hover:text-ink">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
