import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/admin/actions";
import { BRAND_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: `Admin · ${BRAND_NAME}`,
  robots: { index: false, follow: false },
};

// 관리자 화면은 손님용이 아니라 즉시 표시(정적 셸)가 필요 없다. 요청마다 서버에서 그린다.
export const instant = false;

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/inquiries", label: "Inquiries" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink/10 px-5 py-4 md:px-8">
        <Link href="/" className="font-serif text-[22px] leading-none">
          {BRAND_NAME}
        </Link>
        <span className="label text-muted">Admin</span>
        <nav className="label flex flex-wrap gap-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:opacity-60">
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="ml-auto">
          <button className="label hover:opacity-60">Log out</button>
        </form>
      </header>
      <main className="px-5 py-8 md:px-8">
        <Suspense fallback={<p className="label text-muted">Loading…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
