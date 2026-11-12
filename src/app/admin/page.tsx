import Link from "next/link";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";

const PERIODS = [7, 30, 90];

// 요청 시점 기준 N일 전 (쿠키를 읽은 뒤에 호출되므로 요청마다 계산된다)
const daysAgo = (days: number) => new Date(Date.now() - days * 86400_000).toISOString();

type Stat = { product_id: string; views: number; hovers: number; clicks: number; visitors: number };

export default async function Dashboard(props: PageProps<"/admin">) {
  const { supabase } = await requireAdmin();
  const { days: raw } = await props.searchParams;
  const days = PERIODS.includes(Number(raw)) ? Number(raw) : 7;
  const since = daysAgo(days);

  const [stats, products, openInquiries, pendingWaitlist, totalWaitlist] = await Promise.all([
    supabase.rpc("product_stats", { since }),
    supabase.from("products").select("id, name, color, is_visible").order("sort_order"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("waitlist").select("id", { count: "exact", head: true }).is("notified_at", null),
    supabase.from("waitlist").select("id", { count: "exact", head: true }),
  ]);

  const byId = new Map(((stats.data ?? []) as Stat[]).map((s) => [s.product_id, s]));
  const rows = (products.data ?? []).map((p) => {
    const s = byId.get(p.id);
    return {
      ...p,
      views: Number(s?.views ?? 0),
      hovers: Number(s?.hovers ?? 0),
      clicks: Number(s?.clicks ?? 0),
      visitors: Number(s?.visitors ?? 0),
    };
  });
  const total = rows.reduce(
    (a, r) => ({ views: a.views + r.views, hovers: a.hovers + r.hovers, clicks: a.clicks + r.clicks }),
    { views: 0, hovers: 0, clicks: 0 },
  );
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

  return (
    <>
      <PageTitle
        aside={
          <div className="label flex gap-3">
            {PERIODS.map((d) => (
              <Link key={d} href={`/admin?days=${d}`} className={d === days ? "underline" : "text-muted"}>
                {d}D
              </Link>
            ))}
          </div>
        }
      >
        Dashboard
      </PageTitle>

      <div className="grid grid-cols-2 gap-px bg-ink/10 md:grid-cols-5">
        <Tile label="Detail views" value={total.views} />
        <Tile label="Hovers" value={total.hovers} />
        <Tile label="Clicks" value={total.clicks} />
        <Tile label="Open inquiries" value={openInquiries.count ?? 0} href="/admin/inquiries" />
        <Tile
          label="Waitlist (pending / all)"
          value={`${pendingWaitlist.count ?? 0} / ${totalWaitlist.count ?? 0}`}
          href="/admin/waitlist"
        />
      </div>

      <h2 className="label mt-10 mb-3 text-muted">By object · last {days} days</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="label text-left text-muted">
            <tr className="border-b border-ink/15">
              <th className="py-2 font-normal">Object</th>
              <th className="py-2 text-right font-normal">Hovers</th>
              <th className="py-2 text-right font-normal">Clicks</th>
              <th className="py-2 text-right font-normal">Hover → click</th>
              <th className="py-2 text-right font-normal">Detail views</th>
              <th className="py-2 text-right font-normal">Visitors</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/10">
                <td className="py-2">
                  {r.name} — {r.color} {!r.is_visible && <span className="label text-muted">(hidden)</span>}
                </td>
                <td className="py-2 text-right">{r.hovers}</td>
                <td className="py-2 text-right">{r.clicks}</td>
                <td className="py-2 text-right">{pct(r.clicks, r.hovers)}</td>
                <td className="py-2 text-right">{r.views}</td>
                <td className="py-2 text-right">{r.visitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-muted">
        호버는 방문자·상품당 세션별 1회만 셉니다. 방문자 수는 브라우저 단위 추정치입니다.
      </p>
    </>
  );
}

function Tile({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <>
      <span className="label block text-muted">{label}</span>
      <span className="mt-2 block font-serif text-[34px] leading-none tabular-nums">{value}</span>
    </>
  );
  return href ? (
    <Link href={href} className="bg-bg p-4 hover:bg-white/50">
      {body}
    </Link>
  ) : (
    <div className="bg-bg p-4">{body}</div>
  );
}
