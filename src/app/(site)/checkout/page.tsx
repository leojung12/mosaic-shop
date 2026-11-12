import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutForm from "@/components/cart/CheckoutForm";
import { BRAND_NAME } from "@/config/site";
import { getShopSettings } from "@/lib/shop-settings";
import { serverClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: `Checkout · ${BRAND_NAME}`, robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 pt-24 pb-24 md:px-8 md:pt-28">
      <h1 className="mb-10 font-serif text-[40px] leading-none md:text-[52px]">Checkout</h1>
      <Suspense fallback={<p className="label text-muted">Loading…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

// 회원이면 이름·전화·이메일을 미리 채운다
async function Content() {
  const supabase = await serverClient();
  const [settings, { data: auth }] = await Promise.all([getShopSettings(), supabase.auth.getUser()]);
  const user = auth.user;
  const { data: profile } = user
    ? await supabase.from("profiles").select("name, phone").eq("id", user.id).maybeSingle()
    : { data: null };
  return (
    <CheckoutForm
      settings={settings}
      customerKey={user?.id ?? null}
      prefill={{ name: profile?.name ?? "", phone: profile?.phone ?? "", email: user?.email ?? "" }}
    />
  );
}
