-- is_admin()을 API로 노출되지 않는 private 스키마로 옮긴다 (보안 점검 권고)
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- 정책을 새 함수로 교체
alter policy "admins read admin list" on public.admin_emails using ((select private.is_admin()));

alter policy "anyone reads visible products" on public.products using (is_visible or (select private.is_admin()));
alter policy "admins insert products" on public.products with check ((select private.is_admin()));
alter policy "admins update products" on public.products using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admins delete products" on public.products using ((select private.is_admin()));

alter policy "admins read waitlist" on public.waitlist using ((select private.is_admin()));
alter policy "admins update waitlist" on public.waitlist using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admins delete waitlist" on public.waitlist using ((select private.is_admin()));

alter policy "admins read inquiries" on public.inquiries using ((select private.is_admin()));
alter policy "admins update inquiries" on public.inquiries using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admins delete inquiries" on public.inquiries using ((select private.is_admin()));

alter policy "admins read events" on public.events using ((select private.is_admin()));
alter policy "admins delete events" on public.events using ((select private.is_admin()));

alter policy "admins upload product images" on storage.objects with check (bucket_id = 'products' and (select private.is_admin()));
alter policy "admins update product images" on storage.objects using (bucket_id = 'products' and (select private.is_admin()));
alter policy "admins delete product images" on storage.objects using (bucket_id = 'products' and (select private.is_admin()));

drop function public.is_admin();
