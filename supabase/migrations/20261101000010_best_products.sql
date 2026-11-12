-- 숍 'Best' 섹션: 최근 30일 조회·클릭이 많은 상품 순서 (상품 id만 돌려주고 방문자 정보는 안 보임)
create or replace function public.best_product_ids(p_limit int default 6)
returns table (product_id uuid)
language sql
security definer
stable
set search_path = ''
as $$
  select e.product_id
  from public.events e
  where e.product_id is not null and e.created_at > now() - interval '30 days'
  group by e.product_id
  order by count(*) filter (where e.type = 'click') * 3 + count(*) desc
  limit least(p_limit, 24);
$$;
grant execute on function public.best_product_ids(int) to anon, authenticated;
