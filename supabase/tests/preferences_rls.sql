-- Run only against a disposable Supabase development project after migration.
-- All fixture rows are rolled back. Requires the SQL editor/postgres role.
begin;
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'rls-a@example.invalid'),
  ('00000000-0000-4000-8000-000000000002', 'rls-b@example.invalid'),
  ('00000000-0000-4000-8000-000000000003', 'rls-c@example.invalid');
insert into public.user_preferences (user_id, preferences) values
  ('00000000-0000-4000-8000-000000000001', '{"schemaVersion":1,"preferences":{"length":"3"}}'),
  ('00000000-0000-4000-8000-000000000002', '{"schemaVersion":1,"preferences":{"length":"8"}}');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
declare affected integer;
begin
  if (select count(*) from public.user_preferences) <> 1 then raise exception 'RLS read isolation failed'; end if;
  if (select preferences #>> '{preferences,length}' from public.user_preferences) <> '3' then raise exception 'Wrong owner data'; end if;
  update public.user_preferences set preferences = '{"schemaVersion":1,"preferences":{"length":"5"}}'
    where user_id = '00000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Own update failed'; end if;
  update public.user_preferences set preferences = '{"schemaVersion":1,"preferences":{}}'
    where user_id = '00000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-owner update allowed'; end if;
  begin
    update public.user_preferences set user_id = '00000000-0000-4000-8000-000000000003';
    raise exception 'Owner reassignment unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.user_preferences (user_id, preferences) values
      ('00000000-0000-4000-8000-000000000003', '{"schemaVersion":1,"preferences":{}}');
    raise exception 'Cross-owner insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.user_preferences set preferences = '{}' where user_id = '00000000-0000-4000-8000-000000000001';
    raise exception 'Malformed payload unexpectedly accepted';
  exception when check_violation then null;
  end;
end $$;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}';
do $$ begin
  if (select count(*) from public.user_preferences) <> 1 then raise exception 'Second user isolation failed'; end if;
  if (select preferences #>> '{preferences,length}' from public.user_preferences) <> '8' then raise exception 'Second user data altered'; end if;
end $$;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  begin
    perform * from public.user_preferences;
    raise exception 'Anonymous read unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
