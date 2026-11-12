-- 자체 회원가입·로그인 (이메일 + 비밀번호)
-- 1) 관리자 판별을 이메일 → 계정 id 로 바꾼다.
--    회원가입이 열리면 누군가 관리자 이메일로 먼저 가입할 수 있으므로, 이메일 기반은 위험하다.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "users see own admin row" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- admin_emails 테이블은 더 이상 쓰지 않는다 (삭제는 확인 후 별도로)

-- 2) 회원 정보 ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  phone text not null check (phone ~ '^01[0-9]-[0-9]{3,4}-[0-9]{4}$'),
  terms_version text not null,
  terms_agreed_at timestamptz not null,      -- [필수] 이용약관
  privacy_agreed_at timestamptz not null,    -- [필수] 개인정보 수집·이용
  age_confirmed_at timestamptz not null,     -- [필수] 만 14세 이상
  marketing_email boolean not null default false,  -- [선택] 이메일 수신
  marketing_sms boolean not null default false,    -- [선택] SMS 수신
  marketing_agreed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create policy "members read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy "members update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 동의 기록(시각·버전)은 회원이 직접 바꿀 수 없게 열(column) 단위로 막는다
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, marketing_email, marketing_sms, marketing_agreed_at) on public.profiles to authenticated;

-- 가입 시 auth.users 메타데이터로 회원 정보를 만든다 (이메일 인증 전이라 세션이 없어도 동작)
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
  -- 관리자 대시보드에서 직접 만든 계정 등 가입 폼을 거치지 않은 경우는 건너뛴다
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
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 3) 회원 탈퇴: 본인 계정 삭제 (profiles는 cascade로 함께 삭제)
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;
  if exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception '관리자 계정은 여기서 탈퇴할 수 없습니다';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 4) 회원이 남긴 문의는 마이페이지에서 본인이 볼 수 있게 연결
alter table public.inquiries
  add column user_id uuid references auth.users(id) on delete set null default auth.uid();
create index inquiries_user_idx on public.inquiries(user_id);
alter policy "anyone sends inquiry" on public.inquiries
  with check (
    status = 'open' and answer is null and answered_at is null
    and (user_id is null or user_id = (select auth.uid()))
  );
create policy "members read own inquiries" on public.inquiries
  for select to authenticated using (user_id = (select auth.uid()));
