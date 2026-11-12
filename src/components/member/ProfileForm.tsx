"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/member-actions";
import { FormMessage, SubmitButton, inputClass } from "@/components/forms";
import type { ProfileRow } from "@/lib/supabase/types";

export default function ProfileForm({ profile }: { profile: ProfileRow }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="label text-muted">Name</span>
        <input name="name" required maxLength={40} defaultValue={profile.name} className={inputClass} />
      </label>
      <label className="block">
        <span className="label text-muted">Phone</span>
        <input name="phone" type="tel" required defaultValue={profile.phone} className={inputClass} />
      </label>
      <fieldset className="space-y-2 text-[13px]">
        <legend className="label mb-2 text-muted">마케팅 정보 수신 (선택)</legend>
        <label className="mr-5 inline-flex items-center gap-2">
          <input type="checkbox" name="marketing_email" defaultChecked={profile.marketing_email} className="accent-current" />
          이메일
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="marketing_sms" defaultChecked={profile.marketing_sms} className="accent-current" />
          SMS
        </label>
      </fieldset>
      <p className="text-[12px] text-muted">
        가입일 {new Date(profile.created_at).toLocaleDateString("ko-KR")} · 약관 동의 버전 {profile.terms_version}
      </p>
      <SubmitButton>저장</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
