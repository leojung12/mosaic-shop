"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/config/site";
import { cart, cartTotal, useCart } from "@/lib/cart";
import type { ShopSettings } from "@/lib/orders";

// 오른쪽에서 열리는 장바구니 서랍
export default function CartDrawer({ settings }: { settings: ShopSettings }) {
  const items = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mosaic:open-bag", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mosaic:open-bag", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  // 다른 페이지로 가면 닫는다
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const subtotal = cartTotal(items);
  const fee = subtotal === 0 || subtotal >= settings.freeShippingOver ? 0 : settings.shippingFee;
  const left = settings.freeShippingOver - subtotal;

  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close bag"
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Bag"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-(--bg) text-(--ink) transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-current/15 px-5 py-5">
          <h2 className="label">Bag ({items.length})</h2>
          <button type="button" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="label hover-line">
            Close
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
            <p className="text-[13px] text-muted">장바구니가 비어 있어요.</p>
            <Link href="/shop" tabIndex={open ? 0 : -1} className="label hover-line">
              Shop →
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-current/10 overflow-y-auto px-5" data-lenis-prevent>
              {items.map((i) => (
                <li key={i.productId} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${i.slug}`}
                    tabIndex={open ? 0 : -1}
                    className="relative size-20 shrink-0 bg-(--tile)"
                  >
                    <Image src={i.cutout} alt="" fill sizes="80px" className="object-contain p-2" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="font-serif text-[17px] leading-tight">{i.name}</p>
                      <p className="label mt-1 text-muted">{i.color}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Qty
                        value={i.quantity}
                        onChange={(q) => cart.setQuantity(i.productId, q)}
                        tabIndex={open ? 0 : -1}
                      />
                      <span className="label tabular-nums">{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    tabIndex={open ? 0 : -1}
                    onClick={() => cart.remove(i.productId)}
                    aria-label={`Remove ${i.name}`}
                    className="label self-start text-muted hover:text-(--ink)"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <footer className="space-y-3 border-t border-current/15 px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Shipping" value={fee === 0 ? "Free" : formatPrice(fee)} />
              {left > 0 && (
                <p className="text-[12px] text-muted">{formatPrice(left)} 더 담으면 무료배송이에요.</p>
              )}
              <Link
                href="/checkout"
                tabIndex={open ? 0 : -1}
                className="label flex w-full items-center justify-center gap-3 bg-(--ink) px-4 py-3.5 text-white transition-opacity hover:opacity-80"
              >
                <span>Checkout</span>
                <span className="opacity-50">·</span>
                <span className="tabular-nums">{formatPrice(subtotal + fee)}</span>
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="label flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </p>
  );
}

export function Qty({
  value,
  onChange,
  tabIndex,
}: {
  value: number;
  onChange: (n: number) => void;
  tabIndex?: number;
}) {
  return (
    <span className="label inline-flex items-center border border-current/25">
      <button
        type="button"
        tabIndex={tabIndex}
        aria-label="Decrease"
        onClick={() => onChange(value - 1)}
        className="px-2.5 py-1 hover:opacity-60"
      >
        −
      </button>
      <span className="min-w-6 text-center tabular-nums">{value}</span>
      <button
        type="button"
        tabIndex={tabIndex}
        aria-label="Increase"
        onClick={() => onChange(value + 1)}
        disabled={value >= 20}
        className="px-2.5 py-1 hover:opacity-60 disabled:opacity-30"
      >
        +
      </button>
    </span>
  );
}
