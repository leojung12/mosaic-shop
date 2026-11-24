
import Link from "next/link";
import { BUSINESS, isTBD } from "@/config/business";
import { CATEGORIES } from "@/config/categories";
import { Seal } from "@/components/Logo";
import { BRAND_NAME, UI } from "@/config/site";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All objects" },
      ...CATEGORIES.map((c) => ({
        href: `/shop/${c.slug}`,
        label: c.label,
      })),
    ],
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

export default function Footer({
  compact = false,
}: {
  compact?: boolean;
}) {
  const items = [
    isTBD(BUSINESS.companyName)
      ? `© ${BRAND_NAME}`
      : BUSINESS.companyName,
    `CEO ${BUSINESS.ceo}`,
    `Business Reg. No. ${BUSINESS.bizNumber}`,
    `Mail-order Reg. No. ${BUSINESS.mailOrderNumber}`,
  ];

  const line = (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] leading-relaxed opacity-80 md:justify-start">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
      <Link href="/info" className="hover:underline">
        {UI.info}
      </Link>
    </div>
  );

  if (compact) {
    return (
      <footer className="relative z-10 bg-[#A9C3E2] px-5 py-6 text-[#24354A]">
        {line}
      </footer>
    );
  }

  return (
    <footer className="site-footer mt-20 overflow-hidden border-t border-[#24354A]/15 bg-[#A9C3E2] text-[#24354A] md:mt-28">
      <div className="mx-auto max-w-[1600px] px-6 pt-12 md:px-12 md:pt-16">

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[2fr_1fr_1fr_1fr]">

          <div className="col-span-2 md:col-span-1">
            <Seal className="size-[90px]" />

            <p className="mt-5 text-[12px] uppercase tracking-[0.22em]">
              A floral object shop
            </p>

            <p className="mt-4 max-w-[280px] text-[15px] leading-[1.8]">
              Objects chosen slowly, kept for a long time.
              <br />
              A small curated store in Seoul.
            </p>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.2em]">
                {c.title}
              </p>

              <ul className="mt-5 space-y-3 text-[14px] leading-relaxed">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="underline-offset-4 transition-opacity duration-300 hover:opacity-60 hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-[#24354A]/15 pt-10 text-center md:mt-20 md:pt-12">
          <p className="text-[10px] uppercase tracking-[0.3em] md:text-[12px]">
            Little pieces of everyday beauty
          </p>

          <Link href="/" aria-label="MOSAIC Home">
            <div className="mt-3 select-none font-serif text-[20vw] font-bold leading-none tracking-[-0.07em] text-[#F5C7DD] transition-opacity duration-300 hover:opacity-80 md:text-[14vw]">
              MOSAIC
            </div>
          </Link>
        </div>

        <div className="mt-8 flex flex-col items-center gap-5 border-t border-[#24354A]/20 py-6 md:flex-row md:justify-between">
          {line}

          <p className="shrink-0 text-[11px] uppercase tracking-widest">
            Curated objects · Est. 2026
          </p>
        </div>

      </div>
    </footer>
  );
}
