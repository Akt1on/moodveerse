
create or replace function public.library_stats()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.literary_works),
    'embedded', (select count(*) from public.literary_works where embedding is not null),
    'by_language', (
      select coalesce(jsonb_object_agg(language, c), '{}'::jsonb)
      from (select language, count(*) c from public.literary_works group by language) s
    ),
    'by_source_type', (
      select coalesce(jsonb_object_agg(source_type, c), '{}'::jsonb)
      from (select source_type, count(*) c from public.literary_works group by source_type) s
    ),
    'top_emotions', (
      select coalesce(jsonb_agg(jsonb_build_object('tag', tag, 'count', c) order by c desc), '[]'::jsonb)
      from (
        select unnest(emotions_tags) as tag, count(*) c
        from public.literary_works
        group by tag
        order by c desc
        limit 15
      ) t
    ),
    'authors', (select count(distinct author) from public.literary_works),
    'last_added', (select max(created_at) from public.literary_works)
  );
$$;
