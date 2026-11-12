import Link from "next/link";
import { BUSINESS, isTBD } from "@/config/business";
import { CATEGORIES } from "@/config/categories";
import { Seal } from "@/components/Logo";
import { BRAND_NAME, UI } from "@/config/site";

const COLUMNS = [
  {
    title: "Shop",
    links: [{ href: "/shop", label: "All objects" }, ...CATEGORIES.map((c) => ({ href: `/shop/${c.slug}`, label: c.label }))],
  },
  {
    title: "Help",
    links: [
      { href: "/orders", label: "Order lookup" },
      { href: "/info#shipping", label: "Shipping" },
      { href: "/info#returns", label: "Returns" },
      { href: "/info#contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

// 링크 + 명세 §5의 사업자 정보 한 줄.
// compact: 모바일 홈 마지막 장처럼 자리가 좁은 곳에서는 한 줄만.
export default function Footer({ compact = false }: { compact?: boolean }) {
  const items = [
    isTBD(BUSINESS.companyName) ? `© ${BRAND_NAME}` : BUSINESS.companyName,
    `CEO ${BUSINESS.ceo}`,
    `Business Reg. No. ${BUSINESS.bizNumber}`,
    `Mail-order Reg. No. ${BUSINESS.mailOrderNumber}`,
  ];
  const line = (
    <div className="label flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] text-muted md:justify-start">
      {items.map((t) => (
        <span key={t} className="flex items-center gap-2">
          {t}
          <span aria-hidden>·</span>
        </span>
      ))}
      <Link href="/info" className="label hover:opacity-60">
        {UI.info}
      </Link>
    </div>
  );

  if (compact) {
    return (
      <footer className="px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
        {line}
      </footer>
    );
  }

  return (
    <footer className="site-footer mt-24 border-t border-current/15 pt-12 pb-[calc(24px+env(safe-area-inset-bottom))] md:mt-32 md:pt-16">
      <div className="px-5 md:px-8">
        <div className="grid grid-cols-3 gap-y-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-3 md:col-span-1">
            <Seal className="size-[104px]" />
            <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed">
              Objects chosen slowly, kept for a long time. A small curated store in Seoul.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="label text-muted">{c.title}</p>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover-line">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex border-t border-current/20 pt-6 md:mt-28 flex-col items-center gap-3 md:flex-row md:justify-between">
          {line}
          <p className="label text-muted">Curated objects · Est. 2026</p>
        </div>
      </div>
    </footer>
  );
}
