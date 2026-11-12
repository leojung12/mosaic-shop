-- 소셜 로그인(구글·카카오·네이버): 가입 순간엔 약관 동의가 없으므로 트리거가 막지 않게 하고,
-- 첫 로그인 뒤 '가입 마무리' 화면(/signup/complete)에서 complete_profile 로 회원 정보를 만든다.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  mk_email boolean := coalesce((m ->> 'marketing_email')::boolean, false);
  mk_sms boolean := coalesce((m ->> 'marketing_sms')::boolean, false);
begin
  -- 소셜 가입(이메일 가입이 아닌 경우)은 가입 마무리 화면에서 따로 만든다
  if coalesce(new.raw_app_meta_data ->> 'provider', 'email') <> 'email' or (m ? 'social') then
    return new;
  end if;
  if not (m ? 'name') then
    return new;
  end if;
  if coalesce((m ->> 'agree_terms')::boolean, false) is not true
     or coalesce((m ->> 'agree_privacy')::boolean, false) is not true
     or coalesce((m ->> 'agree_age')::boolean, false) is not true then
    raise exception '필수 약관에 동의해야 가입할 수 있습니다';
  end if;
  insert into public.profiles (
    id, name, phone, terms_version,
    terms_agreed_at, privacy_agreed_at, age_confirmed_at,
    marketing_email, marketing_sms, marketing_agreed_at
  ) values (
    new.id, m ->> 'name', m ->> 'phone', coalesce(m ->> 'terms_version', 'unknown'),
    now(), now(), now(),
    mk_email, mk_sms, case when mk_email or mk_sms then now() end
  );
  return new;
end;
$$;

create or replace function public.complete_profile(
  p_name text, p_phone text, p_marketing_email boolean, p_marketing_sms boolean, p_terms_version text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;
  insert into public.profiles (
    id, name, phone, terms_version,
    terms_agreed_at, privacy_agreed_at, age_confirmed_at,
    marketing_email, marketing_sms, marketing_agreed_at
  ) values (
    auth.uid(), p_name, p_phone, p_terms_version,
    now(), now(), now(),
    p_marketing_email, p_marketing_sms, case when p_marketing_email or p_marketing_sms then now() end
  )
  on conflict (id) do nothing;
end;
$$;
revoke execute on function public.complete_profile(text, text, boolean, boolean, text) from public, anon;
grant execute on function public.complete_profile(text, text, boolean, boolean, text) to authenticated;
