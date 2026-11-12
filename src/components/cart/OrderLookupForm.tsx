"use client";

import { useActionState } from "react";
import { lookupOrder } from "@/app/order-actions";
import { Field, FormMessage, SubmitButton } from "@/components/forms";

export default function OrderLookupForm() {
  const [state, action] = useActionState(lookupOrder, null);
  return (
    <form action={action} className="space-y-6">
      <Field label="주문번호" name="orderNumber" required placeholder="MS261102-XXXXXX" autoCapitalize="characters" />
      <Field label="휴대폰 번호" name="phone" required inputMode="tel" placeholder="010-0000-0000" />
      <SubmitButton>조회하기</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
