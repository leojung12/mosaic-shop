"use client";

import { useActionState } from "react";
import { saveShopSettings } from "@/app/admin/actions";
import { AdminField, adminButton } from "./ui";

export default function SettingsForm({ shippingFee, freeShippingOver }: { shippingFee: number; freeShippingOver: number }) {
  const [state, action, pending] = useActionState(saveShopSettings, null);
  return (
    <form action={action} className="space-y-3">
      <AdminField label="기본 배송비 (원)" name="shippingFee" type="number" min={0} defaultValue={shippingFee} />
      <AdminField label="무료배송 기준 금액 (원)" name="freeShippingOver" type="number" min={0} defaultValue={freeShippingOver} />
      <button disabled={pending} className={adminButton}>
        저장
      </button>
      {state && <p className="text-[12px]">{state.message}</p>}
    </form>
  );
}
