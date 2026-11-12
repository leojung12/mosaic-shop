"use client";

import { useActionState } from "react";
import { sendInquiry } from "@/app/actions";
import { Consent, Field, FormMessage, Honeypot, SubmitButton, TextArea } from "@/components/forms";
import { UI } from "@/config/site";

export default function InquiryForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(sendInquiry, null);
  if (state?.ok) return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <Honeypot />
      <Field label="Name" name="name" required maxLength={40} autoComplete="name" />
      <Field label="Email / Phone" name="contact" required autoComplete="email" />
      <TextArea label="Message" name="body" required minLength={5} maxLength={2000} />
      <Consent />
      <SubmitButton>{UI.submit}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
