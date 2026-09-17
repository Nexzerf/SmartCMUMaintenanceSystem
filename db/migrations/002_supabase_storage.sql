-- Supabase only: public bucket for request photos (skipped on plain Postgres / PGlite).
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('request-images', 'request-images', true, 1258291, array['image/jpeg', 'image/png'])
    on conflict (id) do nothing;
  end if;
end $$;
