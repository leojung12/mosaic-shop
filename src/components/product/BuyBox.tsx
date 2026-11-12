"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Qty } from "@/components/cart/CartDrawer";
import { joinWaitlist } from "@/app/actions";
import { Consent, Field, FormMessage, Honeypot, SubmitButton } from "@/components/forms";
import { CHECKOUT_MODE, UI, formatPrice } from "@/config/site";
import { cart, openBag } from "@/lib/cart";
import type { Product } from "@/types/product";

// 구매 버튼. cart 모드면 수량 + 담기 / 바로 구매, 품절이면 재입고 알림 신청.
export default function BuyBox({ product }: { product: Product }) {
  const [state, action] = useActionState(joinWaitlist, null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  if (CHECKOUT_MODE === "cart" && !product.soldOut) {
    const item = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: product.color,
      price: product.price,
      cutout: product.cutout,
    };
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="label text-muted">Quantity</span>
          <Qty value={qty} onChange={(n) => setQty(Math.max(1, Math.min(20, n)))} />
        </div>
        <button
          type="button"
          onClick={() => {
            cart.add(item, qty);
            setAdded(true);
            openBag();
          }}
          className="label flex w-full items-center justify-center gap-3 bg-(--ink) px-4 py-3.5 text-white transition-opacity hover:opacity-80"
        >
          <span>{added ? "Added — Add again" : "Add to bag"}</span>
          <span className="opacity-50">·</span>
          <span className="tabular-nums">{formatPrice(product.price * qty)}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            cart.add(item, qty);
            router.push("/checkout");
          }}
          className="label w-full border border-current px-4 py-3 transition-opacity hover:opacity-60"
        >
          Buy now
        </button>
      </div>
    );
  }

  if (CHECKOUT_MODE === "external" && product.externalUrl && !product.soldOut) {
    return (
      <a
        href={product.externalUrl}
        target="_blank"
        rel="noreferrer"
        className="label block w-full border border-current px-4 py-3 text-center transition-opacity hover:opacity-60"
      >
        {UI.buy}
      </a>
    );
  }

  return (
    <div className="space-y-5">
      {/* 아르제식 검은 구매 바 (지금은 판매 준비 중이라 누를 수 없음) */}
      <button
        type="button"
        disabled
        className="label flex w-full cursor-not-allowed items-center justify-center gap-3 bg-(--ink) px-4 py-3.5 text-white"
      >
        <span>Total : {formatPrice(product.price)}</span>
        <span className="opacity-50">·</span>
        <span>{product.soldOut ? "Sold out" : UI.comingSoon}</span>
      </button>

      <form action={action} className="relative space-y-3">
        <p className="text-[13px]">
          {UI.notifyTitle} <span className="text-muted">— {UI.notifyHint}</span>
        </p>
        <input type="hidden" name="productId" value={product.id} />
        <Honeypot />
        <Field
          label="Email / Phone"
          name="contact"
          required
          placeholder="hello@example.com 또는 010-0000-0000"
          autoComplete="email"
        />
        <Consent />
        <SubmitButton>{UI.notifyTitle}</SubmitButton>
        <FormMessage state={state} />
      </form>
    </div>
  );
}
