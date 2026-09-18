-- Smart CMU Maintenance: dedicated login role for the app (run AFTER db/supabase-setup.sql).
-- Paste into Supabase → SQL Editor, replace CHANGE_ME with a long random password (letters and digits only), then Run.
--
-- Why: the app uses unqualified table names. Instead of changing the shared "postgres" role's search_path
-- (which would affect other work in the same project), this role has its own search_path and can only
-- touch the "SmartCMU" schema. Tables keep RLS enabled; only this role gets a policy, so the anon key stays blocked.
--
-- App connection string (Supabase transaction pooler, port 6543):
--   postgresql://smartcmu_app.<project-ref>:<password>@<pooler-host>:6543/postgres

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'smartcmu_app') then
    alter role smartcmu_app with login password 'CHANGE_ME';
  else
    create role smartcmu_app with login password 'CHANGE_ME' noinherit;
  end if;
end $$;

alter role smartcmu_app set search_path to "SmartCMU", extensions;
-- A runaway query is cancelled instead of holding a connection open.
alter role smartcmu_app set statement_timeout = '20s';

grant usage on schema "SmartCMU" to smartcmu_app;
grant select, insert, update, delete on all tables in schema "SmartCMU" to smartcmu_app;
grant usage, select, update on all sequences in schema "SmartCMU" to smartcmu_app;
alter default privileges for role postgres in schema "SmartCMU" grant select, insert, update, delete on tables to smartcmu_app;
alter default privileges for role postgres in schema "SmartCMU" grant usage, select, update on sequences to smartcmu_app;

do $$
declare t text;
begin
  foreach t in array array['users','categories','technician_skills','campuses','buildings','rooms','request_code_counters',
    'requests','request_images','request_followers','status_history','repair_notes','info_requests','ratings','notifications']
  loop
    execute format('drop policy if exists smartcmu_app_all on "SmartCMU".%I', t);
    execute format('create policy smartcmu_app_all on "SmartCMU".%I for all to smartcmu_app using (true) with check (true)', t);
  end loop;
end $$;

-- If an earlier version of the setup script changed the postgres role, undo it.
alter role postgres reset search_path;
